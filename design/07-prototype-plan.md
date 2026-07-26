# KeyLo — Mobile App Prototype Plan (tightened)

**Intent:** Complete the KeyLo prototype by building the screens the existing 9 mockups don't yet cover, at production quality with all states, real copy, and motion — then compose everything into a reviewable multi-screen launcher.

---

## What exists already (9 mockups, flat files)

These are done and loadable — skip rebuilding them. Edit only if a new screen introduces a component pattern that needs to be back-ported:

| # | File | Screen | Covers |
|---|------|--------|--------|
| 1 | `01-home-search.html` | Explore (customer home) | Search bar, island/date pills, featured car, browse-by-island |
| 2 | `02-search-results.html` | Search Results | List/map toggle, filter chips, result cards with Instant Book badges |
| 3 | `03-vehicle-detail.html` | Vehicle Detail (PDP) | Gallery carousel, host card, pickup options, sticky price bar |
| 4 | `04-checkout.html` | Checkout | Protection tiers, extras, itemized total, PayPal CTA |
| 5 | `05-trips.html` | Trips | Active/pending/past/receipts, lifecycle states |
| 6 | `06-host-dashboard.html` | Host · Today | Request queue, earnings strip, schedule, alerts |
| 7 | `07-dark-mode.html` | Night Drive (dark Explore) | Dark variant proving the token system works |
| 8 | `08-trip-checkin.html` | Trip Check-in | Photo capture grid, drive-side primer, odometer/fuel inputs |
| 9 | `09-host-storefront.html` | Host Storefront | Banner, bio, stats, fleet grid, share sheet |

All share `tokens.css` and the same component language (`.card`, `.chip`, `.btn`, `.vph`, `.tabbar`, `.badge`).

---

## Brand system (fixed — never deviate)

**Palette:** Ink `#141C24` / Paper `#FAF7F2` / Surface `#FFFFFF` / Sand `#E8E0D4` / Sand Soft `#F1EBE1` / Stone `#8C8578` / Coral `#FF5A3C` / Coral Deep `#E04326` / Teal `#0E7C7B` / Gold `#E8B44C`
**Night Drive (`.night`):** Ink `#F2EFE9` / Paper `#10161D` / Surface `#1A222C` / Sand `#2A3441` / Stone `#94A0AD` / Coral `#FF7A5C` (warmer) / Teal `#2AA198` / Gold `#F0C468`
**Type:** Fraunces 600 (display) + Inter 400-700 (UI). Scale: 11/13/15(body)/17/21/28(titles)/34(hero)
**Spacing:** 4pt grid (4/8/12/16/20/24/32/40)
**Radii:** 8/12/16/20 — cards get Sand hairlines, not heavy shadows
**Shadows:** 2 levels only (`shadow-1` resting, `shadow-2` floating)
**10% rule:** Coral + Teal + Gold ≤ ~10% of any screen. Coral is the one accent — Teal and Gold are supporting semantic colors.
**Voice:** "trip" not "reservation," "host" not "owner." Defaults to Bahamian resident case — tourist is always secondary, contextual framing.

Source: `tokens.css` + `01-brand-identity.md`

---

## Motion vocabulary (5 tokens, 5 rules)

| Token | Duration | Easing | Where |
|-------|----------|--------|-------|
| `quick` | 120ms | ease-out | Tap feedback, chip toggle, button press |
| `standard` | 200ms | ease-out | Card enter, content swap, tab switch |
| `reveal` | 280ms | cubic-bezier(0.2, 0, 0, 1) | Page reveal after skeleton, screen push |
| `spring` | physics (0.4, 0.8) | spring | Bottom sheet, heart fill, list reorder — only these three |
| `shimmer` | 1.5s single pass | ease-in-out | Skeleton loading — killed when content lands, never loops |

**Rules:**
1. No duration above 300ms outside cross-screen navigation
2. Spring physics on exactly 3 things: bottom sheet, heart fill, list reorder — never on scroll, opacity, or color
3. Skeleton shimmer runs once (1.5s), then holds static. No `animation-iteration-count: infinite` anywhere.
4. Shared-element transition exists ONLY on list card → PDP photo area. No other screen push gets one.
5. `@media (prefers-reduced-motion: reduce)` strips all transforms to 0.01ms. Opacity crossfades survive.

**Key flow moments:**
- Confirmation animation (the ONE celebratory moment): Coral circle springs 0→1, headline fades after 150ms, trip summary slides up 16px with 100ms stagger. Fires after API resolves.
- Role switch: profile card crossfade (180ms) + tab icons staggered fade (30ms offsets)
- Gallery: scroll container with dot indicator tracking scroll fraction — no timed slideshow, no parallax, no ScrollTrigger.

---

