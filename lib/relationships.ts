import { prisma } from "./prisma";
import { findLineageRootId } from "./tree";

export type PersonRef = {
  id: string;
  name: string;
  surname: string | null;
  deceased: boolean;
};

type Graph = {
  byId: Map<
    string,
    PersonRef & {
      totem: string | null;
      birthYear: number | null;
      birthYearApprox: boolean;
      birthPlace: string | null;
      notes: string | null;
      sourceNote: string | null;
      gender: string | null;
      birthOrder: number | null;
    }
  >;
  parentsOf: Map<string, string[]>;
  childrenOf: Map<string, string[]>;
  adjacency: Map<string, string[]>;
  rootId: string | null;
};

function sortByBirthOrder(ids: string[], g: Graph): string[] {
  return [...ids].sort((a, b) => {
    const oa = g.byId.get(a)?.birthOrder;
    const ob = g.byId.get(b)?.birthOrder;
    if (oa != null && ob != null) return oa - ob;
    if (oa != null) return -1;
    if (ob != null) return 1;
    const na = parseInt(a.replace(/\D/g, ""), 10) || 0;
    const nb = parseInt(b.replace(/\D/g, ""), 10) || 0;
    return na - nb;
  });
}

async function loadGraph(): Promise<Graph> {
  const people = await prisma.person.findMany();
  const links = await prisma.parentChild.findMany();

  const byId = new Map(
    people.map((p) => [
      p.id,
      {
        id: p.id,
        name: p.firstName,
        surname: p.surname,
        deceased: p.deceased,
        totem: p.totem,
        birthYear: p.birthYear,
        birthYearApprox: p.birthYearApprox,
        birthPlace: p.birthPlace,
        notes: p.notes,
        sourceNote: p.sourceNote,
        gender: p.gender,
        birthOrder: p.birthOrder,
      },
    ])
  );

  const parentsOf = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();
  const adjacency = new Map<string, string[]>();
  const isChild = new Set<string>();

  const push = (map: Map<string, string[]>, key: string, val: string) => {
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(val);
  };

  for (const l of links) {
    push(parentsOf, l.childId, l.parentId);
    push(childrenOf, l.parentId, l.childId);
    push(adjacency, l.parentId, l.childId);
    push(adjacency, l.childId, l.parentId);
    isChild.add(l.childId);
  }

  const rootId = findLineageRootId(people.map((p) => p.id), childrenOf, isChild);

  const graph = { byId, parentsOf, childrenOf, adjacency, rootId };
  // now that byId exists, sort each parent's children by birth order
  for (const [parentId, kids] of childrenOf) childrenOf.set(parentId, sortByBirthOrder(kids, graph));

  return graph;
}

function toRef(g: Graph, id: string): PersonRef {
  const p = g.byId.get(id)!;
  return { id: p.id, name: p.name, surname: p.surname, deceased: p.deceased };
}

export type SiblingEntry = PersonRef & { birthOrder: number | null; isSelf: boolean; position: number };

export type PersonProfile = {
  person: PersonRef & { totem: string | null; birthYear: number | null; birthYearApprox: boolean; birthPlace: string | null; notes: string | null; sourceNote: string | null; gender: string | null; birthOrder: number | null };
  parents: PersonRef[];
  children: PersonRef[];
  siblingGroup: SiblingEntry[]; // full sibling set INCLUDING self, ordered by birth position
  spouses: PersonRef[];
  ancestorPath: PersonRef[]; // root ... parent (not including self)
};

export async function getPersonProfile(id: string): Promise<PersonProfile | null> {
  const g = await loadGraph();
  const p = g.byId.get(id);
  if (!p) return null;

  const parentIds = g.parentsOf.get(id) ?? [];
  const childIds = g.childrenOf.get(id) ?? [];

  // full sibling group (everyone who shares at least one parent with this
  // person, including the person themself), ordered by birth position
  const siblingGroupIds = new Set<string>([id]);
  for (const parentId of parentIds) {
    for (const sibId of g.childrenOf.get(parentId) ?? []) {
      siblingGroupIds.add(sibId);
    }
  }
  const orderedSiblingIds = sortByBirthOrder([...siblingGroupIds], g);
  const siblingGroup: SiblingEntry[] = orderedSiblingIds.map((sid, i) => {
    const ref = toRef(g, sid);
    const birthOrder = g.byId.get(sid)?.birthOrder ?? null;
    return { ...ref, birthOrder, isSelf: sid === id, position: i + 1 };
  });

  const unions = await prisma.union.findMany({
    where: { OR: [{ partnerAId: id }, { partnerBId: id }] },
  });
  const spouseIds = unions
    .map((u) => (u.partnerAId === id ? u.partnerBId : u.partnerAId))
    .filter((sid): sid is string => !!sid && g.byId.has(sid));

  // ancestor path: walk up via first recorded parent (most people currently
  // have at most one parent on file — this walks whichever chain exists)
  const ancestorPath: PersonRef[] = [];
  let cursor = parentIds[0];
  const seen = new Set<string>();
  while (cursor && !seen.has(cursor)) {
    seen.add(cursor);
    ancestorPath.unshift(toRef(g, cursor));
    cursor = (g.parentsOf.get(cursor) ?? [])[0];
  }

  return {
    person: p,
    parents: parentIds.map((pid) => toRef(g, pid)),
    children: childIds.map((cid) => toRef(g, cid)),
    siblingGroup,
    spouses: spouseIds.map((sid) => toRef(g, sid)),
    ancestorPath,
  };
}

export type FlatPerson = PersonRef & { breadcrumb: string };

