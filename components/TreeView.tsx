"use client";

import { useMemo, useState } from "react";
import type { TreeNode, WifeGroup } from "@/lib/tree";
import { nodeMatches } from "./PersonNode";
import { HighlightContext } from "./highlight-context";
import OrgChart, { type OrgNode } from "./OrgChart";

type FlatPick = { id: string; name: string; surname: string | null };

function toOrgNode(node: TreeNode): OrgNode {
  return {
    id: node.id,
    label: node.name,
    deceased: node.deceased,
    branch: node.branch,
    children: node.children.map(toOrgNode),
  };
}

function FindMeBox({
  allPeople,
  meId,
  onPick,
  onClear,
}: {
  allPeople: FlatPick[];
  meId: string;
  onPick: (id: string) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return allPeople.filter((p) => `${p.name} ${p.surname ?? ""}`.toLowerCase().includes(q)).slice(0, 12);
  }, [query, allPeople]);

  const selected = allPeople.find((p) => p.id === meId);

  if (selected) {
    return (
      <div className="inline-flex items-center gap-2.5 bg-gold/10 border border-goldDim rounded-sm px-3.5 py-2 mt-4">
        <span className="text-gold text-sm">
          ★ Showing {selected.name}
          {selected.surname ? ` ${selected.surname}` : ""}'s line
        </span>
        <button onClick={onClear} className="text-boneDim hover:text-bone text-xs font-mono underline">
          clear
        </button>
      </div>
    );
  }

  return (
    <div className="relative mt-4 max-w-sm">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Find me — type your name…"
        className="w-full bg-panel border border-panelLine text-bone text-sm rounded-sm px-3.5 py-2.5 outline-none focus:border-goldDim placeholder:text-boneDim placeholder:opacity-60"
      />
      {matches.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto border border-panelLine rounded-sm bg-panel shadow-lg">
          {matches.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onPick(p.id);
                setQuery("");
              }}
              className="block w-full text-left px-3.5 py-2 text-sm text-bone hover:bg-gold/10 hover:text-gold border-b border-panelLine last:border-b-0"
            >
              {p.name}
              {p.surname ? ` ${p.surname}` : ""}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TreeView({
  lineage,
  patriarch,
  wifeGroups,
  unassignedChildren,
  stats,
  initialMeId,
}: {
  lineage: { id: string; name: string }[];
  patriarch: TreeNode;
  wifeGroups: WifeGroup[];
  unassignedChildren: TreeNode[];
  stats: { totalPeople: number; branchCount: number; descendantCount: number; wifeCount: number; maxDepth: number; verifiedMotherCount: number };
  initialMeId?: string;
}) {
  const [query, setQuery] = useState("");
  const [meId, setMeId] = useState(initialMeId ?? "");

  // flatten the whole patriarch subtree once: id -> parentId, and a plain
  // list for the "find me" search box
  const { parentOf, nodeIndex, flatList } = useMemo(() => {
    const parentOf = new Map<string, string | null>();
    const nodeIndex = new Map<string, TreeNode>();
    const flatList: FlatPick[] = [];

    function walk(node: TreeNode, parentId: string | null) {
      parentOf.set(node.id, parentId);
      nodeIndex.set(node.id, node);
      flatList.push({ id: node.id, name: node.name, surname: node.surname });
      for (const child of node.children) walk(child, node.id);
    }
    walk(patriarch, null);
    return { parentOf, nodeIndex, flatList };
  }, [patriarch]);

  const highlightSet = useMemo(() => {
    if (!meId || !nodeIndex.has(meId)) return null;
    const set = new Set<string>();
    let cursor: string | null = meId;
    while (cursor) {
      set.add(cursor);
      cursor = parentOf.get(cursor) ?? null;
    }
    function collectDescendants(id: string) {
      const node = nodeIndex.get(id);
      if (!node) return;
      for (const child of node.children) {
        set.add(child.id);
        collectDescendants(child.id);
      }
    }
    collectDescendants(meId);
    return set;
  }, [meId, parentOf, nodeIndex]);

  const anyMatchAnywhere = useMemo(() => {
    if (!query) return true;
    return patriarch.children.some((c) => nodeMatches(c, query) || c.name.toLowerCase().includes(query.toLowerCase()));
  }, [query, patriarch]);

  // Build the organogram: patriarch -> wife tier -> children -> (recursively) grandchildren etc.
  // Wife tier is the one place we have real spouse data; everyone below just
  // falls through to "children directly below" since no deeper spouse data exists yet.
  const orgRoot: OrgNode = useMemo(() => {
    const wifeNodes: OrgNode[] = wifeGroups.map((g) => ({
      id: g.wife.id,
      label: g.wife.name,
      tag: /^wife /i.test(g.wife.name) ? "name placeholder" : undefined,
      children: g.children.map(toOrgNode),
    }));
    const unassignedNode: OrgNode[] =
      unassignedChildren.length > 0
        ? [{ id: "unassigned", label: "Unassigned", tag: "no wife linked", children: unassignedChildren.map(toOrgNode) }]
        : [];

    if (wifeNodes.length === 0 && unassignedNode.length === 0) {
      // no spouses at all — children sit directly below the patriarch
      return { id: patriarch.id, label: patriarch.name, children: patriarch.children.map(toOrgNode) };
    }
    return { id: patriarch.id, label: patriarch.name, children: [...wifeNodes, ...unassignedNode] };
  }, [patriarch, wifeGroups, unassignedChildren]);

  return (
    <HighlightContext.Provider value={highlightSet}>
      <div className="max-w-[1180px] mx-auto px-5 pb-20">
        {/* Hero */}
        <div className="pt-14 pb-8 border-b border-panelLine">
          <p className="font-mono text-[11.5px] tracking-[0.14em] uppercase text-gold mb-3.5 flex items-center gap-2.5">
            <span className="w-[22px] h-px bg-goldDim inline-block" />
            Family Tree — Live
          </p>
          <h1 className="font-display font-semibold text-[clamp(34px,5.5vw,58px)] leading-[1.04] mb-4 -tracking-[0.01em]">
            Nyikadzino's <em className="italic text-gold font-medium">Lineage</em>
          </h1>
          <p className="text-[16px] leading-[1.65] text-boneDim max-w-[640px] mb-2">
            The <b className="text-bone font-semibold">Chiwashira–Ziwenga</b> family tree, read live from
            the database, laid out as an organogram — {patriarch.name}, his wives, and their descendants.
          </p>
          <FindMeBox allPeople={flatList} meId={meId} onPick={setMeId} onClear={() => setMeId("")} />
          <div className="flex flex-wrap border-t border-panelLine mt-6">
            <Stat n={stats.branchCount} l="Children" />
            <Stat n={stats.wifeCount} l="Wives recorded" />
            <Stat n={stats.descendantCount} l="Descendants total" />
            <Stat n={stats.verifiedMotherCount} l="Mothers confirmed" />
          </div>
        </div>

        {/* Ancestor lineage strip */}
        {lineage.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-boneDim">
            <span className="font-mono text-[10px] uppercase tracking-wide text-goldDim mr-1">Lineage:</span>
            {lineage.map((a) => (
              <span key={a.id} className="flex items-center gap-1.5">
                {a.name}
                <span className="text-boneDim/40">→</span>
              </span>
            ))}
            <span className="text-bone">{patriarch.name}</span>
          </div>
        )}

        {/* Search */}
        <div className="mt-6 relative">
          <svg className="absolute left-[15px] top-1/2 -translate-y-1/2 w-4 h-4 opacity-50 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a name — e.g. Rosemary, Tafadzwa, Ziwenga…"
            className="w-full bg-panel border border-panelLine text-bone text-[15px] rounded-sm py-3.5 pl-11 pr-4 outline-none focus:border-goldDim placeholder:text-boneDim placeholder:opacity-60"
          />
        </div>
        {query && !anyMatchAnywhere && <p className="py-4 text-boneDim text-sm">No one by that name is recorded yet.</p>}

        <div className="bg-rust/[0.07] border border-rust/30 rounded-sm px-4 py-3 mt-8 mb-2 text-[13px] text-boneDim leading-relaxed">
          <b className="text-rust">Unverified grouping:</b> wife assignments not yet confirmed on a
          person's profile page are placeholders. Click any box to expand or collapse that branch —
          the chart opens three tiers deep (patriarch → wives → children) by default.
        </div>

        {/* Organogram */}
        <div className="mt-6">
          <OrgChart root={orgRoot} query={query} />
        </div>

        <div className="flex gap-6 flex-wrap mt-2 pt-4 border-t border-panelLine text-[12.5px] text-boneDim">
          <span className="inline-flex items-center gap-1.5"><span className="text-rust">†</span> deceased</span>
          <span className="inline-flex items-center gap-1.5"><span className="text-gold">★</span> on your line</span>
          <span>Click any box to expand or collapse its branch</span>
        </div>

        <footer className="mt-14 pt-6 border-t border-panelLine">
          <p className="text-[13px] leading-[1.7] text-boneDim max-w-[680px] mb-2.5">
            This tree is read live from the database — anything added through the profile-page edit
            forms, or Prisma Studio, shows up here automatically on refresh.
          </p>
          <p className="font-mono text-[11px] text-goldDim tracking-wide">
            Source: prisma/data/source-tree.json
          </p>
        </footer>
      </div>
    </HighlightContext.Provider>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div className="pt-4 pr-[26px] mr-[26px] border-r border-panelLine last:border-r-0 last:mr-0 last:pr-0">
      <div className="font-display text-[30px] text-gold leading-none font-semibold">{n}</div>
      <div className="font-mono text-[10.5px] uppercase tracking-wide text-boneDim mt-1.5">{l}</div>
    </div>
  );
}
