# Chiwashira–Ziwenga Family Tree

Phase 0 (database) + Phase 1 (live web app) of the phased build plan.

## What's in here

- **`prisma/schema.prisma`** — `Person`, `ParentChild`, `Union`. Enough to represent
  the whole tree without a Source/Confidence table yet (that's Phase 4).
- **`prisma/seed.ts`** — loads exactly what's currently in
  `01_Chiwashira_Ziwenga_Family_Tree_Version_00.25.xlsx`: Nyikadzino, his 21 children,
  their 103 recorded children. Gaps (Hosea and Peter Ziwenga having no children
  listed) are preserved as gaps, not guessed at.
- **`app/`, `components/`, `lib/`** — a Next.js app that reads the tree live from
  Postgres and renders it with the same look and interaction model as the earlier
  static prototype (search, expand/collapse branch cards), except it now supports
  arbitrary depth, not just two generations, and updates automatically as data
  is added to the database.

**Design note:** the original plan suggested React Flow for a node-graph canvas.
This build uses the accordion/card interaction model from the prototype instead —
it works much better on the phones most of the family will actually use, per the
plan's own mobile-first principle. A node-graph canvas view is easy to add later
as an alternate view (Phase 2/3) if it turns out to be wanted alongside this one.

## Setup

1. **Get a Postgres database.** Free-tier options that work fine at this scale:
   [Neon](https://neon.tech), [Supabase](https://supabase.com). Or self-host.

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set your database URL:**
   ```bash
   cp .env.example .env
   # edit .env, paste your real DATABASE_URL
   ```

4. **Create the tables and load the data:**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Run the app:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 — you should see the live tree: Nyikadzino at the
   root, 21 branch cards, search working across every recorded name.

6. **Browse/edit the raw data any time** without writing queries:
   ```bash
   npm run db:studio
   ```

## Data source update — grouped by wife

The seed data now comes from `prisma/data/source-tree.json` instead of the
earlier hand-typed spreadsheet extraction — it's a fuller export that includes
the ancestor lineage above Nyikadzino (Mbiru → ... → Ziwenga → Nyikadzino
Burenge) and his 7 wives, alongside the same 21 children and their recorded
children.

**The wife grouping is a placeholder.** None of the 21 children have a
mother recorded in the source file — every one is flagged "please assign if
known." Until that's confirmed, `prisma/seed.ts` block-distributes them
evenly across the 7 wives (children 1–3 under Wife I, 4–6 under Wife II, and
so on) purely so the tree can be browsed grouped by wife. This is stored in
a separate `placeholderMotherId` field, deliberately *not* a real
`ParentChild` row — so it never gets confused with verified biological data,
and correcting it later never touches anything else.

**To fix it once the real assignments are known:** open `prisma/seed.ts`,
find the `buildPlaceholderWifeMap()` function, and replace it with the real
child → wife mapping (or edit it directly in Prisma Studio after seeding —
either way, then re-run `npm run db:seed`). Wife names ("Wife I", "Wife II"
etc.) are also placeholders — update those same records once real names are
known.

**Two things worth double-checking against the original spreadsheet:**
"Big D" (one of Ben Man'arayi's children) doesn't appear in this JSON export,
and "Mununuri Godfery" (also Ben's) got split into two separate people,
"Mununuri" and "Godfrey." Worth confirming which version is correct before
this data goes out to the wider family.

## Editing and verifying data in the app

Every person now has an editable profile page (`/person/[id]`) — no more
needing Prisma Studio for routine corrections:

- **"Edit details"** (collapsed by default) lets you fix name, gender, totem,
  birth year/place, deceased status, notes, and source — for anyone.
- **For Nyikadzino's 21 children specifically**, there's a dedicated "Mother
  (wife)" box: it shows the current placeholder guess, lets you change it via
  a dropdown, and has a "Confirmed — lock this in" checkbox. Checking that
  box before saving converts the placeholder into a real, verified
  `ParentChild` record — the child now has an actual recorded mother, not
  just a guess. A verified assignment shows a "remove" link if it turns out
  to be wrong.
- The tree view itself now shows **"✓ mother confirmed" / "mother
  unverified"** on every child card, and each wife's section header shows
  a running **"x/y confirmed"** count — so you can see at a glance how much
  of the grouping is still placeholder versus actually verified.

This is all built on top of the same `placeholderMotherId` vs. real
`ParentChild` distinction from before: confirming a child's mother here
does exactly what manually editing `prisma/seed.ts` would have done, just
without needing to touch code or re-seed.

## Editing wives and adding/linking relationships

Every profile page (including each wife's) now shows a **Spouses** section
alongside Parents/Siblings/Children — so a wife's own page shows Nyikadzino
as her spouse, and his page lists all of his wives. Renaming a wife from
"Wife I" to her real name is just the existing "Edit details" form on her
own profile — nothing wife-specific needed there.

New on every profile, under **"Add or link a relative"**:

- **Add a new child** — name + gender, creates the person and links them as
  a child of whoever's profile you're on.
- **Add a new spouse** — same, but creates a `Union` instead of a
  `ParentChild` link. This is how you'd add an 8th wife if one turns up, or
  add a spouse for anyone else in the tree.
- **Link an existing person** — search-select anyone already in the tree and
  connect them as this person's parent, child, or spouse. Useful for fixing
  a missing father link, or connecting two branches that turn out to be the
  same family once you have more information.

All of this writes real relationship rows (`ParentChild` / `Union`), not
placeholders — the only placeholder mechanism in the whole app is the wife
grouping described above, and that one gets promoted to a real link the
moment you check "Confirmed."

## Organogram layout

The homepage is now a real org-chart, not accordion cards:

- **Patriarch at the top**, connected down to his **wives** side by side
  (classic org-chart connector lines — a horizontal bar linking the wives,
  a vertical stem down from the patriarch).
- **Each wife connects down to her own children**, left to right in the
  same order used throughout the app.
- **If a person has no spouse on file** (true for literally everyone below
  the wife tier right now, since only Nyikadzino's marriages are recorded),
  their children just sit directly beneath them — no empty spouse tier
  rendered. The chart applies this rule recursively, so grandchildren and
  further generations render the same way once that data exists.
- The chart is built once from the same live data as before
  (`components/OrgChart.tsx`, fed by a small `TreeNode → OrgNode` transform
  in `TreeView.tsx`) — nothing new to seed or migrate for this change.
- It opens three tiers deep by default (patriarch → wives → children) and
  collapses further generations behind a click, since a fully-expanded chart
  of 100+ people would be unusably wide. Search and "find me" still work —
  a match auto-expands the path down to it.
- Horizontal scrolling handles width on both desktop and mobile (`overflow-x-auto`
  on the chart container) rather than trying to shrink boxes to fit.

## Filling the gaps

The seeded data has the same holes the spreadsheet has: no birth years, no
places, no spouses, nothing for Hosea's or Peter's children, nothing beyond two
generations from Nyikadzino. Until a proper data-entry screen exists, the
fastest way to fill these in is directly through Prisma Studio (`npm run
db:studio`) — edits show up on the live site immediately on refresh.

## Re-seeding after spreadsheet updates

`npm run db:seed` wipes and reloads all data — it's meant to be safe to re-run,
not to merge. If the spreadsheet changes, update the `BRANCHES` array in
`prisma/seed.ts` to match, then re-seed.

## Deploying

Any host that runs Next.js works (Vercel is the path of least resistance given
this stack). Point `DATABASE_URL` at your production Postgres instance and
you're live — no separate backend needed at this scale.

## Next: Phase 2

Person profile pages, "find me" (highlight your own direct line, dim the rest),
and a relationship path finder between any two people.
