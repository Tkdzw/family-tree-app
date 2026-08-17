"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/authz";

export async function updatePersonDetails(formData: FormData) {
  await requireAuth();
  const id = formData.get("id") as string;
  if (!id) return;

  const birthYearRaw = (formData.get("birthYear") as string) ?? "";
  const birthYear = birthYearRaw.trim() ? parseInt(birthYearRaw, 10) : null;

  await prisma.person.update({
    where: { id },
    data: {
      firstName: (formData.get("firstName") as string) || undefined,
      surname: (formData.get("surname") as string) || null,
      gender: (formData.get("gender") as string) || null,
      birthYear: birthYear !== null && Number.isFinite(birthYear) ? birthYear : null,
      birthYearApprox: formData.get("birthYearApprox") === "on",
      birthPlace: (formData.get("birthPlace") as string) || null,
      totem: (formData.get("totem") as string) || null,
      notes: (formData.get("notes") as string) || null,
      sourceNote: (formData.get("sourceNote") as string) || null,
      deceased: formData.get("deceased") === "on",
    },
  });

  revalidatePath("/");
  revalidatePath(`/person/${id}`);
}

/**
 * Assigns or verifies which wife a child belongs to.
 * - "verify" writes a real ParentChild row (parent = the chosen wife), making
 *   this a confirmed fact rather than a placeholder guess. Any previous
 *   placeholder guess for this child is cleared, and any other female parent
 *   link already on file for this child is removed first, so a child never
 *   ends up with two confirmed mothers.
 * - Unchecked, it just updates the placeholder guess without claiming it's verified.
 */
export async function setChildMother(formData: FormData) {
  await requireAuth();
  const childId = formData.get("childId") as string;
  const wifeId = formData.get("wifeId") as string;
  const verify = formData.get("verify") === "on";

  if (!childId || !wifeId) return;

  if (verify) {
    const existingParentLinks = await prisma.parentChild.findMany({ where: { childId } });
    for (const link of existingParentLinks) {
      const parent = await prisma.person.findUnique({ where: { id: link.parentId } });
      if (parent?.gender === "F") {
        await prisma.parentChild.delete({ where: { id: link.id } });
      }
    }
    await prisma.parentChild.create({
      data: { parentId: wifeId, childId, relType: "biological" },
    });
    await prisma.person.update({ where: { id: childId }, data: { placeholderMotherId: null } });
  } else {
    await prisma.person.update({ where: { id: childId }, data: { placeholderMotherId: wifeId } });
  }

  revalidatePath("/");
  revalidatePath(`/person/${childId}`);
}

/** Removes a verified mother link, reverting the child back to unassigned/placeholder. */
export async function clearVerifiedMother(formData: FormData) {
  await requireAuth();
  const childId = formData.get("childId") as string;
  if (!childId) return;

  const existingParentLinks = await prisma.parentChild.findMany({ where: { childId } });
  for (const link of existingParentLinks) {
    const parent = await prisma.person.findUnique({ where: { id: link.parentId } });
    if (parent?.gender === "F") {
      await prisma.parentChild.delete({ where: { id: link.id } });
    }
  }

  revalidatePath("/");
  revalidatePath(`/person/${childId}`);
}

/** Creates a brand-new person as a child of the given parent. */
export async function addChild(formData: FormData) {
  await requireAuth();
  const parentId = formData.get("parentId") as string;
  const name = ((formData.get("name") as string) || "").trim();
  if (!parentId || !name) return;

  const child = await prisma.person.create({
    data: { firstName: name, gender: (formData.get("gender") as string) || null },
  });
  await prisma.parentChild.create({
    data: { parentId, childId: child.id, relType: "biological" },
  });

  revalidatePath("/");
  revalidatePath(`/person/${parentId}`);
}

/** Creates a brand-new person as a spouse of the given person. */
export async function addNewSpouse(formData: FormData) {
  await requireAuth();
  const personId = formData.get("personId") as string;
  const name = ((formData.get("name") as string) || "").trim();
  if (!personId || !name) return;

  const spouse = await prisma.person.create({
    data: { firstName: name, gender: (formData.get("gender") as string) || null },
  });
  await prisma.union.create({
    data: { partnerAId: personId, partnerBId: spouse.id, type: "unknown" },
  });

  revalidatePath("/");
  revalidatePath(`/person/${personId}`);
}

