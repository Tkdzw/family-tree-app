import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { importBackup } from "@/app/actions";
import { auth } from "@/auth";
import SubmitButton from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default async function BackupPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string; count?: string };
}) {
  const session = await auth();
  const isAuthed = !!session?.user;

  const [peopleCount, linkCount, unionCount] = await Promise.all([
    prisma.person.count(),
    prisma.parentChild.count(),
    prisma.union.count(),
  ]);

  return (
    <div className="max-w-[680px] mx-auto px-5 pt-14 pb-24">
      <Link href="/" className="font-mono text-[11px] tracking-[0.1em] uppercase text-goldDim hover:text-gold">
        ← Back to tree
      </Link>

      <p className="font-mono text-[11.5px] tracking-[0.14em] uppercase text-gold mt-6 mb-3">Backup</p>
      <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-3">Export & Import</h1>
      <p className="text-boneDim text-[15px] leading-relaxed mb-9 max-w-[560px]">
        Download a full snapshot of everyone and every relationship on file, or restore the database
        from a snapshot taken earlier.
      </p>

      {searchParams.success && (
        <div className="bg-gold/10 border border-goldDim rounded-sm px-4 py-3 mb-8 text-sm text-gold">
          ✓ Import complete — {searchParams.count ?? "?"} people restored.
        </div>
      )}
      {searchParams.error && (
        <div className="bg-rust/10 border border-rust/40 rounded-sm px-4 py-3 mb-8 text-sm text-rust">
          {searchParams.error}
        </div>
      )}

      {/* Export */}
      <div className="bg-panel border border-panelLine rounded-sm p-5 mb-6">
        <div className="font-mono text-[10.5px] uppercase tracking-wide text-boneDim mb-2">Export</div>
        <p className="text-sm text-boneDim leading-relaxed mb-4">
          Currently on file: <b className="text-bone">{peopleCount}</b> people,{" "}
          <b className="text-bone">{linkCount}</b> parent/child links, <b className="text-bone">{unionCount}</b>{" "}
          marriages. The download includes everything — names, notes, sources, birth order, and
          which mother assignments are confirmed versus still placeholders.
        </p>
        <a
          href="/api/export"
          download
          className="inline-block bg-gold/10 border border-goldDim text-gold text-sm font-medium px-4 py-2.5 rounded-sm hover:bg-gold/20"
        >
          Download backup (.json)
        </a>
      </div>

      {/* Import */}
      <div className="bg-panel border border-panelLine rounded-sm p-5">
        <div className="font-mono text-[10.5px] uppercase tracking-wide text-boneDim mb-2">Import</div>
        {isAuthed ? (
          <>
            <div className="bg-rust/[0.07] border border-rust/30 rounded-sm px-4 py-3 mb-4 text-[13px] text-boneDim leading-relaxed">
              <b className="text-rust">This replaces everything.</b> Importing a backup deletes every
              person and relationship currently in the database and replaces them with what's in the
              file. Any edits made since your last export will be lost — export a fresh backup first if
              you're not sure.
            </div>
            <form action={importBackup} className="space-y-4">
              <input
                type="file"
                name="file"
                accept="application/json,.json"
                required
                className="block w-full text-sm text-boneDim file:mr-3 file:py-2 file:px-3.5 file:rounded-sm file:border file:border-panelLine file:bg-bg file:text-bone file:text-sm file:cursor-pointer hover:file:border-goldDim"
              />
              <label className="flex items-start gap-2 text-[13px] text-boneDim">
                <input type="checkbox" required className="accent-gold mt-0.5" />
                I understand this replaces all current data and can't be undone from within the app.
              </label>
              <SubmitButton
                pendingText="Restoring — this replaces everything, please wait…"
                className="bg-gold/10 border border-goldDim text-gold text-sm font-medium px-4 py-2.5 rounded-sm hover:bg-gold/20"
              >
                Restore from backup
              </SubmitButton>
            </form>
          </>
        ) : (
          <p className="text-sm text-boneDim">
            <Link href="/login" className="text-gold hover:underline">
              Sign in
            </Link>{" "}
            as an editor to restore from a backup.
          </p>
        )}
      </div>
    </div>
  );
}
