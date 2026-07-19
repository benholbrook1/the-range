# The Range — Implementation Design

High-level product design for the golf training drill tracker. Use this document as the product/UX reference during the build phase. Technical stack, schemas, and folder layout live in a separate architecture document.

## Product principles

- Standalone app: progress and history are stored on the device.
- No account or login flow.
- No paywall or subscription UI.
- Drills are not hardcoded into screens. They are defined in standardized packs that the app can load and present through generic screens.
- Moving progress between phones via profile export/import is desirable later; it is not required for MVP.

## Navigation

Bottom tabs for the main destinations:

- **Home**
- **Drills**
- **History**
- **More**

From those tabs, stack screens cover:

- **Drill Detail** → **Active Session**
- **History** → **Session Detail**

Profile import/export (when built) lives under More, not as onboarding.

## Major screens (MVP)

### 1. Home

**Job:** Answer “what should I practice today?” and resume anything in progress.

**Layout feel:** One composition — brand/name as the hero signal, a short status line (for example “Last session: 2 days ago”), one primary CTA (“Start a drill”), and a short “Continue” row only if a session is unfinished. No stat strips or card grids in the first viewport.

**Contents:**

- Greeting / app name
- Primary CTA → pick a drill or jump into a suggested one
- Optional: last-practiced drill + “Repeat”
- Optional: unfinished session resume banner

### 2. Drills (library)

**Job:** Browse and open drills loaded into the local catalog.

**Layout feel:** Search plus simple category filters (Putting, Short Game, Full Swing, and similar), then a clean list of drills (name, skill focus, estimated time). Not a dense marketplace.

**Contents:**

- Search
- Category filter
- Drill list from loaded packs
- Affordance to add or import a drill pack

### 3. Drill Detail

**Job:** Explain the drill and start it.

**Contents:**

- Title, category, duration estimate
- Instructions / setup (from the drill definition)
- Scoring / success criteria preview
- Personal best / last score when available
- Primary CTA: Start

### 4. Active Session

**Job:** Run the drill and log attempts with minimal friction.

**Contents:**

- Drill name and current step / round
- Input UI driven by the drill’s scoring definition (makes, reps, totals, and similar)
- Progress within the session
- End / Save session
- Optional notes at the end

This is the interaction-heavy screen; structured controls belong here.

### 5. History

**Job:** See past practice over time.

**Contents:**

- Chronological list of sessions (date, drill name, summary score)
- Filter by drill or category
- Tap → Session Detail

### 6. Session Detail

**Job:** Review one completed session.

**Contents:**

- Drill name, date/time, duration
- Score breakdown from that session’s logged attempts
- Notes
- “Repeat this drill” CTA

### 7. More / Settings

**Job:** Local-only preferences and data tools — not an account page.

**Contents:**

- Optional local display name / nickname
- Units / defaults
- Manage drill packs (list installed packs, add from file)
- Export / Import profile (post-MVP; stub or “Coming soon” is fine if the nav slot is reserved early)
- About / version
- Clear local data (destructive)

## Explicitly out of MVP UI

- Login / signup
- Paywall / subscription
- Cloud sync
- Social share

## Drill packs (product concept)

Drills ship as versioned content packs the app can load. Screens read pack definitions and adapt (instructions, scoring, progress) without hardcoding individual drills. MVP includes a bundled starter set of drills plus the ability to add more packs. Full profile export/import between devices is post-MVP.

## Post-MVP (product)

- Full profile export / import between phones
- In-app custom drill authoring
- Trends / charts for a drill over time

## MVP vs later

| MVP | Later |
| --- | --- |
| Core screens above | Account / login |
| Bundled drills + load additional packs | Full profile export / import |
| Local progress and history | Cloud sync, paywall |
| Practice logging driven by drill definitions | In-app drill authoring UI |

## Related docs

- Architecture details (stack, data model, schemas, project layout) will live in a separate architecture document when that phase begins.
