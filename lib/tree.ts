import { prisma } from "./prisma";

export type TreeNode = {
  id: string;
  name: string;
  surname: string | null;
  gender: string | null;
  deceased: boolean;
  birthYear: number | null;
  birthYearApprox: boolean;
  birthPlace: string | null;
  totem: string | null;
  notes: string | null;
  sourceNote: string | null;
  branch: string | null;
  placeholderMotherId: string | null;
  children: TreeNode[];
};

export type WifeGroup = {
  wife: { id: string; name: string; verified: boolean };
  children: TreeNode[];
};

export type PatriarchView = {
  lineage: { id: string; name: string }[]; // ancestors before the patriarch, oldest first
  patriarch: TreeNode; // includes all descendants recursively via .children
  wifeGroups: WifeGroup[];
  unassignedChildren: TreeNode[]; // children with no wife grouping at all
  stats: {
    totalPeople: number;
    branchCount: number; // number of patriarch's children
    descendantCount: number;
    wifeCount: number;
    maxDepth: number;
  };
};

// sorts ids like "c1","c2",..."c21" numerically instead of lexicographically
function sortById(ids: string[]): string[] {
  return [...ids].sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, ""), 10) || 0;
    const nb = parseInt(b.replace(/\D/g, ""), 10) || 0;
    return na - nb;
  });
}

export async function getPatriarchView(): Promise<PatriarchView | null> {
  const people = await prisma.person.findMany();
  const links = await prisma.parentChild.findMany();
  const unions = await prisma.union.findMany();

  if (people.length === 0) return null;

  const byId = new Map(people.map((p) => [p.id, p]));
  const childIdsOf = new Map<string, string[]>();
  const isChild = new Set<string>();

  for (const l of links) {
    if (!childIdsOf.has(l.parentId)) childIdsOf.set(l.parentId, []);
    childIdsOf.get(l.parentId)!.push(l.childId);
    isChild.add(l.childId);
  }
  for (const [parentId, kids] of childIdsOf) childIdsOf.set(parentId, sortById(kids));

  const rootPerson = people.find((p) => !isChild.has(p.id));
  if (!rootPerson) return null;

  // Walk down the single-child ancestor chain (Mbiru -> ... ) until we hit
  // the person with more than one recorded child — that's the patriarch,
  // the branching point the rest of the tree fans out from.
  const lineage: { id: string; name: string }[] = [];
  let cursorId = rootPerson.id;
  while ((childIdsOf.get(cursorId) ?? []).length === 1) {
    const p = byId.get(cursorId)!;
    lineage.push({ id: p.id, name: p.firstName });
    cursorId = childIdsOf.get(cursorId)![0];
  }
  const patriarchId = cursorId;

  let maxDepth = 0;
  function build(personId: string, depth: number): TreeNode {
    maxDepth = Math.max(maxDepth, depth);
    const p = byId.get(personId)!;
    const childIds = childIdsOf.get(personId) ?? [];
    return {
      id: p.id,
      name: p.firstName,
      surname: p.surname,
      gender: p.gender,
      deceased: p.deceased,
      birthYear: p.birthYear,
      birthYearApprox: p.birthYearApprox,
      birthPlace: p.birthPlace,
      totem: p.totem,
      notes: p.notes,
      sourceNote: p.sourceNote,
      branch: p.branch,
      placeholderMotherId: p.placeholderMotherId,
      children: childIds.map((id) => build(id, depth + 1)),
    };
  }

  const patriarch = build(patriarchId, 0);

  // wives: anyone in a Union with the patriarch
  const wifeIds = sortById(
    unions
      .filter((u) => u.partnerAId === patriarchId || u.partnerBId === patriarchId)
      .map((u) => (u.partnerAId === patriarchId ? u.partnerBId : u.partnerAId))
      .filter((id): id is string => !!id)
  );

  const wifeGroups: WifeGroup[] = wifeIds.map((wifeId) => {
    const w = byId.get(wifeId)!;
    return {
      wife: { id: w.id, name: w.firstName, verified: !w.notes?.toLowerCase().includes("not recorded") },
      children: patriarch.children.filter((c) => c.placeholderMotherId === wifeId),
    };
  });

  const unassignedChildren = patriarch.children.filter(
    (c) => !c.placeholderMotherId || !wifeIds.includes(c.placeholderMotherId)
  );

  return {
    lineage,
    patriarch,
    wifeGroups,
    unassignedChildren,
    stats: {
      totalPeople: people.length,
      branchCount: patriarch.children.length,
      descendantCount: people.length - lineage.length - 1,
      wifeCount: wifeIds.length,
      maxDepth: maxDepth - lineage.length, // depth relative to the patriarch, not the root ancestor
    },
  };
}