/**
 * Moves a child up or down one position in birth order among their full
 * sibling group (everyone sharing that same parent). Normalizes everyone's
 * birthOrder to a clean 0..n-1 sequence first, so this works correctly even
 * for siblings that never had an explicit order set.
 */
export async function reorderChild(formData: FormData) {
  await requireAuth();
  const parentId = formData.get("parentId") as string;
  const childId = formData.get("childId") as string;
  const direction = formData.get("direction") as string; // "up" | "down"
  if (!parentId || !childId) return;

  const links = await prisma.parentChild.findMany({
    where: { parentId },
    include: { child: true },
  });

  const sorted = [...links].sort((a, b) => {
    const oa = a.child.birthOrder;
    const ob = b.child.birthOrder;
    if (oa != null && ob != null) return oa - ob;
    if (oa != null) return -1;
    if (ob != null) return 1;
    const na = parseInt(a.childId.replace(/\D/g, ""), 10) || 0;
    const nb = parseInt(b.childId.replace(/\D/g, ""), 10) || 0;
    return na - nb;
  });

  const idx = sorted.findIndex((l) => l.childId === childId);
  if (idx === -1) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= sorted.length) return; // already at an end

  // normalize everyone to a clean sequential order matching current display order
  await Promise.all(sorted.map((link, i) => prisma.person.update({ where: { id: link.childId }, data: { birthOrder: i } })));

  // then swap the two positions being moved
  const movedId = sorted[idx].childId;
  const swappedId = sorted[swapIdx].childId;
  await prisma.person.update({ where: { id: movedId }, data: { birthOrder: swapIdx } });
  await prisma.person.update({ where: { id: swappedId }, data: { birthOrder: idx } });

  revalidatePath("/");
  revalidatePath(`/person/${parentId}`);
  for (const link of sorted) revalidatePath(`/person/${link.childId}`);
}

/** Links two already-existing people with a chosen relationship. */
export async function linkExistingRelative(formData: FormData) {
  await requireAuth();
  const personId = formData.get("personId") as string;
  const otherId = formData.get("otherId") as string;
  const relation = formData.get("relation") as string; // "parent" | "child" | "spouse"
  if (!personId || !otherId || personId === otherId) return;

  // relation describes personId's role relative to otherId, matching the
  // dropdown label ("is the parent of" -> personId is the parent).
  if (relation === "parent") {
    await prisma.parentChild.create({
      data: { parentId: personId, childId: otherId, relType: "biological" },
    });
  } else if (relation === "child") {
    await prisma.parentChild.create({
      data: { parentId: otherId, childId: personId, relType: "biological" },
    });
  } else if (relation === "spouse") {
    await prisma.union.create({
      data: { partnerAId: personId, partnerBId: otherId, type: "unknown" },
    });
  }

  revalidatePath("/");
  revalidatePath(`/person/${personId}`);
  revalidatePath(`/person/${otherId}`);
}

/**
 * Links multiple existing children to a spouse at once — e.g. once a wife
 * is on file, assign several of her husband's already-recorded children to
 * her as mother in one go instead of doing it one at a time. Any existing
 * female parent already recorded for a selected child is removed first (a
 * child shouldn't end up with two different confirmed mothers), and if the
 * child had a placeholder wife guess, it's cleared since a real link now
 * supersedes it.
 */
