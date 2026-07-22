# 01 · Brand Identity — "Coastal Modern / Junkanoo Night"

KeyLo keeps its name and its concept — peer-to-peer car rental for the Bahamas — but drops the generic iOS-blue look (`src/styles/theme.ts`, `#007AFF`) for an identity that feels premium and unmistakably Bahamian **without** tropicana clichés. No palm-tree wallpaper, no turquoise-everywhere, no beach-bar script fonts.

## The idea

A sophisticated warm-neutral base — limestone, sand, near-black ink — with **one** saturated accent drawn from Junkanoo costume palettes: a coral-orange used the way a sports car uses its badge. Sparingly, and always meaningfully (the primary action, the price, the brand mark). Turquoise is deliberately demoted: it appears only as a muted "Harbour Teal" for links, verified badges, and informational moments — never as a hero color. The result reads as a modern mobility brand that happens to be from the islands, not an island-themed app.

Brand line: **"Keys to the island."**

## Palette

### Daylight (default)

| Token | Hex | Use |
|---|---|---|
| Ink | `#141C24` | Primary text, dark surfaces, secondary buttons |
| Paper | `#FAF7F2` | App background — warm limestone off-white |
| Surface | `#FFFFFF` | Cards |
| Sand | `#E8E0D4` | Hairline borders, dividers |
| Sand Soft | `#F1EBE1` | Pressed states, secondary fills |
| Stone | `#8C8578` | Secondary text, placeholders |
| **Junkanoo Coral** | `#FF5A3C` | Primary CTAs, prices, favorites, brand mark |
| Coral Deep | `#E04326` | Pressed CTA |
| Harbour Teal | `#0E7C7B` | Links, verified badges, info |
| Goombay Gold | `#E8B44C` | Ratings, host-tier badges |
| Success | `#1E8E5A` · Warning `#E8B44C` · Error `#D6453D` | Semantic |

**The 10% rule:** Coral, Teal, and Gold together should never cover more than ~10% of any screen. If a screen feels colorful, it's wrong. Screens are ink-on-limestone; color is punctuation.

### Night Drive (dark)

Dark mode is a first-class brand moment (evening pickups, night drives to the airport), not an inversion afterthought.

| Token | Hex |
|---|---|
| Surface base | `#10161D` |
| Elevated surface | `#1A222C` |
| Border | `#2A3441` |
| Text | `#F2EFE9` / secondary `#94A0AD` |
| Coral (shifted warmer) | `#FF7A5C` |
| Teal | `#2AA198` · Gold `#F0C468` |

## Typography

- **Display: Fraunces** (Google Fonts, loadable via `@expo-google-fonts/fraunces`) — a warm, editorial serif with real personality. Used for screen titles, vehicle names, prices on detail/checkout, and empty-state headlines. SemiBold, tight tracking (−2%).
- **UI/body: Inter** (`@expo-google-fonts/inter`) — everything else: labels, buttons, body, data.
- Fallback: system stack (SF Pro / Roboto) is acceptable for v1; Fraunces is the differentiator and should ship with the first redesign build.
- Scale (4pt-friendly): 11 (overline labels, uppercase +8% tracking) · 13 · 15 (body) · 17 · 21 · 28 (screen titles) · 34 (hero).

## Shape, space, elevation

- **4pt spacing grid**: 4/8/12/16/20/24/32/40.
- **Radii**: 8 (inputs, chips) · 12 (buttons) · 16 (cards) · 20 (hero cards, sheets). Rounded but not bubbly.
- **Borders over shadows**: 1px hairlines in Sand define cards; only two shadow levels exist (subtle resting, floating sheet). This is what makes the limestone base feel crafted instead of flat.

## Motion

- Standard: 200–250ms ease-out for pushes, fades, chip toggles.
- Shared-element feel on vehicle card → detail (photo expands).
- Spring physics only in two places: bottom sheets and the favorite heart.
- `prefers-reduced-motion` / RN `AccessibilityInfo` respected everywhere.

## Voice

Confident, local, concise. Says "trip", never "reservation". Examples:
- Empty search: **"Nothing on this island yet."** / "Try Nassau — it has the deepest fleet."
- Booking confirmed: **"You've got the keys."**
- Host earnings zero-state: **"Your driveway could be earning."**

## Logo & mark

Wordmark "KeyLo" set in Fraunces SemiBold, ink on paper (coral on ink for dark contexts). App icon: coral key-bow forming a "K" counterform on ink — described here for a future asset pass; current `/assets` icons are placeholders to replace.

## Rejected directions (for the record)

- **"Regatta"** — nautical navy/white/signal-red. Crisp and credible but reads corporate-ferry, and navy + blue is exactly the genericness we're escaping.
- **"Pink Sand Editorial"** — Harbour Island pink sand + charcoal, high-fashion. The most distinctive option, but risky for a two-sided utility app: hosts managing fleets at 7am don't want a fashion magazine.

Coastal Modern wins because it is premium **and** warm, gender-neutral, works beautifully in dark mode, and gives Junkanoo — the most distinctive visual culture in the Bahamas — a role no competitor can copy.

## Token delivery

These tokens are implemented as CSS variables in [`mockups/tokens.css`](mockups/tokens.css) (the mockups' single source of truth) and map 1:1 onto a future replacement of `src/styles/theme.ts` and `src/config/gluestackTheme.ts` when the code phase begins.
