import { getPatriarchView } from "@/lib/tree";
import TreeView from "@/components/TreeView";

export const dynamic = "force-dynamic"; // always read fresh data, no static caching

export default async function Home() {
  const view = await getPatriarchView();

  if (!view) {
    return (
      <div className="max-w-[640px] mx-auto px-5 pt-24 text-center">
        <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-gold mb-4">Database empty</p>
        <h1 className="font-display text-3xl font-semibold mb-4">No family tree data yet</h1>
        <p className="text-boneDim leading-relaxed mb-2">
          The database is connected, but there's no data in it. Run the seed script to load the
          current family tree data:
        </p>
        <code className="block bg-panel border border-panelLine rounded-sm px-4 py-3 text-left text-sm mt-4 text-gold font-mono">
          npm run db:migrate<br />
          npm run db:seed
        </code>
      </div>
    );
  }

  return (
    <TreeView
      lineage={view.lineage}
      patriarch={view.patriarch}
      wifeGroups={view.wifeGroups}
      unassignedChildren={view.unassignedChildren}
      stats={view.stats}
    />
  );
}
