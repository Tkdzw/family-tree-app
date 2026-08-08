"use client";

import { useEffect, useState } from "react";
import type { TreeNode } from "@/lib/tree";

export function nodeMatches(node: TreeNode, query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase();
  const name = `${node.name} ${node.surname ?? ""}`.toLowerCase();
  if (name.includes(q)) return true;
  return node.children.some((c) => nodeMatches(c, q));
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
  const selfMatch = query.length > 0 && `${node.name} ${node.surname ?? ""}`.toLowerCase().includes(query.toLowerCase());
  const descendantMatch = query.length > 0 && node.children.some((c) => nodeMatches(c, query));
  const shouldAutoOpen = selfMatch || descendantMatch;

  const [open, setOpen] = useState(shouldAutoOpen);

  useEffect(() => {
    if (query) setOpen(shouldAutoOpen);
  }, [query, shouldAutoOpen]);

  const hasChildren = node.children.length > 0;

  return (
    <div className="child-row-dashed">
      <div
        className={`flex items-center gap-2 py-1.5 text-sm ${hasChildren ? "cursor-pointer" : ""} ${
          selfMatch ? "text-gold font-semibold" : "text-bone"
        }`}
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
        <span className="truncate">
          {node.name}
          {node.surname ? ` ${node.surname}` : ""}
        </span>
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
