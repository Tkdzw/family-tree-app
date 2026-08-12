import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const [people, parentChildLinks, unions] = await Promise.all([
    prisma.person.findMany({ orderBy: { id: "asc" } }),
    prisma.parentChild.findMany({ orderBy: { id: "asc" } }),
    prisma.union.findMany({ orderBy: { id: "asc" } }),
  ]);

  const backup = {
    format: "chiwashira-ziwenga-family-tree-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    counts: { people: people.length, parentChildLinks: parentChildLinks.length, unions: unions.length },
    people: people.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      otherNames: p.otherNames,
      surname: p.surname,
      gender: p.gender,
      birthYear: p.birthYear,
      birthYearApprox: p.birthYearApprox,
      birthPlace: p.birthPlace,
      deceased: p.deceased,
      deathYear: p.deathYear,
      totem: p.totem,
      notes: p.notes,
      sourceNote: p.sourceNote,
      branch: p.branch,
      birthOrder: p.birthOrder,
      placeholderMotherId: p.placeholderMotherId,
    })),
    parentChildLinks: parentChildLinks.map((l) => ({ parentId: l.parentId, childId: l.childId, relType: l.relType })),
    unions: unions.map((u) => ({ partnerAId: u.partnerAId, partnerBId: u.partnerBId, type: u.type, notes: u.notes })),
  };

  const dateStr = new Date().toISOString().slice(0, 10);

  return new NextResponse(JSON.stringify(backup, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="family-tree-backup-${dateStr}.json"`,
    },
  });
}
