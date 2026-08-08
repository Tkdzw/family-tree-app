# Chiwashira–Ziwenga Family Tree — Phase 0

Database schema + seed script. This is the foundation everything else in the
phased plan (`family-tree-build-plan.md`) builds on. No web UI yet — that's
Phase 1.

## What this gives you

- A Postgres schema (`prisma/schema.prisma`) with `Person`, `ParentChild`,
  and `Union` — enough to represent the whole tree, ancestors, descendants,
  and siblings, without needing a Source/Confidence table yet.
- A seed script (`prisma/seed.ts`) that loads **exactly** what's currently in
  `01_Chiwashira_Ziwenga_Family_Tree_Version_00.25.xlsx` — Nyikadzino, his 21
  children, and their 103 recorded children. Gaps (Hosea and Peter Ziwenga
  having no children listed) are preserved as gaps, not guessed at.

## Setup

1. **Get a Postgres database.** Easiest options if you don't want to install
   Postgres locally: [Neon](https://neon.tech) or
   [Supabase](https://supabase.com) both have free tiers that work fine for
   a project this size. Or run Postgres locally / on your own server if you'd
   rather self-host.

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set your database URL:**
   ```bash
   cp .env.example .env
   # then edit .env and paste your real DATABASE_URL
   ```

4. **Create the tables:**
   ```bash
   npm run db:migrate
   ```

5. **Load the family data:**
   ```bash
   npm run db:seed
   ```

6. **Check it worked** — Prisma Studio gives you a browsable UI over the data
   without writing any queries:
   ```bash
   npm run db:studio
   ```
   You should see 1 root person (Nyikadzino), 21 branch people, and 103
   grandchildren, all linked through `ParentChild`.

## Filling the gaps

The seed script is a faithful copy of the spreadsheet, so it has the same
holes the spreadsheet has: no birth years, no places, no spouses, no data at
all for Hosea Ziwenga's or Peter Ziwenga's children, and nothing beyond two
generations from Nyikadzino.

Two ways to fill these in from here, in order of how much extra you want to
build right now:

- **Quickest:** edit records directly in Prisma Studio (`npm run db:studio`)
  as you collect information from family elders.
- **Better long-term:** build the small internal data-entry screen mentioned
  in Phase 0 of the plan, so branch heads can add their own missing
  generations without needing database access.

## Re-seeding after spreadsheet updates

`npm run db:seed` wipes and reloads all data — it's meant to be safe to
re-run, not to merge. If you update the spreadsheet, update the `BRANCHES`
array in `prisma/seed.ts` to match, then re-seed. Once the workbook
stabilizes, it's worth writing a real `.xlsx` parser instead of hand-copying
values into the seed file — but for a one-time Phase 0 load, this is faster.

## Next: Phase 1

Once this is seeded and checked, Phase 1 replaces the static
`family-tree-prototype.html` with a Next.js + React Flow app that reads from
this database instead of hardcoded JSON — same look and interaction model,
live data.
