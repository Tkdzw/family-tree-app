// Seeds the database from prisma/data/source-tree.json — a cleaned,
// id-based export of the family tree (ancestor lineage, 7 wives, 21
// children, 85 grandchildren), one record per person with explicit
// parentIds / spouseIds.
//
// Run with: npx prisma db seed

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

type SourcePerson = {
  id: string;
  name: string;
  gender: string;
  parentIds: string[];
  spouseIds: string[];
  aka: string;
  years: string;
  status: string;
  notes: string;
  sourceRef: string;
  branch: string;
};

const raw = fs.readFileSync(path.join(__dirname, "data", "source-tree.json"), "utf-8");
const SOURCE: Record<string, SourcePerson> = JSON.parse(raw);

/**
 * PLACEHOLDER wife grouping — none of the 21 children have a mother recorded
 * in the source file (every one says "please assign if known"). Until the
 * real assignments are confirmed with family elders, this block-distributes
 * them evenly across the 7 wives (3 children each, in c1..c21 order) purely
 * so the tree can be browsed grouped by wife.
 *
 * THIS IS NOT VERIFIED DATA. To correct it: edit this map with the real
 * child -> wife assignments, then re-run `npm run db:seed`. Nothing else
 * needs to change — placeholderMotherId is stored separately from the real
 * ParentChild table, so fixing this never touches verified relationships.
 */
function buildPlaceholderWifeMap(): Record<string, string> {
  const childIds = Array.from({ length: 21 }, (_, i) => `c${i + 1}`);
  const wifeIds = Array.from({ length: 7 }, (_, i) => `w${i + 1}`);
  const map: Record<string, string> = {};
  childIds.forEach((childId, i) => {
    const wifeIndex = Math.floor(i / 3); // 3 children per wife, in order
    map[childId] = wifeIds[wifeIndex];
  });
  return map;
}

const PLACEHOLDER_WIFE_MAP = buildPlaceholderWifeMap();

async function main() {
  console.log(`Loaded ${Object.keys(SOURCE).length} people from source-tree.json`);

  console.log("Clearing existing data...");
  await prisma.parentChild.deleteMany();
  await prisma.union.deleteMany();
  await prisma.person.updateMany({ data: { placeholderMotherId: null } }).catch(() => {});
  await prisma.person.deleteMany();

  console.log("Creating people...");
  for (const p of Object.values(SOURCE)) {
    await prisma.person.create({
      data: {
        id: p.id, // reuse the source file's ids directly — they're already stable and readable
        firstName: p.name,
        otherNames: p.aka || null,
        gender: p.gender || null,
        notes: p.notes || null,
        sourceNote: p.sourceRef || null,
        branch: p.branch || null,
        placeholderMotherId: PLACEHOLDER_WIFE_MAP[p.id] ?? null,
      },
    });
  }

  console.log("Creating parent/child links...");
  let linkCount = 0;
  for (const p of Object.values(SOURCE)) {
    for (const parentId of p.parentIds) {
      if (!SOURCE[parentId]) continue; // guard against dangling refs
      await prisma.parentChild.create({
        data: { parentId, childId: p.id, relType: "biological" },
      });
      linkCount++;
    }
  }

  console.log("Creating unions (spouse pairs)...");
  const seenPairs = new Set<string>();
  let unionCount = 0;
  for (const p of Object.values(SOURCE)) {
    for (const spouseId of p.spouseIds) {
      if (!SOURCE[spouseId]) continue;
      const pairKey = [p.id, spouseId].sort().join("|");
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);
      await prisma.union.create({
        data: { partnerAId: p.id, partnerBId: spouseId, type: "unknown" },
      });
      unionCount++;
    }
  }

  console.log(`Done. ${Object.keys(SOURCE).length} people, ${linkCount} parent/child links, ${unionCount} unions.`);
  console.log("Reminder: wife groupings (placeholderMotherId) are an UNVERIFIED placeholder —");
  console.log("see the comment above PLACEHOLDER_WIFE_MAP in this file to correct them.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
