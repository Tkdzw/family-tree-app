import Link from "next/link";
import { notFound } from "next/navigation";
import { getPersonProfile } from "@/lib/relationships";

function NameLine({ p }: { p: { id: string; name: string; surname: string | null; deceased: boolean } }) {
  return (
    <Link href={`/person/${p.id}`} className="hover:text-gold hover:underline">
      {p.deceased && <span className="text-rust mr-1">†</span>}
      {p.name}
      {p.surname ? ` ${p.surname}` : ""}
    </Link>
  );
}

export default async function PersonPage({ params }: { params: { id: string } }) {
  const profile = await getPersonProfile(params.id);
  if (!profile) notFound();

  const { person, parents, children, siblings, ancestorPath } = profile;

  return (
    <div className="max-w-[720px] mx-auto px-5 pt-14 pb-24">
      <Link href="/" className="font-mono text-[11px] tracking-[0.1em] uppercase text-goldDim hover:text-gold">
        ← Back to tree
      </Link>

      {ancestorPath.length > 0 && (
        <p className="mt-6 text-[13px] text-boneDim flex flex-wrap gap-x-1.5 gap-y-1">
          {ancestorPath.map((a, i) => (
            <span key={a.id} className="flex items-center gap-1.5">
              <NameLine p={a} />
              <span className="text-boneDim/50">›</span>
            </span>
          ))}
          <span className="text-bone">
            {person.name}
            {person.surname ? ` ${person.surname}` : ""}
          </span>
        </p>
      )}

      <h1 className="font-display text-4xl font-semibold mt-4 mb-1">
        {person.deceased && <span className="text-rust mr-2">†</span>}
        {person.name}
        {person.surname ? ` ${person.surname}` : ""}
      </h1>
      <p className="font-mono text-[11px] uppercase tracking-wide text-boneDim mb-8">
        Generation {ancestorPath.length + 1}
        {person.deceased ? " · deceased" : ""}
      </p>

      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 mb-8 text-sm">
        <Field label="Born" value={person.birthYear ? `${person.birthYearApprox ? "c. " : ""}${person.birthYear}` : null} />
        <Field label="Birthplace" value={person.birthPlace} />
        <Field label="Totem" value={person.totem} />
        <Field label="Source" value={person.sourceNote} />
      </div>

      {person.notes && (
        <p className="text-sm text-boneDim leading-relaxed mb-8 bg-panel border border-panelLine rounded-sm p-4">
          {person.notes}
        </p>
      )}

      <RelationSection title="Parents" people={parents} empty="Not recorded yet." />
      <RelationSection title={`Siblings (${siblings.length})`} people={siblings} empty="None recorded." />
      <RelationSection title={`Children (${children.length})`} people={children} empty="None recorded yet." />

      <div className="mt-10 pt-6 border-t border-panelLine flex flex-wrap gap-3">
        <Link
          href={`/connections?a=${person.id}`}
          className="inline-block bg-gold/10 border border-goldDim text-gold text-sm font-medium px-4 py-2.5 rounded-sm hover:bg-gold/20"
        >
          Find my connection to someone →
        </Link>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wide text-boneDim">{label}</div>
      <div className="text-bone mt-0.5">{value}</div>
    </div>
  );
}

function RelationSection({
  title,
  people,
  empty,
}: {
  title: string;
  people: { id: string; name: string; surname: string | null; deceased: boolean }[];
  empty: string;
}) {
  return (
    <div className="mb-7">
      <div className="font-mono text-[10.5px] uppercase tracking-wide text-boneDim mb-2.5">{title}</div>
      {people.length === 0 ? (
        <p className="text-sm text-boneDim italic">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {people.map((p) => (
            <li key={p.id} className="text-[15px]">
              <NameLine p={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
