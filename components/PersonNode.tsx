"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TreeNode } from "@/lib/tree";
import { useHighlight } from "./highlight-context";

export function nodeMatches(node: TreeNode, query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase();
  const name = `${node.name} ${node.surname ?? ""}`.toLowerCase();
  if (name.includes(q)) return true;
  return node.children.some((c) => nodeMatches(c, q));
}

function nodeHasHighlightedDescendant(node: TreeNode, highlight: Set<string>): boolean {
  return node.children.some((c) => highlight.has(c.id) || nodeHasHighlightedDescendant(c, highlight));
}

export default function PersonNode({
  node,
  depth,
  query,
}: {
  node: TreeNode;
  depth: number;
  query: string;
}) {
  const highlight = useHighlight();
  const selfMatch = query.length > 0 && `${node.name} ${node.surname ?? ""}`.toLowerCase().includes(query.toLowerCase());
  const descendantMatch = query.length > 0 && node.children.some((c) => nodeMatches(c, query));

  const onHighlightPath = highlight ? highlight.has(node.id) : false;
  const highlightChildAhead = highlight ? nodeHasHighlightedDescendant(node, highlight) : false;
  const dimmed = highlight !== null && !onHighlightPath;

  const shouldAutoOpen = selfMatch || descendantMatch || highlightChildAhead;
  const [open, setOpen] = useState(shouldAutoOpen);

  useEffect(() => {
    setOpen(shouldAutoOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, shouldAutoOpen, highlight]);

  const hasChildren = node.children.length > 0;

  return (
    <div className="child-row-dashed">
      <div
        className={`flex items-center gap-2 py-1.5 text-sm transition-opacity ${hasChildren ? "cursor-pointer" : ""} ${
          selfMatch ? "text-gold font-semibold" : "text-bone"
        } ${dimmed ? "opacity-25" : ""} ${onHighlightPath && highlight ? "font-semibold" : ""}`}
        style={{ paddingLeft: depth * 16 }}
        onClick={() => hasChildren && setOpen((o) => !o)}
      >
        {hasChildren ? (
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={`flex-none text-boneDim transition-transform ${open ? "rotate-90 text-gold" : ""}`}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        ) : (
          <span className="flex-none w-[11px]" />
        )}
        {node.deceased && <span className="text-rust text-xs flex-none">†</span>}
        <Link
          href={`/person/${node.id}`}
          onClick={(e) => e.stopPropagation()}
          className="truncate hover:underline hover:text-gold"
        >
          {node.name}
          {node.surname ? ` ${node.surname}` : ""}
        </Link>
        {onHighlightPath && highlight && <span className="text-gold text-xs flex-none">★</span>}
        {hasChildren && (
          <span className="text-[10px] font-mono text-boneDim/60 flex-none ml-1">({node.children.length})</span>
        )}
      </div>
      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <PersonNode key={child.id} node={child} depth={depth + 1} query={query} />
          ))}
        </div>
      )}
    </div>
  );
}
