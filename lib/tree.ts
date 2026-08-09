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
  motherId: string | null; // effective mother: verified ParentChild link if one exists, else the unverified placeholder
  motherVerified: boolean; // true if motherId comes from a real ParentChild row, not just a placeholder guess
  children: TreeNode[];
};

export type WifeGroup = {
  wife: { id: string; name: string };
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
    verifiedMotherCount: number;
  };
};

/** Depth-first search for a node anywhere in a built tree, by id. */
export function findNodeInTree(root: TreeNode, id: string): TreeNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNodeInTree(child, id);
    if (found) return found;
  }
  return null;
}

/**
 * Finds the true top of the whole tree (Mbiru, in the current data) from the
 * raw ParentChild links.
 *
 * IMPORTANT: "has no recorded parent" is NOT enough on its own to identify
 * the root — every wife also has no recorded parent (they're only linked in
 * via marriage/Union, never as anyone's child), so a naive `.find()` over
 * unordered query results can just as easily land on a wife as on the real
 * root, and which one it picks can change between requests (e.g. right
 * after an UPDATE reorders rows in the underlying table). To make this
 * deterministic regardless of row order, we consider every parentless
 * person a candidate and pick whichever one's ParentChild subtree reaches
 * the most people — the real lineage root reaches everyone; a wife with no
 * verified children reaches nobody, and even a wife with a couple of
 * verified children reaches nowhere near the whole tree.
 */
export function findLineageRootId(
  peopleIds: string[],
  childIdsOf: Map<string, string[]>,
  isChild: Set<string>
): string | null {
  const candidates = peopleIds.filter((id) => !isChild.has(id));
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  function subtreeSize(startId: string): number {
    let count = 0;
    const stack = [startId];
    const seen = new Set<string>();
    while (stack.length) {
      const id = stack.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      count++;
      for (const childId of childIdsOf.get(id) ?? []) stack.push(childId);
    }
    return count - 1; // exclude the start node itself
  }

  let best = candidates[0];
  let bestSize = -1;
  for (const id of candidates) {
    const size = subtreeSize(id);
    if (size > bestSize) {
      best = id;
      bestSize = size;
    }
  }
  return best;
}

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
  const parentIdsOf = new Map<string, string[]>();
  const isChild = new Set<string>();

  for (const l of links) {
    if (!childIdsOf.has(l.parentId)) childIdsOf.set(l.parentId, []);
    childIdsOf.get(l.parentId)!.push(l.childId);
    if (!parentIdsOf.has(l.childId)) parentIdsOf.set(l.childId, []);
    parentIdsOf.get(l.childId)!.push(l.parentId);
    isChild.add(l.childId);
  }
  for (const [parentId, kids] of childIdsOf) childIdsOf.set(parentId, sortById(kids));

  const rootId = findLineageRootId(people.map((p) => p.id), childIdsOf, isChild);
  if (!rootId) return null;

  // Walk down the single-child ancestor chain (Mbiru -> ... ) until we hit
  // the person with more than one recorded child — that's the patriarch,
  // the branching point the rest of the tree fans out from.
  const lineage: { id: string; name: string }[] = [];
  let cursorId = rootId;
  while ((childIdsOf.get(cursorId) ?? []).length === 1) {
    const p = byId.get(cursorId)!;
    lineage.push({ id: p.id, name: p.firstName });
    cursorId = childIdsOf.get(cursorId)![0];
  }
  const patriarchId = cursorId;

  // wives: anyone in a Union with the patriarch
  const wifeIds = new Set(
    sortById(
      unions
        .filter((u) => u.partnerAId === patriarchId || u.partnerBId === patriarchId)
        .map((u) => (u.partnerAId === patriarchId ? u.partnerBId : u.partnerAId))
        .filter((id): id is string => !!id)
    )
  );

  let maxDepth = 0;
  let verifiedMotherCount = 0;

  function build(personId: string, depth: number): TreeNode {
    maxDepth = Math.max(maxDepth, depth);
    const p = byId.get(personId)!;
    const childIds = childIdsOf.get(personId) ?? [];

    const recordedParents = parentIdsOf.get(personId) ?? [];
    const verifiedMotherId = recordedParents.find((pid) => wifeIds.has(pid)) ?? null;
    if (verifiedMotherId) verifiedMotherCount++;

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
      motherId: verifiedMotherId ?? p.placeholderMotherId,
      motherVerified: !!verifiedMotherId,
      children: childIds.map((id) => build(id, depth + 1)),
    };
  }

  const patriarch = build(patriarchId, 0);
  const sortedWifeIds = sortById([...wifeIds]);

  const wifeGroups: WifeGroup[] = sortedWifeIds.map((wifeId) => {
    const w = byId.get(wifeId)!;
    return {
      wife: { id: w.id, name: w.firstName },
      children: patriarch.children.filter((c) => c.motherId === wifeId),
    };
  });

  const unassignedChildren = patriarch.children.filter(
    (c) => !c.motherId || !wifeIds.has(c.motherId)
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
      wifeCount: wifeIds.size,
      maxDepth: maxDepth - lineage.length,
      verifiedMotherCount,
    },
  };
}

async function computePatriarchId(): Promise<string | null> {
  const people = await prisma.person.findMany({ select: { id: true } });
  const links = await prisma.parentChild.findMany({ select: { parentId: true, childId: true } });
  const isChild = new Set(links.map((l) => l.childId));

  const childIdsOf = new Map<string, string[]>();
  for (const l of links) {
    if (!childIdsOf.has(l.parentId)) childIdsOf.set(l.parentId, []);
    childIdsOf.get(l.parentId)!.push(l.childId);
  }

  const rootId = findLineageRootId(people.map((p) => p.id), childIdsOf, isChild);
  if (!rootId) return null;

  let cursorId = rootId;
  while ((childIdsOf.get(cursorId) ?? []).length === 1) {
    cursorId = childIdsOf.get(cursorId)![0];
  }
  return cursorId;
}

export async function getPatriarchId(): Promise<string | null> {
  return computePatriarchId();
}

/** Just the 7 wife records, for edit-form dropdowns. */
export async function getWives(): Promise<{ id: string; name: string }[]> {
  const patriarchId = await computePatriarchId();
  if (!patriarchId) return [];

  const people = await prisma.person.findMany();
  const unions = await prisma.union.findMany();

  const wifeIds = sortById(
    unions
      .filter((u) => u.partnerAId === patriarchId || u.partnerBId === patriarchId)
      .map((u) => (u.partnerAId === patriarchId ? u.partnerBId : u.partnerAId))
      .filter((id): id is string => !!id)
  );
  const byId = new Map(people.map((p) => [p.id, p]));
  return wifeIds.map((id) => ({ id, name: byId.get(id)!.firstName }));
}
