"use client";

import { useMemo, useState } from "react";
import { linkExistingRelative } from "@/app/actions";
import type { FlatPerson } from "@/lib/relationships";
import SubmitButton from "./SubmitButton";

export default function RelativeLinker({ personId, allPeople }: { personId: string; allPeople: FlatPerson[] }) {
  const [query, setQuery] = useState("");
  const [otherId, setOtherId] = useState("");
  const [relation, setRelation] = useState("child");

  const candidates = allPeople.filter((p) => p.id !== personId);
  const matches = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return candidates.filter((p) => `${p.name} ${p.surname ?? ""}`.toLowerCase().includes(q)).slice(0, 10);
  }, [query, candidates]);

  const selected = candidates.find((p) => p.id === otherId);

  return (
    <form action={linkExistingRelative} className="flex flex-wrap items-center gap-2.5">
      <input type="hidden" name="personId" value={personId} />
      <input type="hidden" name="otherId" value={otherId} />

      <select
        name="relation"
        value={relation}
        onChange={(e) => setRelation(e.target.value)}
        className="bg-bg border border-panelLine text-bone text-sm rounded-sm px-2.5 py-2 outline-none focus:border-goldDim"
      >
        <option value="child">is the child of</option>
        <option value="parent">is the parent of</option>
        <option value="spouse">is the spouse of</option>
      </select>

      <div className="relative">
        {selected ? (
          <div className="flex items-center gap-2 bg-bg border border-goldDim rounded-sm px-3 py-2">
            <span className="text-sm text-bone">
              {selected.name}
              {selected.surname ? ` ${selected.surname}` : ""}
            </span>
            <button type="button" onClick={() => setOtherId("")} className="text-boneDim hover:text-gold text-xs font-mono">
              change
            </button>
          </div>
        ) : (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search existing person…"
            className="bg-bg border border-panelLine text-bone text-sm rounded-sm px-3 py-2 outline-none focus:border-goldDim w-52 placeholder:text-boneDim placeholder:opacity-60"
          />
        )}
        {!selected && matches.length > 0 && (
          <div className="absolute z-10 mt-1 w-64 max-h-52 overflow-y-auto border border-panelLine rounded-sm bg-panel shadow-lg">
            {matches.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setOtherId(p.id);
                  setQuery("");
                }}
                className="block w-full text-left px-3 py-2 text-sm text-bone hover:bg-gold/10 hover:text-gold border-b border-panelLine last:border-b-0"
              >
                {p.name}
                {p.surname ? ` ${p.surname}` : ""}
                <span className="block text-[11px] text-boneDim/70 truncate">{p.breadcrumb}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <SubmitButton
        disabled={!otherId}
        pendingText="Linking…"
        className="bg-gold/10 border border-goldDim text-gold text-sm font-medium px-3.5 py-2 rounded-sm hover:bg-gold/20 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Link
      </SubmitButton>
    </form>
  );
}