/** Every person in the tree, flattened, with a readable breadcrumb path from the root. Used for search/select UI. */
export async function getAllPeopleFlat(): Promise<FlatPerson[]> {
  const g = await loadGraph();
  if (!g.rootId) return [];

  const out: FlatPerson[] = [];

  function walk(id: string, trail: string[]) {
    const p = g.byId.get(id)!;
    const label = `${p.name}${p.surname ? " " + p.surname : ""}`;
    const breadcrumb = trail.join(" › ");
    out.push({ id: p.id, name: p.name, surname: p.surname, deceased: p.deceased, breadcrumb });
    for (const childId of g.childrenOf.get(id) ?? []) {
      walk(childId, [...trail, label]);
    }
  }

  walk(g.rootId, []);
  return out;
}

export type ConnectionStep = {
  person: PersonRef;
  relationToPrevious: "start" | "parent" | "child";
};

export type ConnectionResult = {
  path: ConnectionStep[];
  commonAncestor: PersonRef | null;
  generationsFromAToAncestor: number;
  generationsFromBToAncestor: number;
};

function greats(n: number): string {
  if (n <= 0) return "";
  if (n <= 4) return "great-".repeat(n);
  return `${n}x-great-`;
}

function ordinalWord(n: number): string {
  const words = ["zeroth", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"];
  return n < words.length ? words[n] : `${n}th`;
}

function descendantTerm(depth: number): string {
  if (depth === 1) return "child";
  if (depth === 2) return "grandchild";
  return `${greats(depth - 2)}grandchild`;
}

function ancestorTerm(depth: number): string {
  if (depth === 1) return "parent";
  if (depth === 2) return "grandparent";
  return `${greats(depth - 2)}grandparent`;
}

/**
 * Plain-English relationship summary from each person's generation-distance
 * to their common ancestor — "first cousins", "aunt/uncle and niece/nephew",
 * "great-grandparent and great-grandchild", etc. Gender-neutral throughout
 * since gender isn't reliably recorded for everyone in the tree.
 */
export function describeRelationship(aName: string, bName: string, genA: number, genB: number): string {
  if (genA === 0 && genB === 0) return `${aName} and ${bName} are the same person.`;

  const n = Math.min(genA, genB);
  const d = Math.abs(genA - genB);
  const olderIsA = genA < genB; // fewer generations from the ancestor = the older generation

  if (n === 0) {
    const depth = Math.max(genA, genB);
    const ancestorName = genA === 0 ? aName : bName;
    const descName = genA === 0 ? bName : aName;
    return `${descName} is ${ancestorName}'s ${descendantTerm(depth)} — ${ancestorName} is ${descName}'s ${ancestorTerm(depth)}.`;
  }

  if (n === 1 && d === 0) {
    return `${aName} and ${bName} are siblings.`;
  }

  if (n === 1) {
    const greatCount = d - 1;
    const olderName = olderIsA ? aName : bName;
    const youngerName = olderIsA ? bName : aName;
    return `${olderName} is ${youngerName}'s ${greats(greatCount)}aunt/uncle — ${youngerName} is ${olderName}'s ${greats(greatCount)}niece/nephew.`;
  }

  const cousinDegree = n - 1;
  const removedText = d > 0 ? `, ${d} time${d > 1 ? "s" : ""} removed` : "";
  return `${aName} and ${bName} are ${ordinalWord(cousinDegree)} cousins${removedText}.`;
}

/**
 * Shortest path between two people through the parent/child graph, treated as
 * undirected for the search, then labeled with direction for display. Good
 * enough for "how are we related" without needing formal cousin terminology.
 */
export async function findConnection(idA: string, idB: string): Promise<ConnectionResult | null> {
  const g = await loadGraph();
  if (!g.byId.has(idA) || !g.byId.has(idB)) return null;
  if (idA === idB) return { path: [{ person: toRef(g, idA), relationToPrevious: "start" }], commonAncestor: toRef(g, idA), generationsFromAToAncestor: 0, generationsFromBToAncestor: 0 };

  // BFS
  const prev = new Map<string, string>();
  const visited = new Set<string>([idA]);
  const queue = [idA];
  let found = false;

  while (queue.length && !found) {
    const current = queue.shift()!;
    for (const next of g.adjacency.get(current) ?? []) {
      if (visited.has(next)) continue;
      visited.add(next);
      prev.set(next, current);
      if (next === idB) {
        found = true;
        break;
      }
      queue.push(next);
    }
  }

  if (!found) return null;

  // reconstruct path A -> ... -> B
  const idPath: string[] = [idB];
  let cur = idB;
  while (cur !== idA) {
    cur = prev.get(cur)!;
    idPath.unshift(cur);
  }

  const steps: ConnectionStep[] = idPath.map((id, i) => {
    if (i === 0) return { person: toRef(g, id), relationToPrevious: "start" as const };
    const prevId = idPath[i - 1];
    // is `id` a child of `prevId`? then we moved DOWN (id is prevId's child)
    const isChildOfPrev = (g.childrenOf.get(prevId) ?? []).includes(id);
    return { person: toRef(g, id), relationToPrevious: isChildOfPrev ? "child" : "parent" };
  });

  // common ancestor = the peak of the path: the last node reached by going
  // "parent" before the direction switches to "child" (or the last node, if
  // the path only ever goes one direction, meaning one is a direct ancestor of the other)
  let peakIndex = 0;
  for (let i = 1; i < steps.length; i++) {
    if (steps[i].relationToPrevious === "parent") peakIndex = i;
    else break;
  }
  const commonAncestor = steps[peakIndex]?.person ?? null;
  const generationsFromAToAncestor = peakIndex;
  const generationsFromBToAncestor = steps.length - 1 - peakIndex;

  return { path: steps, commonAncestor, generationsFromAToAncestor, generationsFromBToAncestor };
}
