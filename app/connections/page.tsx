import Link from "next/link";
import { getAllPeopleFlat } from "@/lib/relationships";
import ConnectionsFinder from "@/components/ConnectionsFinder";

export const dynamic = "force-dynamic";

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: { a?: string };
}) {
  const people = await getAllPeopleFlat();

  return (
    <div className="max-w-[820px] mx-auto px-5 pt-14 pb-24">
      <Link href="/" className="font-mono text-[11px] tracking-[0.1em] uppercase text-goldDim hover:text-gold">
        ← Back to tree
      </Link>

      <p className="font-mono text-[11.5px] tracking-[0.14em] uppercase text-gold mt-6 mb-3">
        Relationship Finder
      </p>
      <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-3">How are we related?</h1>
      <p className="text-boneDim text-[15px] leading-relaxed mb-9 max-w-[560px]">
        Pick two people and see the path between them — through whichever ancestor connects them.
      </p>

      {people.length === 0 ? (
        <p className="text-boneDim">No data yet — seed the database first.</p>
      ) : (
        <ConnectionsFinder people={people} initialA={searchParams.a} />
      )}
    </div>
  );
}
