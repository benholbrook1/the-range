# The Range — Design

Visual and interaction design for The Range. Product screens live in [implementation.md](implementation.md); technical structure in [architecture.md](architecture.md). This document is the look-and-feel reference for the build.

## Direction

**Clean, modern, quiet.** The app should feel like a well-made practice notebook for the range — calm surfaces, strong type, and clear actions. Brand and craft matter more than decoration.

Mood words: crisp, athletic, editorial, uncluttered.

Not: flashy, neon, “startup SaaS,” skeuomorphic golf kitsch.

## Principles

1. **One job per screen** — One headline purpose; supporting text stays short.
2. **Brand first on Home** — “The Range” is a hero-level signal, not a tiny nav label. No competing headline that overpowers the name.
3. **Hierarchy through type and space** — Not through cards, chips, or chrome.
4. **Real atmosphere when imagery is used** — Product/place photos (range, turf, balls, practice). Abstract blobs and decorative washes do not count as the main visual idea.
5. **Restraint** — If a border, shadow, or background can be removed without hurting clarity, remove it.
6. **Touch-first clarity** — Large tap targets for Active Session; readable outdoors (assume bright light).

## Explicitly avoid (AI / generic UI cliches)

Do **not** use:

- Gradient backgrounds or gradient CTAs (purple→indigo, sunrise washes, mesh gradients)
- Glow / neon accents or glassmorphism
- Multi-layer drop shadows
- Pill clusters, badge stickers, floating promo chips on imagery
- Default font stacks as the brand voice (system UI font only for fallbacks)
- Purple-as-brand, cream+terracotta “editorial” kits, or dense newspaper layouts
- Emoji as UI ornament
- Card grids in the hero / Home first viewport
- Dark mode as the default MVP look (light, high-clarity surfaces first)

## Color

Solid surfaces. Contrast from pigment and type weight, not from gradients.

| Token | Role | Suggested value |
| --- | --- | --- |
| `--color-bg` | App background | `#F7F6F3` warm off-white (paper, not cream theater) |
| `--color-surface` | Raised / grouped areas when needed | `#FFFFFF` |
| `--color-text` | Primary text | `#1A1C1A` near-black |
| `--color-text-muted` | Secondary text | `#5C635C` |
| `--color-border` | Hairline dividers only | `#E2E4E0` |
| `--color-accent` | Primary actions, focus | `#1F6B4A` deep fairway green |
| `--color-accent-pressed` | Pressed primary | `#18563B` |
| `--color-danger` | Destructive (clear data) | `#A33B2C` |
| `--color-success` | Make / positive feedback | `#2F7D4A` |

Accent green is for **actions and sparingly for status** — not for flooding backgrounds. Most UI stays neutral paper + ink.

Outdoor readability: keep body text on `--color-bg` or white; avoid low-contrast gray-on-gray.

## Typography

Expressive but simple — two families max.

| Role | Direction |
| --- | --- |
| **Display / brand** | A confident grotesque or soft geometric sans with character (e.g. something in the spirit of *General Sans*, *Satoshi*, or *Neue Haas Grotesk*). Used for “The Range” and screen titles. |
| **Body / UI** | Same family at regular/medium weights, or a closely related workhorse sans for dense lists. |
| **Mono (optional)** | Tabular figures for scores and timers only. |

Rules:

- Home brand mark: largest type on that screen.
- Screen titles: one clear size step below brand; do not introduce a second competing display style.
- Body ~16px equivalent; secondary ~14px; avoid tiny legal-looking UI type.
- Line length comfortable; prefer short supporting sentences over paragraphs.
- No all-caps section labels as decoration.

## Layout and spacing

- Base unit: **8px**. Common gaps: 8 / 16 / 24 / 32 / 48.
- Horizontal page padding: **20–24px**.
- Home first viewport: brand, one short status line, one CTA group, optional single resume row — nothing else.
- Lists (Drills, History): full-bleed rows with hairline separators, not boxed cards.
- Prefer **whitespace and alignment** over containers.

### Cards

Default: **no cards**.  
Allowed only when the container itself is the interaction (e.g. a tappable scoring control). If removing background/radius/shadow doesn’t hurt understanding, it should not be a card.

## Components (visual rules)

| Element | Treatment |
| --- | --- |
| **Primary button** | Solid `--color-accent`, white label, modest radius (8–12px), full-width on mobile primary actions. No gradient fill. |
| **Secondary button** | Text on paper, accent or ink label, or quiet outline using `--color-border`. |
| **List row** | Title + one meta line (category, time, score). Chevron optional. Divider hairline. |
| **Filters** | Simple text toggles or underlined selected state — not rounded-full pill carousels. |
| **Empty states** | Short sentence + one action. No illustration clutter required for MVP. |
| **Tab bar** | Light surface, muted icons/labels, accent for selected. No floating orb tab bar. |
| **Inputs (session)** | Large, obvious controls (stepper, make/miss). Prioritize speed over ornament. |

## Imagery

- Optional on Home only if it strengthens place/practice feel (range / turf / practice). Prefer a single full-bleed photo plane behind or below brand — not inset rounded media cards or collages.
- No floating badges or stickers on top of hero media.
- If no strong photo asset yet: ship a strong typographic Home on paper background — better than a fake abstract gradient.

## Motion

Ship a few intentional motions; keep them short and functional:

1. **Screen enter** — light fade/slide (~200ms) for stack pushes.
2. **Primary CTA press** — opacity or scale feedback on tap.
3. **Session log** — brief confirmation when an attempt is recorded (e.g. soft highlight flash on the counter).

No ambient looping gradients, parallax noise, or confetti.

## Screen notes (visual)

### Home
Paper background. Large “The Range.” One muted status line. One accent primary CTA. Resume row only if needed. Quiet and confident — not a dashboard.

### Drills
Search field + simple category filters. Long list of drills. Meta as muted text. Import affordance is secondary (text button or header action), not a promo banner.

### Drill Detail
Title block, short instruction list, criteria as plain text, personal best as a single muted line. Start = primary button pinned comfortably above the home indicator.

### Active Session
Most “instrument-like” screen: big current count, big input controls, drill name secondary. Minimize chrome so gloves / outdoor use still work.

### History / Session Detail
Chronological list; detail is a readable summary (date, score breakdown, notes). Repeat CTA as secondary or primary at bottom — not a card stack of stats.

### More
Grouped settings list with hairlines. Destructive action clearly separated and labeled. No account hero, no upgrade banners.

## Accessibility and outdoor use

- Minimum tap target ~44×44 pt for primary controls.
- Do not rely on color alone for make/miss (use label + color).
- Support Dynamic Type where reasonable; don’t clip titles.
- Test primary flows in bright light: accent green on white/paper must remain obvious.

## Theme implementation note

Define tokens in `src/theme` (see [architecture.md](architecture.md)). Screens consume tokens only — no one-off hex values in feature files.

## Related docs

- Product / screens: [implementation.md](implementation.md)
- Technical architecture: [architecture.md](architecture.md)
- MVP build sequence: [mvp-build.md](mvp-build.md)
