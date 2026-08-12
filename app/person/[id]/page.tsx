import Link from "next/link";
import { notFound } from "next/navigation";
import { getPersonProfile, getAllPeopleFlat } from "@/lib/relationships";
import { getPatriarchView, getWives, getPatriarchId, findNodeInTree } from "@/lib/tree";
import { updatePersonDetails, setChildMother, clearVerifiedMother, addChild, addNewSpouse, reorderChild } from "@/app/actions";
import RelativeLinker from "@/components/RelativeLinker";

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

  const { person, parents, children, siblingGroup, spouses, ancestorPath } = profile;

  const allPeople = await getAllPeopleFlat();

  const patriarchId = await getPatriarchId();
  const isDirectChildOfPatriarch = patriarchId ? parents.some((p) => p.id === patriarchId) : false;

  let motherId: string | null = null;
  let motherVerified = false;
  let wives: { id: string; name: string }[] = [];

  if (isDirectChildOfPatriarch) {
    const view = await getPatriarchView();
    if (view) {
      const node = findNodeInTree(view.patriarch, person.id);
      motherId = node?.motherId ?? null;
      motherVerified = node?.motherVerified ?? false;
    }
    wives = await getWives();
  }

  return (
    <div className="max-w-[720px] mx-auto px-5 pt-14 pb-24">
      <Link href="/" className="font-mono text-[11px] tracking-[0.1em] uppercase text-goldDim hover:text-gold">
        ← Back to tree
      </Link>

      {ancestorPath.length > 0 && (
        <p className="mt-6 text-[13px] text-boneDim flex flex-wrap gap-x-1.5 gap-y-1">
          {ancestorPath.map((a) => (
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

      {/* Mother / wife verification */}
      {isDirectChildOfPatriarch && wives.length > 0 && (
        <div className="mb-8 bg-panel border border-panelLine rounded-sm p-4">
          <div className="font-mono text-[10.5px] uppercase tracking-wide text-boneDim mb-3">Mother (wife)</div>
          {motherVerified ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-bone">
                <span className="text-gold">✓ Verified:</span> {wives.find((w) => w.id === motherId)?.name ?? "—"}
              </p>
              <form action={clearVerifiedMother}>
                <input type="hidden" name="childId" value={person.id} />
                <button className="text-boneDim hover:text-rust text-xs font-mono underline">remove</button>
              </form>
            </div>
          ) : (
            <>
              <p className="text-[13px] text-boneDim mb-3">
                Currently a placeholder guess{motherId ? `: ${wives.find((w) => w.id === motherId)?.name}` : ""}.
                Change it and check the box below once it's confirmed with a family elder.
              </p>
              <form action={setChildMother} className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="childId" value={person.id} />
                <select
                  name="wifeId"
                  defaultValue={motherId ?? ""}
                  className="bg-bg border border-panelLine text-bone text-sm rounded-sm px-3 py-2 outline-none focus:border-goldDim"
                >
                  <option value="" disabled>
                    Choose a wife…
                  </option>
                  {wives.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 text-xs text-boneDim">
                  <input type="checkbox" name="verify" className="accent-gold" />
                  Confirmed — lock this in
                </label>
                <button className="bg-gold/10 border border-goldDim text-gold text-sm font-medium px-3.5 py-2 rounded-sm hover:bg-gold/20">
                  Save
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Editable fields */}
      <details className="mb-8 group">
        <summary className="cursor-pointer font-mono text-[10.5px] uppercase tracking-wide text-boneDim hover:text-gold select-none">
          Edit details ▸
        </summary>
        <form action={updatePersonDetails} className="mt-4 bg-panel border border-panelLine rounded-sm p-4 space-y-3.5">
          <input type="hidden" name="id" value={person.id} />
          <div className="grid sm:grid-cols-2 gap-3.5">
            <EditField label="First name(s)" name="firstName" defaultValue={person.name} />
            <EditField label="Surname" name="surname" defaultValue={person.surname ?? ""} />
            <EditField label="Gender" name="gender" defaultValue={person.gender ?? ""} placeholder="M / F" />
            <EditField label="Totem" name="totem" defaultValue={person.totem ?? ""} />
            <EditField label="Birth year" name="birthYear" defaultValue={person.birthYear?.toString() ?? ""} type="number" />
            <EditField label="Birthplace" name="birthPlace" defaultValue={person.birthPlace ?? ""} />
          </div>
          <div className="flex gap-5">
            <label className="flex items-center gap-1.5 text-xs text-boneDim">
              <input type="checkbox" name="birthYearApprox" defaultChecked={person.birthYearApprox} className="accent-gold" />
              Year is approximate
            </label>
            <label className="flex items-center gap-1.5 text-xs text-boneDim">
              <input type="checkbox" name="deceased" defaultChecked={person.deceased} className="accent-gold" />
              Deceased
            </label>
          </div>
          <EditTextarea label="Notes" name="notes" defaultValue={person.notes ?? ""} />
          <EditTextarea label="Source" name="sourceNote" defaultValue={person.sourceNote ?? ""} />
          <button className="bg-gold/10 border border-goldDim text-gold text-sm font-medium px-4 py-2 rounded-sm hover:bg-gold/20">
            Save changes
          </button>
        </form>
      </details>

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
      <RelationSection title={`Spouses (${spouses.length})`} people={spouses} empty="None recorded." />
      <SiblingOrderSection siblingGroup={siblingGroup} parentId={parents[0]?.id} />
      <ChildrenSection children={children} parentId={person.id} />

      {/* Add / link relatives */}
      <details className="mb-8 group">
        <summary className="cursor-pointer font-mono text-[10.5px] uppercase tracking-wide text-boneDim hover:text-gold select-none">
          Add or link a relative ▸
        </summary>
        <div className="mt-4 space-y-5">
          <div className="bg-panel border border-panelLine rounded-sm p-4">
            <div className="font-mono text-[10px] uppercase tracking-wide text-boneDim mb-2.5">Add a new child</div>
            <form action={addChild} className="flex flex-wrap items-center gap-2.5">
              <input type="hidden" name="parentId" value={person.id} />
              <input
                name="name"
                required
                placeholder="Full name"
                className="bg-bg border border-panelLine text-bone text-sm rounded-sm px-3 py-2 outline-none focus:border-goldDim w-48"
              />
              <select name="gender" defaultValue="" className="bg-bg border border-panelLine text-bone text-sm rounded-sm px-2.5 py-2 outline-none focus:border-goldDim">
                <option value="">Gender…</option>
                <option value="M">M</option>
                <option value="F">F</option>
              </select>
              <button className="bg-gold/10 border border-goldDim text-gold text-sm font-medium px-3.5 py-2 rounded-sm hover:bg-gold/20">
                Add child
              </button>
            </form>
          </div>

          <div className="bg-panel border border-panelLine rounded-sm p-4">
            <div className="font-mono text-[10px] uppercase tracking-wide text-boneDim mb-2.5">Add a new spouse</div>
            <form action={addNewSpouse} className="flex flex-wrap items-center gap-2.5">
              <input type="hidden" name="personId" value={person.id} />
              <input
                name="name"
                required
                placeholder="Full name"
                className="bg-bg border border-panelLine text-bone text-sm rounded-sm px-3 py-2 outline-none focus:border-goldDim w-48"
              />
              <select name="gender" defaultValue="" className="bg-bg border border-panelLine text-bone text-sm rounded-sm px-2.5 py-2 outline-none focus:border-goldDim">
                <option value="">Gender…</option>
                <option value="M">M</option>
                <option value="F">F</option>
              </select>
              <button className="bg-gold/10 border border-goldDim text-gold text-sm font-medium px-3.5 py-2 rounded-sm hover:bg-gold/20">
                Add spouse
              </button>
            </form>
          </div>

          <div className="bg-panel border border-panelLine rounded-sm p-4">
            <div className="font-mono text-[10px] uppercase tracking-wide text-boneDim mb-2.5">
              Link an existing person
            </div>
            <RelativeLinker personId={person.id} allPeople={allPeople} />
          </div>
        </div>
      </details>

      <div className="mt-2 pt-6 border-t border-panelLine flex flex-wrap gap-3">
        <Link
          href={`/?me=${person.id}`}
          className="inline-block bg-gold/10 border border-goldDim text-gold text-sm font-medium px-4 py-2.5 rounded-sm hover:bg-gold/20"
        >
          ★ Show my line on the tree
        </Link>
        <Link
          href={`/connections?a=${person.id}`}
          className="inline-block bg-panel border border-panelLine text-bone text-sm font-medium px-4 py-2.5 rounded-sm hover:border-goldDim"
        >
          Find my connection to someone →
        </Link>
      </div>
    </div>
  );
}

function EditField({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] uppercase tracking-wide text-boneDim mb-1">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full bg-bg border border-panelLine text-bone text-sm rounded-sm px-3 py-2 outline-none focus:border-goldDim"
      />
    </label>
  );
}

function EditTextarea({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] uppercase tracking-wide text-boneDim mb-1">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={2}
        className="w-full bg-bg border border-panelLine text-bone text-sm rounded-sm px-3 py-2 outline-none focus:border-goldDim resize-y"
      />
    </label>
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

function ReorderButtons({ parentId, childId, disableUp, disableDown }: { parentId: string; childId: string; disableUp: boolean; disableDown: boolean }) {
  return (
    <span className="inline-flex gap-1 ml-2">
      <form action={reorderChild} className="inline">
        <input type="hidden" name="parentId" value={parentId} />
        <input type="hidden" name="childId" value={childId} />
        <input type="hidden" name="direction" value="up" />
        <button
          disabled={disableUp}
          title="Move up (older)"
          className="w-5 h-5 inline-flex items-center justify-center text-boneDim hover:text-gold disabled:opacity-20 disabled:cursor-not-allowed text-xs"
        >
          ▲
        </button>
      </form>
      <form action={reorderChild} className="inline">
        <input type="hidden" name="parentId" value={parentId} />
        <input type="hidden" name="childId" value={childId} />
        <input type="hidden" name="direction" value="down" />
        <button
          disabled={disableDown}
          title="Move down (younger)"
          className="w-5 h-5 inline-flex items-center justify-center text-boneDim hover:text-gold disabled:opacity-20 disabled:cursor-not-allowed text-xs"
        >
          ▼
        </button>
      </form>
    </span>
  );
}

/** Full sibling set including self, in birth order, with the current profile highlighted at their position. */
function SiblingOrderSection({
  siblingGroup,
  parentId,
}: {
  siblingGroup: { id: string; name: string; surname: string | null; deceased: boolean; birthOrder: number | null; isSelf: boolean; position: number }[];
  parentId?: string;
}) {
  const othersCount = siblingGroup.length - 1;
  return (
    <div className="mb-7">
      <div className="font-mono text-[10.5px] uppercase tracking-wide text-boneDim mb-2.5">
        Siblings & birth order ({othersCount} {othersCount === 1 ? "other" : "others"})
      </div>
      {othersCount === 0 ? (
        <p className="text-sm text-boneDim italic">No siblings recorded.</p>
      ) : (
        <ol className="space-y-1">
          {siblingGroup.map((s) => (
            <li
              key={s.id}
              className={`flex items-center gap-2.5 text-[15px] rounded-sm px-2 py-1 -mx-2 ${
                s.isSelf ? "bg-gold/10 border border-goldDim" : ""
              }`}
            >
              <span className="font-mono text-[10px] text-boneDim w-5 flex-none text-right">{s.position}.</span>
              {s.isSelf ? (
                <span className="text-gold font-semibold">
                  {s.deceased && <span className="text-rust mr-1">†</span>}
                  {s.name}
                  {s.surname ? ` ${s.surname}` : ""}
                  <span className="text-[10px] font-mono uppercase tracking-wide ml-2 text-gold/80">you are here</span>
                </span>
              ) : (
                <NameLine p={s} />
              )}
              {parentId && (
                <ReorderButtons
                  parentId={parentId}
                  childId={s.id}
                  disableUp={s.position === 1}
                  disableDown={s.position === siblingGroup.length}
                />
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** This person's children, in birth order, with up/down controls to reorder. */
function ChildrenSection({
  children,
  parentId,
}: {
  children: { id: string; name: string; surname: string | null; deceased: boolean }[];
  parentId: string;
}) {
  return (
    <div className="mb-7">
      <div className="font-mono text-[10.5px] uppercase tracking-wide text-boneDim mb-2.5">
        Children ({children.length})
      </div>
      {children.length === 0 ? (
        <p className="text-sm text-boneDim italic">None recorded yet.</p>
      ) : (
        <ol className="space-y-1">
          {children.map((c, i) => (
            <li key={c.id} className="flex items-center gap-2.5 text-[15px]">
              <span className="font-mono text-[10px] text-boneDim w-5 flex-none text-right">{i + 1}.</span>
              <NameLine p={c} />
              <ReorderButtons parentId={parentId} childId={c.id} disableUp={i === 0} disableDown={i === children.length - 1} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
