"use client";

import { useState } from "react";
import Link from "next/link";
import { useHighlight } from "./highlight-context";

export type OrgNode = {
  id: string;
  label: string;
  deceased?: boolean;
  branch?: string | null;
  tag?: string; // small label under the name, e.g. "unverified" or "no children linked"
  tagTone?: "warning" | "info"; // "warning" (rust, default) for data-quality flags, "info" (gold) for neutral labels like "Person A"
  isSpouse?: boolean; // married in, not a blood descendant — rendered in a distinct color so it never reads as "another generation"
  children: OrgNode[];
};

function nodeOrDescendantMatches(node: OrgNode, query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase();
  if (node.label.toLowerCase().includes(q)) return true;
  return node.children.some((c) => nodeOrDescendantMatches(c, query));
}

function nodeOrDescendantHighlighted(node: OrgNode, highlight: Set<string>): boolean {
  if (highlight.has(node.id)) return true;
  return node.children.some((c) => nodeOrDescendantHighlighted(c, highlight));
}

function OrgNodeItem({ node, depth, query, expandAll }: { node: OrgNode; depth: number; query: string; expandAll?: boolean }) {
  const highlight = useHighlight();
  const hasChildren = node.children.length > 0;

  const selfTextMatch = query.length > 0 && node.label.toLowerCase().includes(query.toLowerCase());
  const descendantTextMatch = query.length > 0 && node.children.some((c) => nodeOrDescendantMatches(c, query));

  const onHighlightPath = highlight ? highlight.has(node.id) : false;
  const descendantHighlighted = highlight ? node.children.some((c) => nodeOrDescendantHighlighted(c, highlight)) : false;
  const dimmed = highlight !== null && !onHighlightPath && !descendantHighlighted;

  // default open depth: patriarch(0), spouse tier(1), children(2) visible; deeper collapses.
  // expandAll skips the depth cutoff entirely — used for small trees like a single connection path.
  const defaultOpen = expandAll || depth < 2 || selfTextMatch || descendantTextMatch || onHighlightPath || descendantHighlighted;
  const [open, setOpen] = useState(defaultOpen);

  if (query && !selfTextMatch && !descendantTextMatch) return null;

  const showChildren = hasChildren && (open || descendantTextMatch || descendantHighlighted);

  const activeAccent = node.isSpouse ? "border-spouse" : "border-gold";
  const activeText = node.isSpouse ? "text-spouse" : "text-gold";

  return (
    <li>
      <div
        onClick={() => hasChildren && setOpen((o) => !o)}
        className={`inline-flex flex-col items-center gap-0.5 rounded-sm px-3.5 py-2.5 min-w-[110px] max-w-[170px] transition-all border ${
          hasChildren ? "cursor-pointer" : ""
        } ${
          node.isSpouse
            ? "bg-spouse/[0.07] border-dashed"
            : "bg-panel"
        } ${selfTextMatch || onHighlightPath ? activeAccent : node.isSpouse ? "border-spouse/50" : "border-panelLine"} ${
          dimmed ? "opacity-30" : ""
        }`}
      >
        <span
          className={`font-display text-[13.5px] leading-tight text-center flex items-center gap-1 ${
            selfTextMatch || onHighlightPath ? activeText : node.isSpouse ? "text-spouse" : "text-bone"
          }`}
        >
          {node.isSpouse && <span className="text-[11px] opacity-80">⚭</span>}
          {node.deceased && <span className="text-rust mr-0.5">†</span>}
          <Link href={`/person/${node.id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
            {node.label}
          </Link>
          {onHighlightPath && <span className="text-gold ml-0.5">★</span>}
        </span>
        {node.tag && (
          <span className={`font-mono text-[8.5px] uppercase tracking-wide ${node.tagTone === "info" ? "text-gold" : "text-rust"}`}>
            {node.tag}
          </span>
        )}
        {hasChildren && (
          <span className="font-mono text-[9px] text-boneDim/70">
            {open ? "▲" : "▼"} {node.children.length}
          </span>
        )}
      </div>
      {showChildren && (
        <ul>
          {node.children.map((child) => (
            <OrgNodeItem key={child.id} node={child} depth={depth + 1} query={query} expandAll={expandAll} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function OrgChart({ root, query, expandAll }: { root: OrgNode; query: string; expandAll?: boolean }) {
  return (
    <div className="overflow-x-auto pb-6 -mx-5 px-5">
      <ul className="org-tree inline-flex min-w-full justify-center">
        <OrgNodeItem node={root} depth={0} query={query} expandAll={expandAll} />
      </ul>
    </div>
  );
}
