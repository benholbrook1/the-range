# The Range — MVP Build Guide

Step-by-step build sequence for the MVP. **Follow this document in order during the build phase.** Product intent: [implementation.md](implementation.md). Technical rules: [architecture.md](architecture.md). Visual rules: [design.md](design.md).

Do not invent auth, paywalls, cloud sync, or network-dependent workflows. Keep main paths offline.

---

## How to use this guide

1. Complete steps in order unless a step explicitly allows parallel work.
2. After each major step: commit with a clear message.
3. Run unit tests once the test harness exists (Step 3 onward); fix failures before moving on.
4. Treat [design.md](design.md) as binding for UI — no gradients or listed cliches.
5. When every checkbox in **MVP done** is checked, the build phase is complete.

---

## Step 0 — Preconditions

- [ ] Read [implementation.md](implementation.md), [architecture.md](architecture.md), and [design.md](design.md)
- [ ] Confirm MVP excludes: login, paywall, cloud sync, social share, full profile export/import, in-app drill authoring, trends charts

---

## Step 1 — Scaffold the Expo app

- [ ] Create Expo (TypeScript) app with Expo Router
- [ ] Set app name / slug to match **The Range**
- [ ] Establish folder layout from architecture (`app/`, `src/features`, `src/components`, `src/services`, `src/db`, `src/domain`, `src/theme`, `assets/drills`)
- [ ] Wire root `_layout` and empty `(tabs)` shell: Home, Drills, History, More
- [ ] Add stack placeholders: `drill/[id]`, `session/active`, `session/[id]`
- [ ] App launches to tabs with stub screens (no real data yet)

---

## Step 2 — Theme and shared UI primitives

- [ ] Implement `src/theme` tokens from [design.md](design.md) (colors, type, spacing)
- [ ] Add shared primitives under `src/components/ui/` (Screen, Text, Button, EmptyState, List row / divider)
- [ ] Apply paper background and accent primary button — no gradients
- [ ] Tab bar styling matches design (light, quiet, accent selected)

---

## Step 3 — Unit test harness

- [ ] Configure Jest for Expo/TypeScript (`npm test` works)
- [ ] Add a trivial smoke test so CI/local runs are green
- [ ] Document the test command in README

Unit tests are required for MVP — see [architecture.md](architecture.md) Testing section. Add tests in the same PR/commit batch as the code they cover from Step 4 onward.

---

## Step 4 — Domain types and pure helpers (+ tests)

- [ ] Define types: Pack, Drill, Session, Attempt, Settings, scoring configs
- [ ] Implement `domain/scoring.ts` for `makes_out_of`, `reps`, `score_total`
- [ ] Implement formatters / category helpers as needed
- [ ] **Unit tests:** scoring summaries and edge cases (empty, zero, perfect, all miss)

---

## Step 5 — Database layer

- [ ] Open SQLite via `expo-sqlite`; migrations on startup
- [ ] Tables: packs, drills, sessions, attempts, settings
- [ ] Query modules under `src/db/queries/` (no React in `db/`)
- [ ] Root layout bootstraps DB before showing main UI (loading or error only)

---

## Step 6 — Drill packs (+ validation tests)

- [ ] Define pack JSON schema; validate on install (e.g. Zod)
- [ ] Ship bundled starter pack(s) in `assets/drills/`
- [ ] `services/bootstrap` + `services/packs`: first-launch seed; install from validated payload
- [ ] Reject invalid packs without partial writes
- [ ] **Unit tests:** valid pack accepted; invalid / wrong schemaVersion rejected

---

## Step 7 — Drill and session services (+ tests)

- [ ] `services/drills`: list, get by id, search, filter by category
- [ ] `services/sessions`: start, resume active, log attempt, complete (notes), list history, get detail
- [ ] Persist attempts immediately so app kill does not lose progress
- [ ] **Unit tests:** session lifecycle (start → log → complete); resume active; drill list/filter helpers

---

## Step 8 — Home screen

- [ ] Feature: `features/home` — brand-forward layout per design + implementation
- [ ] Primary CTA to start / browse drills
- [ ] Show resume banner if an active session exists
- [ ] Optional: last practiced + Repeat
- [ ] Thin route in `app/(tabs)/index.tsx`

---

## Step 9 — Drills library + Drill Detail

- [ ] `features/drills`: searchable list, simple category filters (not pill clusters)
- [ ] Drill Detail: instructions, criteria, personal best/last score, Start CTA
- [ ] Affordance to add/import a drill pack (local file)
- [ ] Routes: `drills` tab + `drill/[id]`

---

## Step 10 — Active Session

- [ ] `features/session`: large controls driven by scoring type
- [ ] Progress within session; end/save; optional notes
- [ ] Writes go through `services/sessions` only
- [ ] Route: `session/active`
- [ ] Outdoor-friendly tap targets per design

---

## Step 11 — History + Session Detail

- [ ] Chronological session list with filter
- [ ] Session Detail: breakdown, notes, Repeat drill CTA
- [ ] Routes: `history` tab + `session/[id]`

---

## Step 12 — More / Settings

- [ ] Local display name, units/defaults as needed
- [ ] Manage installed packs; add pack from file
- [ ] About / version
- [ ] Clear local data (destructive, confirmed)
- [ ] Profile export/import: stub or “Coming soon” only (not full MVP feature)

---

## Step 13 — Polish and offline verification

- [ ] Walk all MVP screens against [implementation.md](implementation.md) and [design.md](design.md)
- [ ] Confirm no login, paywall, or network requirement for core flows
- [ ] Airplane-mode style check: browse, start session, log, complete, view history
- [ ] Empty states for no drills / no history
- [ ] README: how to run app + how to run tests

---

## Step 14 — MVP acceptance

All must be true:

- [ ] Tabs: Home, Drills, History, More — working
- [ ] Bundled drills load; can open detail and start a session
- [ ] Can complete a session and see it in History / Detail
- [ ] Can resume an unfinished session from Home
- [ ] Can install an additional valid pack from a local file; invalid pack fails safely
- [ ] Settings: clear data works; no account UI
- [ ] UI matches design direction (clean, no gradients/cliches)
- [ ] `npm test` (or equivalent) passes with domain + pack validation + session service coverage

---

## Out of scope until after MVP

- Full profile export/import between phones
- In-app custom drill authoring
- Trends / charts
- E2E device automation
- Dark mode as default
- Cloud catalogs or sync

---

## Related docs

- [implementation.md](implementation.md) — product / screens
- [architecture.md](architecture.md) — structure, offline, testing policy
- [design.md](design.md) — visual system