## Core design rule — genre-fluent, not novel

KeyLo reuses Turo/Uber/Airbnb IA exactly — bottom tab bar, search → filter sheet → list/map toggle, standard PDP anatomy, standard checkout order, trip lifecycle, star reviews. Distinctiveness lives entirely in the skin: Coral-on-limestone palette, Fraunces/Inter pairing, Bahamian voice, and local information choices (drive-side note, island filters, PayPal-first payment).

**Litmus test:** A Turo power-user navigates in seconds — but says "this doesn't feel like Turo."

---

## IA — Turo-parity bottom tab structure

### Customer tabs
| Tab | Contents |
|-----|----------|
| Explore | Search bar, island/date pills, popular, browse-by-island, list/map toggle on results |
| Trips | Upcoming / Active / Past / Receipts segmented chips |
| Inbox | Conversations + notification center |
| Profile | Account, verification, favorites, saved searches, settings, become host |

### Host tabs (after role switch in Profile)
| Tab | Contents |
|-----|----------|
| Today | Request queue, today's pickups/returns, alerts |
| Fleet | Vehicle list → Vehicle Manager (photos, calendar, pricing, docs) |
| Bookings | Request/upcoming/active/past host-side |
| Earnings | Balance, payout schedule, per-vehicle performance |

### Stack screens (push from tabs)
Vehicle Detail → Checkout → Confirmed. Trip Detail → Check-in/Check-out → Review modal. Chat Thread. Host Storefront. Vehicle Manager.

---

## Screens to build (what's missing)

### P0 — Core booking flow completion (build all 3)
| # | Screen | New file | Why new | Key states |
|---|--------|----------|---------|------------|
| 10 | **Booking Confirmed** | `10-booking-confirmed.html` | Doesn't exist — tripe end state after Checkout (04) | Confirmed with trip summary, add-to-calendar, share sheet, pickup instructions |
| 11 | **Trip Detail** | `11-trip-detail.html` | Doesn't exist — card-level states in Trips (05) but no dedicated detail | Upcoming countdown, active with extend/message, completed with review prompt, cancelled with refund info |
| 12 | **Inbox** | `12-inbox.html` | Doesn't exist — referenced in tab bar on every screen | Conversation list, notification center toggle, empty inbox, unread badge |

### P1 — Profile & onboarding (build 2)
| # | Screen | New file | Key states |
|---|--------|----------|------------|
| 13 | **Profile** | `13-profile.html` | Guest profile (verified), host/hosting toggle, public profile view |
| 14 | **Onboarding** | `14-onboarding.html` | 3 steps: Welcome/Login → Island picker → Notifications. Guest browse allowed without auth |

### P2 — Host depth & dark showcase (build 2)
| # | Screen | New file | Key states |
|---|--------|----------|------------|
| 15 | **Host Fleet** | `15-host-fleet.html` | Vehicle list with status/occupancy/rate, add vehicle CTA, bulk rate action |
| 16 | **Night Drive showcase** | `16-night-drive.html` | Composes Explore + PDP + Trips in `.night` — proves the token system end-to-end |

### Not building (explicit scope cut)
- **Vehicle Manager** — multi-section form (photos, pricing, calendar, docs). Too large for a single mockup; the Fleet screen references it.
- **Host Earnings, Host Bookings tabs** — follow the same card-list pattern as Fleet; not adding new layout knowledge.
- **Review modal, Chat thread** — small overlay surfaces; covered by the Trip Detail + Inbox screens.
- **Android variants** — deferred. The design system, components, and all layout patterns work identically on Android (412×900). Building one Android screen (Explore) would prove the adaptation; building 16 is not worth the output cost at plan stage.
- **Auth, Verification** — covered in onboarding screen. Verification is a push from Profile/Checkout.

---

## State matrix (applied to every new screen)

| State | Treatment |
|-------|-----------|
| Loading | Skeleton cards matching real layout geometry, Sand Soft fill, single 1.5s shimmer pass |
| Empty | Fraunces headline + subtext in KeyLo voice + contextual action |
| One result | Normal layout, no count clutter |
| Many results | Full scrollable list |
| Error | "Couldn't load" card with Coral left-border accent, retry button |
| First-time | Dismissible primer cards — never modal gates |
| Returning | Personalized greeting, repeat-host badge if applicable |

---

## Copy rules (KeyLo voice)

**Litmus test:** "Come explore paradise" ❌ — travel-brochure. "Need a car this weekend — your usual guy's got one free" ✅ — practical, local, works for everyone.

**Conventions:** "trip" / "host" / `$` for currency / "Fri, Aug 7" for dates / "Nassau · New Providence" for locations / "Toyota RAV4 2024" for vehicle names / real specific numbers ($246, 52 trips), never round demo values ($250, 50 trips).

