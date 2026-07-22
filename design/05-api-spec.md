# 05 · API Specification

REST, JSON, versioned under `/v1`. Auth = Bearer access token (see 04). Routers mirror `src/services/domains/*` so the client service layer re-points rather than rewrites. Entities reference [06-data-model.md](06-data-model.md).

**Auth levels:** 🌐 public · 🔑 authenticated · 🚗 host (own resources) · 🛡 admin

## Auth — `/v1/auth`

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register` | 🌐 | email, password, firstName, lastName → user + token pair |
| POST | `/auth/login` | 🌐 | → user + token pair; lockout after repeated failures |
| POST | `/auth/refresh` | 🌐 | rotating refresh token → new pair |
| POST | `/auth/logout` | 🔑 | revokes refresh token |
| POST | `/auth/password/forgot` · `/auth/password/reset` | 🌐 | email flow |
| POST | `/auth/email/verify` | 🌐 | token from email |

## Users — `/v1/users` (client: `UserService`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET/PATCH | `/users/me` | 🔑 | profile; PATCH for name, phone, avatar key, preferredIsland |
| POST | `/users/me/password` | 🔑 | change password |
| DELETE | `/users/me` | 🔑 | account deletion (soft) |
| GET | `/users/:id/profile` | 🌐 | public profile: name, avatar, verified badge, reviews, join date |
| GET/POST | `/users/me/verification` | 🔑 | status / submit license + selfie (R2 keys) |
| GET/PUT | `/users/me/notification-preferences` | 🔑 | |
| GET/POST/DELETE | `/users/me/saved-searches[/:id]` | 🔑 | filters JSON |
| GET | `/users/me/favorites` · PUT/DELETE `/users/me/favorites/:vehicleId` | 🔑 | |
| POST/DELETE | `/users/me/push-tokens` | 🔑 | Expo push token per device |

## Islands — `/v1/islands`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/islands` | 🌐 | seeded from `src/constants/islands.ts`; table not enum so new islands need no deploy |

## Vehicles — `/v1/vehicles` (client: `VehicleService`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/vehicles` | 🌐 | search: `island, start, end, type, seats, priceMin/Max, instantBook, features[], lat/lng/radius, sort, cursor`. Only returns date-available listings |
| GET | `/vehicles/:id` | 🌐 | detail incl. photos, features, extras, host card, review summary, policies |
| GET | `/vehicles/:id/calendar` | 🌐 | availability + nightly price for a month window |
| GET | `/vehicles/:id/reviews` | 🌐 | paginated |
| POST | `/vehicles` | 🚗 | create listing (wizard step 1) |
| PATCH/DELETE | `/vehicles/:id` | 🚗 | update / unlist |
| PUT | `/vehicles/:id/settings` | 🚗 | Instant Book, advance notice, min/max trip length |
| PUT | `/vehicles/:id/photos` | 🚗 | ordered list of R2 keys; primary flag |
| GET/PUT | `/vehicles/:id/availability` | 🚗 | blocked dates, price overrides; bulk body |
| GET/POST/DELETE | `/vehicles/:id/extras[/:extraId]` | 🚗 | host-defined extras (child seat, cooler…) |
| GET/POST | `/vehicles/:id/documents` | 🚗 | registration, insurance, inspection (R2 keys) → verification review |

## Bookings — `/v1/bookings` (client: `BookingService`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/bookings/quote` | 🌐 | dates + pickup option + protection tier + extras → itemized price breakdown (the checkout math, server-authoritative) |
| POST | `/bookings` | 🔑 | idempotent; creates `pending` (request) or `confirmed` (Instant Book) with payment intent |
| GET | `/bookings` | 🔑 | own bookings; `role=guest|host`, `status` filters |
| GET | `/bookings/:id` | 🔑 | full detail: state, payments, check-ins, modifications |
| POST | `/bookings/:id/approve` · `/decline` | 🚗 | request-to-book responses; approve captures payment |
| POST | `/bookings/:id/cancel` | 🔑 | policy-based refund computed server-side; `reason` |
| POST | `/bookings/:id/check-in` | 🔑 | photos (R2 keys), odometer, fuel; both parties → `active` |
| POST | `/bookings/:id/check-out` | 🔑 | mirrored; → `completed` |
| POST | `/bookings/:id/extend` | 🔑 | new end date → repriced delta, host approval unless auto-approvable |
| POST | `/bookings/:id/review` | 🔑 | two-sided blind review |

State transitions are validated server-side against the machine in 02; illegal transitions → `409`.

## Payments — `/v1/payments` (client: `PaymentService`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/payments` | 🔑 | receipt history (replaces PaymentHistory screen data) |
| GET | `/payments/:id/receipt` | 🔑 | itemized receipt |
| POST | `/payments/webhook` | 🌐 (Stripe sig) | source of truth for capture/refund/payout/dispute |
| GET | `/payments/setup-intent` | 🔑 | save a card for Payment Sheet |

## Hosts — `/v1/hosts` (client: `HostService`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/hosts` | 🔑 | become a host: profile + Stripe Connect onboarding link |
| GET/PATCH | `/hosts/me` | 🚗 | host profile, protection plan choice, payout account status |
| GET | `/hosts/me/dashboard` | 🚗 | Today feed: pending requests, pickups/returns, alerts |
| GET | `/hosts/me/earnings` | 🚗 | balance, payout schedule, `period=week|month|year` |
| GET | `/hosts/me/performance` | 🚗 | per-vehicle occupancy, revenue, rating |
| GET | `/hosts/@:handle` | 🌐 | public storefront by handle: banner, bio, stats, fleet (ordered), review highlights. Old handles 301 to current |
| GET/PATCH | `/hosts/me/storefront` | 🚗 | storefront editor: handle (unique, validated), bannerKey, tagline, featuredVehicleId, fleet ordering |
| GET | `/hosts/me/storefront/stats` | 🚗 | share attribution: storefront views, bookings `via storefront` |
| POST | `/hosts/me/payouts` | 🚗 | manual payout request (if balance policy allows) |

## Conversations — `/v1/conversations` (+ Socket.IO `/chat`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/conversations` | 🔑 | inbox list with unread counts |
| POST | `/conversations` | 🔑 | open (scoped to a booking or listing inquiry) |
| GET/POST | `/conversations/:id/messages` | 🔑 | history / send (REST fallback; live via socket) |

Socket.IO namespaces: `/chat` (message, typing, read receipts), `/bookings` (state transitions pushed to both parties).

## Uploads — `/v1/uploads`

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/uploads/presign` | 🔑 | `{ kind: vehicle_photo\|document\|avatar\|checkin_photo, contentType }` → presigned R2 PUT + final key. API never proxies file bytes |

## Admin — `/v1/admin` (🛡, minimal v1)

Listing verification review queue (`GET/POST /admin/verifications`), user/host suspension, dispute view. Ships as API-only (no admin UI in v1; use it via internal tooling).

## Conventions

- Cursor pagination (`cursor`, `limit`) on all lists; `ISO 8601` dates; money as integer cents; errors as `{ error: { code, message, details } }` matching the app's existing `ApiErrorCode` union in `src/types/index.ts`.