export async function bulkLinkChildrenToSpouse(formData: FormData) {
  await requireAuth();

  const spouseId = formData.get("spouseId") as string;
  const childIds = formData.getAll("childIds") as string[];
  if (!spouseId || childIds.length === 0) return;

  const spouse = await prisma.person.findUnique({ where: { id: spouseId } });
  if (!spouse) return;

  for (const childId of childIds) {
    if (spouse.gender === "F") {
      const existingParentLinks = await prisma.parentChild.findMany({ where: { childId } });
      for (const link of existingParentLinks) {
        const parent = await prisma.person.findUnique({ where: { id: link.parentId } });
        if (parent?.gender === "F") {
          await prisma.parentChild.delete({ where: { id: link.id } });
        }
      }
    }
    await prisma.parentChild.create({
      data: { parentId: spouseId, childId, relType: "biological" },
    });
    await prisma.person.update({ where: { id: childId }, data: { placeholderMotherId: null } });
  }

  revalidatePath("/");
  revalidatePath(`/person/${spouseId}`);
  for (const childId of childIds) revalidatePath(`/person/${childId}`);
}

/**
 * Restores the database from a JSON backup produced by /api/export.
 * This is a full REPLACE, not a merge — every current Person, ParentChild,
 * and Union row is deleted first. IDs are preserved from the backup file so
 * relationships resolve correctly.
 */
export async function importBackup(formData: FormData) {
  await requireAuth();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    redirect("/backup?error=" + encodeURIComponent("No file selected."));
  }

  let parsed: {
    people?: Array<Record<string, unknown>>;
    parentChildLinks?: Array<{ parentId: string; childId: string; relType?: string }>;
    unions?: Array<{ partnerAId: string; partnerBId: string; type?: string; notes?: string }>;
  };
  try {
    const text = await file!.text();
    parsed = JSON.parse(text);
  } catch {
    redirect("/backup?error=" + encodeURIComponent("That file isn't valid JSON."));
  }

  if (!parsed!.people || !Array.isArray(parsed!.people)) {
    redirect("/backup?error=" + encodeURIComponent("That doesn't look like a family tree backup file — no people[] array found."));
  }

  let importError: string | null = null;
  let importedCount = 0;
  try {
    await prisma.parentChild.deleteMany();
    await prisma.union.deleteMany();
    await prisma.person.deleteMany();

    // Pass 1: create everyone WITHOUT placeholderMotherId. The file's people
    // order doesn't guarantee a wife record exists before a child that
    // references her as a placeholder mother (e.g. plain id-sort puts "c..."
    // before "w..."), so setting that foreign key in the same pass as
    // creation can fail partway through. Set it in a second pass instead,
    // once every person already exists.
    for (const p of parsed!.people!) {
      await prisma.person.create({
        data: {
          id: p.id as string,
          firstName: p.firstName as string,
          otherNames: (p.otherNames as string) ?? null,
          surname: (p.surname as string) ?? null,
          gender: (p.gender as string) ?? null,
          birthYear: (p.birthYear as number) ?? null,
          birthYearApprox: !!p.birthYearApprox,
          birthPlace: (p.birthPlace as string) ?? null,
          deceased: !!p.deceased,
          deathYear: (p.deathYear as number) ?? null,
          totem: (p.totem as string) ?? null,
          notes: (p.notes as string) ?? null,
          sourceNote: (p.sourceNote as string) ?? null,
          branch: (p.branch as string) ?? null,
          birthOrder: (p.birthOrder as number) ?? null,
        },
      });
      importedCount++;
    }

    for (const p of parsed!.people!) {
      if (p.placeholderMotherId) {
        await prisma.person.update({
          where: { id: p.id as string },
          data: { placeholderMotherId: p.placeholderMotherId as string },
        });
      }
    }

    for (const l of parsed!.parentChildLinks ?? []) {
      await prisma.parentChild.create({
        data: { parentId: l.parentId, childId: l.childId, relType: l.relType ?? "biological" },
      });
    }

    for (const u of parsed!.unions ?? []) {
      await prisma.union.create({
        data: { partnerAId: u.partnerAId, partnerBId: u.partnerBId, type: u.type ?? "unknown", notes: u.notes ?? null },
      });
    }
  } catch (e) {
    console.error("Import failed:", e);
    importError =
      "Import failed partway through — the database may now be in a mixed state. Consider restoring an earlier backup or re-running the seed script.";
  }

  revalidatePath("/");

  if (importError) {
    redirect("/backup?error=" + encodeURIComponent(importError));
  }
  redirect("/backup?success=1&count=" + importedCount);
}