**Key strings (the ones that carry brand):**
- Booking confirmed: "You've got the keys."
- Empty search: "Nothing on this island yet. Try Nassau — it has the deepest fleet."
- Empty trips: "No trips yet. Find a car nearby and you're off."
- Host empty: "Your driveway could be earning."
- Check-in primer: "We drive on the left in the Bahamas. You're good — this car is left-hand drive."
- Review prompt: "How was the 2024 RAV4? Your review helps Danielle and the community."

---

## Interaction patterns (Turo parity)

Bottom tab bar (4 tabs, active=ink, inactive=Stone). Search → filter sheet → list/map segmented toggle. Card → PDP with photo shared-element feel. PDP: gallery → title/rating → spec chips → host card → pickup options → policies accordion → reviews → sticky price bar. Checkout: trip summary → protection tiers (3 cards, selected gets Coral border) → extras (checkboxes) → itemized breakdown → pay. Booking lifecycle visible on trip cards: pending (Gold badge with countdown), active (Teal header), completed (muted + review CTA), cancelled (Error tint). Guided check-in: 4 exterior + odometer + fuel, offline queue badge. Two-sided blind reviews, 14-day reveal. Profile-level role switch (not top-level toggle). `.night` class on body for dark mode — every screen supports it.

---

## File organization

Flat files matching the existing structure — no subdirectories beyond what's already there:

```
project/
├── plan.md                          ← this file
├── index.html                       ← launcher hub (edit: add new screens to grid)
├── tokens.css                       ← shared tokens (existing, don't touch)
├── 01-home-search.html              ← existing
├── 02-search-results.html           ← existing
├── 03-vehicle-detail.html           ← existing
├── 04-checkout.html                 ← existing
├── 05-trips.html                    ← existing
├── 06-host-dashboard.html           ← existing
├── 07-dark-mode.html                ← existing
├── 08-trip-checkin.html             ← existing
├── 09-host-storefront.html          ← existing
├── 10-booking-confirmed.html        ← NEW
├── 11-trip-detail.html              ← NEW
├── 12-inbox.html                    ← NEW
├── 13-profile.html                  ← NEW
├── 14-onboarding.html               ← NEW
├── 15-host-fleet.html               ← NEW
└── 16-night-drive.html              ← NEW
```

Every new file loads `tokens.css` + Google Fonts (Fraunces + Inter) identically to existing mockups. Copy the component language from any existing file — do not invent new CSS classes.

---

## Rejected directions

1. **Hero image as Explore landing** — pushes island picker + date below fold. Island/date cards stay as default.
2. **3D map with car pins** — meaningless at archipelago scale. Island-level picker + list is correct.
3. **Fixed bottom sheet protector** — competes with tab bar for real estate. Screen-level filter button + sheet is standard muscle memory.
4. **Gold-dominant rating UI** — competing accent next to Coral CTAs. Gold stays on star icons and host-tier badges only.
5. **Guest/Host top-level toggle** — implies equal weight but most users are guests 90% of the time. Profile-level role switch keeps primary experience clean.

---

## Scope decision: Android

**Decision:** Deferred. The 9 existing mockups and 7 new screens all target iOS (390×844, Dynamic Island, iOS tab bar). Building a full Android mirror (412×900, punch-hole, Material nav bar) doubles the file count without adding layout knowledge — the component system, interaction patterns, and state matrix are identical across platforms. If the reviewer needs Android proof, building one screen (`android-explore.html`) demonstrates the adaptation. That call can be made after the iOS set is complete.

---

## Open questions (resolved)

- **Fidelity:** Use the existing SVG vehicle placeholder system (`.vph` + `.vph.sun` + `.vph.dusk`) from `tokens.css`. Real photography is a future asset pass.
- **Protection plan pricing:** Keep existing mockup values ($3,000 / $500 / $0 deductible, $18 / $37 / $62 per trip).
- **Motion library:** CSS transitions + CSS keyframes only. The `emilkowalski-motion` skill applied motion decisions to the plan; the build uses the decisions, not the library.

---

## Build order

1. `10-booking-confirmed.html` — completes the booking flow (Explore → Results → PDP → Checkout → **Confirmed**)
2. `11-trip-detail.html` — gives the Trips tab depth beyond card-level states
3. `12-inbox.html` — completes the 4-tab customer bar
4. `13-profile.html` — the fourth tab, plus host mode toggle
5. `14-onboarding.html` — the only pre-tab surface
6. `15-host-fleet.html` — one host tab beyond Today
7. `16-night-drive.html` — proves the token system across 3 surfaces
8. `index.html` — update the launcher hub to include all 16 screens

---

**Ready to build.** Say "go" or "build it."
