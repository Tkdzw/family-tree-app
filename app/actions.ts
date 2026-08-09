"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updatePersonDetails(formData: FormData) {
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

/** Links two already-existing people with a chosen relationship. */
export async function linkExistingRelative(formData: FormData) {
  const personId = formData.get("personId") as string;
  const otherId = formData.get("otherId") as string;
  const relation = formData.get("relation") as string; // "parent" | "child" | "spouse"
  if (!personId || !otherId || personId === otherId) return;

  if (relation === "parent") {
    await prisma.parentChild.create({
      data: { parentId: otherId, childId: personId, relType: "biological" },
    });
  } else if (relation === "child") {
    await prisma.parentChild.create({
      data: { parentId: personId, childId: otherId, relType: "biological" },
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
