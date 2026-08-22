"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FlatPerson, PersonRef, ConnectionResult } from "@/lib/relationships";
import { describeRelationship, describeRelationshipShona } from "@/lib/relationships";
import OrgChart, { type OrgNode } from "./OrgChart";

function PersonPicker({
  label,
  people,
  value,
  onChange,
}: {
  label: string;
  people: FlatPerson[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    if (!query) return people.slice(0, 40);
    const q = query.toLowerCase();
    return people.filter((p) => `${p.name} ${p.surname ?? ""}`.toLowerCase().includes(q)).slice(0, 40);
  }, [query, people]);

  const selected = people.find((p) => p.id === value);

  return (
    <div className="flex-1 min-w-[220px]">
      <div className="font-mono text-[10.5px] uppercase tracking-wide text-boneDim mb-2">{label}</div>
      {selected ? (
        <div className="flex items-center justify-between bg-panel border border-goldDim rounded-sm px-3 py-2.5">
          <span className="text-bone text-sm">
            {selected.name}
            {selected.surname ? ` ${selected.surname}` : ""}
          </span>
          <button onClick={() => onChange("")} className="text-boneDim hover:text-gold text-xs font-mono">
            change
          </button>
        </div>
      ) : (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a name…"
            className="w-full bg-panel border border-panelLine text-bone text-sm rounded-sm px-3 py-2.5 outline-none focus:border-goldDim placeholder:text-boneDim placeholder:opacity-60"
          />
          {query && (
            <div className="mt-1.5 max-h-56 overflow-y-auto border border-panelLine rounded-sm bg-panel">
              {filtered.length === 0 ? (
                <p className="text-boneDim text-xs px-3 py-2.5 italic">No matches.</p>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onChange(p.id);
                      setQuery("");
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-bone hover:bg-gold/10 hover:text-gold border-b border-panelLine last:border-b-0"
                  >
                    {p.name}
                    {p.surname ? ` ${p.surname}` : ""}
                    <span className="block text-[11px] text-boneDim/70 truncate">{p.breadcrumb}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function personLabel(p: PersonRef) {
  return `${p.name}${p.surname ? ` ${p.surname}` : ""}`;
}

/**
 * Reshapes the flat A-to-B path into a small two-branch tree rooted at the
 * common ancestor, so it can be rendered with the same OrgChart component
 * used on the main tree page — ancestor at top, one branch down to Person A,
 * one branch down to Person B.
 */
function buildConnectionTree(result: ConnectionResult): OrgNode {
  const peak = result.generationsFromAToAncestor;
  const { path } = result;

  function chain(steps: PersonRef[], endTag: string): OrgNode | null {
    if (steps.length === 0) return null;
    let node: OrgNode = {
      id: steps[steps.length - 1].id,
      label: personLabel(steps[steps.length - 1]),
      deceased: steps[steps.length - 1].deceased,
      tag: endTag,
      tagTone: "info",
      children: [],
    };
    for (let i = steps.length - 2; i >= 0; i--) {
      node = { id: steps[i].id, label: personLabel(steps[i]), deceased: steps[i].deceased, children: [node] };
    }
    return node;
  }

  const branchAaSteps = path.slice(0, peak).reverse().map((s) => s.person); // ancestor's child ... down to A
  const branchBaSteps = path.slice(peak + 1).map((s) => s.person); // ancestor's child ... down to B

  const children: OrgNode[] = [];
  const branchA = chain(branchAaSteps, "Person A");
  if (branchA) children.push(branchA);
  const branchB = chain(branchBaSteps, "Person B");
  if (branchB) children.push(branchB);

  const ancestor = path[peak].person;
  const isAncestorAlsoA = peak === 0;
  const isAncestorAlsoB = peak === path.length - 1;
  const tag = isAncestorAlsoA ? "Person A · common ancestor" : isAncestorAlsoB ? "Person B · common ancestor" : "common ancestor";

  return { id: ancestor.id, label: personLabel(ancestor), deceased: ancestor.deceased, tag, tagTone: "info", children };
}

// step.relationToPrevious describes the CURRENT person relative to the
// PREVIOUS one ("parent" = current is previous's parent). But the label is
// displayed reading top-to-bottom as "[previous] [label] [current]", so the
// text shown has to describe the *previous* person relative to the current
// one — the inverse of the stored value.
function relationLabel(rel: "start" | "parent" | "child") {
  if (rel === "parent") return "child of"; // current is previous's parent -> previous is child of current
  if (rel === "child") return "parent of"; // current is previous's child -> previous is parent of current
  return "";
}

export default function ConnectionsFinder({ people, initialA }: { people: FlatPerson[]; initialA?: string }) {
  const [a, setA] = useState(initialA ?? "");
  const [b, setB] = useState("");
  const [result, setResult] = useState<ConnectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function findConnection() {
    if (!a || !b) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/connections?a=${a}&b=${b}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-4 items-end">
        <PersonPicker label="Person A" people={people} value={a} onChange={setA} />
        <PersonPicker label="Person B" people={people} value={b} onChange={setB} />
        <button
          onClick={findConnection}
          disabled={!a || !b || loading}
          className="bg-gold/10 border border-goldDim text-gold text-sm font-medium px-5 py-2.5 rounded-sm hover:bg-gold/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Finding…" : "Find Connection"}
        </button>
      </div>

      {error && <p className="text-rust text-sm mt-6">{error}</p>}

      {result && (
        <div className="mt-8 bg-panel border border-panelLine rounded-sm p-5">
          {result.path.length > 1 ? (
            <div className="mb-5 pb-5 border-b border-panelLine space-y-1.5">
              <p className="text-lg text-bone leading-snug">
                {describeRelationship(
                  result.path[0].person.name,
                  result.path[result.path.length - 1].person.name,
                  result.generationsFromAToAncestor,
                  result.generationsFromBToAncestor
                )}
              </p>
              <p className="text-lg text-gold leading-snug">{describeRelationshipShona(result)}</p>
              {result.commonAncestor && (
                <p className="text-boneDim text-sm mt-2">
                  Connected through <b className="text-gold">{result.commonAncestor.name}</b>
                  {result.generationsFromAToAncestor > 0 && result.generationsFromBToAncestor > 0 && (
                    <> — {result.generationsFromAToAncestor} generation{result.generationsFromAToAncestor !== 1 ? "s" : ""} up from Person A, {result.generationsFromBToAncestor} down to Person B.</>
                  )}
                </p>
              )}
            </div>
          ) : (
            <p className="text-boneDim text-sm mb-5">That's the same person.</p>
          )}

          {result.path.length > 1 && (
            <div className="mb-6 -mx-5 px-5 border-b border-panelLine pb-2">
              <OrgChart root={buildConnectionTree(result)} query="" expandAll />
            </div>
          )}

          <div className="flex flex-col gap-1">
            {result.path.map((step, i) => (
              <div key={step.person.id} className="flex items-center gap-3">
                {i > 0 && (
                  <span className="font-mono text-[10px] uppercase tracking-wide text-goldDim w-16 text-right flex-none">
                    {relationLabel(step.relationToPrevious)}
                  </span>
                )}
                {i === 0 && <span className="w-16 flex-none" />}
                <Link href={`/person/${step.person.id}`} className="text-bone hover:text-gold hover:underline text-sm">
                  {step.person.deceased && <span className="text-rust mr-1">†</span>}
                  {step.person.name}
                  {step.person.surname ? ` ${step.person.surname}` : ""}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
