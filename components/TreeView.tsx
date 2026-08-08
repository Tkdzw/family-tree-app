"use client";

import { useMemo, useState } from "react";
import type { TreeNode, WifeGroup } from "@/lib/tree";
import PersonNode, { nodeMatches } from "./PersonNode";

function ChildCard({ child, index, query }: { child: TreeNode; index: number; query: string }) {
  const isEmpty = child.children.length === 0;
  const matches = query.length > 0 && nodeMatches(child, query);
  const selfMatches = query.length > 0 && child.name.toLowerCase().includes(query.toLowerCase());
  const [open, setOpen] = useState(matches);

  useMemo(() => {
    if (query) setOpen(matches);
  }, [query, matches]);

  if (query && !matches) return null;

  return (
    <div className={`bg-panel border rounded-sm overflow-hidden transition-colors ${matches ? "border-gold" : "border-panelLine"}`}>
      <div className="p-4 flex items-start gap-3 cursor-pointer select-none" onClick={() => setOpen((o) => !o)}>
        <div className="font-mono text-[11px] text-goldDim pt-1 w-6 flex-none">{String(index + 1).padStart(2, "0")}</div>
        <div className="flex-1 min-w-0">
          <div className={`font-display text-[16px] leading-tight font-medium ${selfMatches ? "text-gold" : "text-bone"}`}>
            {child.deceased && <span className="text-rust mr-1">†</span>}
            {child.name}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            {child.branch && (
              <span className="font-mono text-[10px] uppercase tracking-wide text-goldDim border border-goldDim/40 rounded-sm px-1.5 py-0.5">
                {child.branch}
              </span>
            )}
            <span className={`font-mono text-[10.5px] uppercase tracking-wide ${isEmpty ? "text-rust" : "text-boneDim"}`}>
              {isEmpty ? "no records yet" : `${child.children.length} children recorded`}
            </span>
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`flex-none mt-1 text-boneDim transition-transform ${open ? "rotate-90 text-gold" : ""}`}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
      {open && (
        <div className="border-t border-panelLine px-4 pb-4 pt-3">
          {isEmpty ? (
            <p className="text-[13px] text-boneDim italic leading-relaxed">
              No children recorded for {child.name} yet.
            </p>
          ) : (
            <div className="pl-[30px]">
              {child.children.map((gc) => (
                <PersonNode key={gc.id} node={gc} depth={0} query={query} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WifeSection({ group, startIndex, query }: { group: WifeGroup; startIndex: number; query: string }) {
  const anyMatch = query ? group.children.some((c) => nodeMatches(c, query) || c.name.toLowerCase().includes(query.toLowerCase())) : true;
  if (query && !anyMatch) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2.5 mb-3">
        <h3 className="font-display text-lg font-medium text-bone">{group.wife.name}</h3>
        {!group.wife.verified && (
          <span className="font-mono text-[9.5px] uppercase tracking-wide text-rust border border-rust/40 rounded-sm px-1.5 py-0.5">
            name unverified
          </span>
        )}
        <span className="font-mono text-[10px] text-boneDim">
          {group.children.length} {group.children.length === 1 ? "child" : "children"}{" "}
          <span className="text-rust/80">(grouping unverified)</span>
        </span>
      </div>
      {group.children.length === 0 ? (
        <p className="text-[13px] text-boneDim italic pl-1">No children currently grouped under this wife.</p>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {group.children.map((child, i) => (
            <ChildCard key={child.id} child={child} index={startIndex + i} query={query} />
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
}: {
  lineage: { id: string; name: string }[];
  patriarch: TreeNode;
  wifeGroups: WifeGroup[];
  unassignedChildren: TreeNode[];
  stats: { totalPeople: number; branchCount: number; descendantCount: number; wifeCount: number; maxDepth: number };
}) {
  const [query, setQuery] = useState("");
  const anyMatchAnywhere = useMemo(() => {
    if (!query) return true;
    return patriarch.children.some((c) => nodeMatches(c, query) || c.name.toLowerCase().includes(query.toLowerCase()));
  }, [query, patriarch]);

  return (
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
        <p className="text-[16px] leading-[1.65] text-boneDim max-w-[640px] mb-7">
          The <b className="text-bone font-semibold">Chiwashira–Ziwenga</b> family tree, read live from
          the database. {patriarch.name} sits at the center — his children are grouped below by wife.
        </p>
        <div className="flex flex-wrap border-t border-panelLine">
          <Stat n={stats.branchCount} l="Children" />
          <Stat n={stats.wifeCount} l="Wives recorded" />
          <Stat n={stats.descendantCount} l="Descendants total" />
          <Stat n={stats.maxDepth} l="Generations below him" />
        </div>
      </div>

      {/* Ancestor lineage strip */}
      {lineage.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-boneDim">
          <span className="font-mono text-[10px] uppercase tracking-wide text-goldDim mr-1">Lineage:</span>
          {lineage.map((a, i) => (
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

      {/* Patriarch card */}
      <div className="mt-10 text-center">
        <div className="inline-block px-8 py-5 border border-goldDim bg-gradient-to-b from-gold/[0.08] to-transparent rounded-sm">
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-gold mb-1.5">Common Ancestor</div>
          <div className="font-display text-2xl font-semibold text-bone">{patriarch.name}</div>
        </div>
        <div className="w-px h-9 mx-auto bg-gradient-to-b from-goldDim to-line" />
      </div>

      <p className="text-center font-mono text-[11px] tracking-[0.14em] uppercase text-boneDim my-6">
        Children grouped by wife
      </p>
      <div className="h-px bg-line max-w-[1140px] mx-auto mb-6" />

      <div className="bg-rust/[0.07] border border-rust/30 rounded-sm px-4 py-3 mb-8 text-[13px] text-boneDim leading-relaxed">
        <b className="text-rust">Unverified grouping:</b> the source file doesn't record which wife each
        child belongs to. Children are currently split evenly across the 7 wives (3 each, in list order)
        purely so the tree can be browsed this way — treat every grouping below as a placeholder until
        confirmed with family elders.
      </div>

      {/* Wife-grouped sections */}
      {(() => {
        let runningIndex = 0;
        return wifeGroups.map((group) => {
          const el = <WifeSection key={group.wife.id} group={group} startIndex={runningIndex} query={query} />;
          runningIndex += group.children.length;
          return el;
        });
      })()}

      {unassignedChildren.length > 0 && (
        <WifeSection
          group={{ wife: { id: "unassigned", name: "Unassigned", verified: true }, children: unassignedChildren }}
          startIndex={stats.branchCount - unassignedChildren.length}
          query={query}
        />
      )}

      <div className="flex gap-6 flex-wrap mt-2 pt-4 border-t border-panelLine text-[12.5px] text-boneDim">
        <span className="inline-flex items-center gap-1.5"><span className="text-rust">†</span> deceased</span>
        <span>Click any card or name to expand or collapse it</span>
      </div>

      <footer className="mt-14 pt-6 border-t border-panelLine">
        <p className="text-[13px] leading-[1.7] text-boneDim max-w-[680px] mb-2.5">
          This tree is read live from the database — anything added through Prisma Studio or a future
          data-entry screen shows up here automatically on refresh.
        </p>
        <p className="font-mono text-[11px] text-goldDim tracking-wide">
          Source: prisma/data/source-tree.json
        </p>
      </footer>
    </div>
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
