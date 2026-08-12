// Seeds the database from prisma/data/seed-data.json — a full export taken
// from the app itself (Backup -> Export), in the same format /api/export
// produces and /backup's import expects. This replaced the original
// spreadsheet-shaped source-tree.json once real editing (added people,
// confirmed mothers, reordering) started happening through the app — this
// file IS the current state of the tree, not just the original raw import.
//
// Run with: npx prisma db seed
//
// To refresh this after further edits: Backup -> Export in the running app,
// save the download over prisma/data/seed-data.json, then re-run this.

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

type SourcePerson = {
  id: string;
  firstName: string;
  otherNames: string | null;
  surname: string | null;
  gender: string | null;
  birthYear: number | null;
  birthYearApprox: boolean;
  birthPlace: string | null;
  deceased: boolean;
  deathYear: number | null;
  totem: string | null;
  notes: string | null;
  sourceNote: string | null;
  branch: string | null;
  birthOrder?: number | null; // absent in exports taken before the birth-order feature existed
  placeholderMotherId: string | null;
};

type SourceLink = { parentId: string; childId: string; relType?: string };
type SourceUnion = { partnerAId: string; partnerBId: string; type?: string | null; notes?: string | null };

type SourceFile = {
  people: SourcePerson[];
  parentChildLinks: SourceLink[];
  unions: SourceUnion[];
};

const raw = fs.readFileSync(path.join(__dirname, "data", "seed-data.json"), "utf-8");
const SOURCE: SourceFile = JSON.parse(raw);

// Older exports (from before the birth-order feature) don't have a
// birthOrder field at all. When it's missing, fall back to the order each
// child first appears in parentChildLinks, per parent — same convention the
// very first seed used. Once a real export includes birthOrder, that value
// wins and this fallback never runs.
function computeFallbackBirthOrder(): Record<string, number> {
  const byChild: Record<string, number> = {};
  const counters: Record<string, number> = {};
  for (const link of SOURCE.parentChildLinks) {
    if (byChild[link.childId] !== undefined) continue; // already assigned via an earlier link
    const n = counters[link.parentId] ?? 0;
    counters[link.parentId] = n + 1;
    byChild[link.childId] = n;
  }
  return byChild;
}

async function main() {
  console.log(`Loaded ${SOURCE.people.length} people, ${SOURCE.parentChildLinks.length} parent/child links, ${SOURCE.unions.length} unions from seed-data.json`);

  console.log("Clearing existing data...");
  await prisma.parentChild.deleteMany();
  await prisma.union.deleteMany();
  await prisma.person.deleteMany();

  const fallbackBirthOrder = computeFallbackBirthOrder();

  // Pass 1: create every person WITHOUT placeholderMotherId yet. The file's
  // own ordering doesn't guarantee a wife record comes before a child that
  // references her (alphabetically "c..." sorts before "w..."), so setting
  // that foreign key in the same pass as creation can fail. Set it in a
  // second pass instead, once everyone already exists.
  console.log("Creating people...");
  for (const p of SOURCE.people) {
    await prisma.person.create({
      data: {
        id: p.id,
        firstName: p.firstName,
        otherNames: p.otherNames ?? null,
        surname: p.surname ?? null,
        gender: p.gender ?? null,
        birthYear: p.birthYear ?? null,
        birthYearApprox: !!p.birthYearApprox,
        birthPlace: p.birthPlace ?? null,
        deceased: !!p.deceased,
        deathYear: p.deathYear ?? null,
        totem: p.totem ?? null,
        notes: p.notes ?? null,
        sourceNote: p.sourceNote ?? null,
        branch: p.branch ?? null,
        birthOrder: p.birthOrder ?? fallbackBirthOrder[p.id] ?? null,
      },
    });
  }

  console.log("Linking placeholder mother assignments...");
  let placeholderCount = 0;
  for (const p of SOURCE.people) {
    if (p.placeholderMotherId) {
      await prisma.person.update({
        where: { id: p.id },
        data: { placeholderMotherId: p.placeholderMotherId },
      });
      placeholderCount++;
    }
  }

  console.log("Creating parent/child links...");
  for (const l of SOURCE.parentChildLinks) {
    await prisma.parentChild.create({
      data: { parentId: l.parentId, childId: l.childId, relType: l.relType ?? "biological" },
    });
  }

  console.log("Creating unions (marriages)...");
  for (const u of SOURCE.unions) {
    await prisma.union.create({
      data: { partnerAId: u.partnerAId, partnerBId: u.partnerBId, type: u.type ?? "unknown", notes: u.notes ?? null },
    });
  }

  console.log(
    `Done. ${SOURCE.people.length} people, ${SOURCE.parentChildLinks.length} parent/child links, ${SOURCE.unions.length} unions, ${placeholderCount} placeholder mother assignments.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
