# 03 · Screen Inventory — old → new mapping

Every route in `src/navigation/routes.ts` accounted for. Verdicts: **Keep** (redesigned in place), **Merge** (absorbed into another surface), **Cut** (removed from v1).

## Auth & onboarding

| Current route | Verdict | New home |
|---|---|---|
| `Login`, `Registration` | Keep | Single **Auth** screen: email+password, toggle between sign in / create account. Guest browsing allowed without auth. |
| `FirebaseAuthScreen` | Cut | Auth is custom JWT against the new API (see 04). |
| `VerificationScreen` | Keep (repurposed) | **Identity verification**: license photo + selfie, triggered at first booking or from Profile. |
| `OnboardingWelcome` | Keep | Step 1 of 3. |
| `OnboardingRoleSelection` | Cut | Everyone starts as guest; "Become a host" lives in Profile. |
| `OnboardingIslandSelection` | Keep | Step 2 of 3 — sets default Explore island filter. |
| `OnboardingPermissions` | Merge | Step 3 = notifications only; location asked contextually at first map use. |
| `OnboardingComplete` | Cut | Lands directly in Explore. |

## Customer — discovery & booking

| Current route | Verdict | New home |
|---|---|---|
| `IslandSelection` | Merge | Island is a **filter pill** on Explore, not a gate screen. |
| `Search`, `SearchResults` | Merge | One **Explore** screen: search bar, island + date pills, filter sheet, results list. Mockups 01–02. |
| `Map` | Merge | List/map **segmented toggle** inside Explore. |
| `VehicleDetail` | Keep | Redesigned: gallery, Fraunces title, host card, reviews, policies, sticky price bar with Instant Book (⚡) or Request state. Mockup 03. |
| `Checkout` | Keep | Sections: dates & pickup location → protection tier → extras → itemized total → pay. Mockup 04. |
| `Payment`, `PayPalConfirmation` | Merge | Payment happens inside Checkout via Stripe Payment Sheet; no separate payment screens. |
| `BankTransferInstructions`, `CryptoPayment` | Cut | v1 is card-only via Stripe. |
| `BookingConfirmed` | Keep | "You've got the keys." confirmation with trip summary + add-to-calendar. |
| `CompareVehicles` | Cut | Deferred; favorites covers the job. |
| `SavedSearches` | Merge | Row in Profile; saving happens from the Explore filter sheet. |
| `Favorites` | Merge | Row in Profile (grid view). |

## Customer — trips & social

| Current route | Verdict | New home |
|---|---|---|
| `MyBookings` | Keep (renamed) | **Trips** tab: upcoming / active / past. Mockup 05. |
| — (new) | New | **Trip detail**: countdown, pickup instructions, check-in/check-out entry, extend trip, receipt, cancel. |
| — (new) | New | **Trip check-in / check-out**: guided photo capture (condition ×4, odometer, fuel). Mockup 08. |
| `PaymentHistory` | Merge | "Receipts" section inside Trips. |
| `WriteReview` | Keep | Modal after check-out; two-sided blind reviews. |
| `Chat` | Keep | **Inbox** tab: conversations (booking-scoped) + notification center. |
| `Profile`, `PublicUserProfile` | Keep | Profile tab; public profile shows verified badge, reviews, join date. |
| `NotificationPreferences` | Merge | Settings row in Profile. |

## Host

| Current route | Verdict | New home |
|---|---|---|
| `RoleBasedDashboard` | Cut | Tab navigators per mode handle routing. |
| `HostDashboard`, `OwnerDashboard` | **Merge (dedupe)** | One **Today** tab: request queue, today's pickups/returns, alerts. Mockup 06. |
| `FleetManagement` | Keep | **Fleet** tab: vehicle cards with status, occupancy, rate. |
| `VehiclePhotoUpload` | Merge | Photos section of **Vehicle Manager**. |
| `VehicleAvailability` | Merge | Calendar & pricing section of Vehicle Manager (blocked dates, price overrides). |
| `VehicleDocumentManagement` | Merge | Documents section of Vehicle Manager (registration, insurance, inspection). |
| `VehicleConditionTracker` | Merge | Condition section of Vehicle Manager (fed by trip check-in/out photos). |
| — (new) | New | **Booking settings** section of Vehicle Manager: Instant Book toggle, advance notice, min/max trip length, extras. |
| `BulkRateUpdate` | Merge | Multi-select action sheet on Fleet. |
| `HostStorefront` | Keep (upgraded) | Public **shareable storefront** at `keylo.bs/@handle`: banner, bio, stats, filterable fleet grid, review highlights, share sheet. Mockup 09. |
| — (new) | New | **My storefront editor** (host mode): claim handle, banner, bio, featured vehicle, fleet ordering. |
| `FinancialReports`, `VehiclePerformance` | Merge | One **Earnings** tab: balance, payout schedule, per-vehicle table, exportable report. |
| — (new) | New | **List a vehicle** wizard (6 steps, see 02). |

## Dev/demo & duplicates

| Item | Verdict |
|---|---|
| `ComponentDemoScreen`, `GluestackDemoScreen` | Cut |
| `EnhancedAppNavigator` + `NavigationCompatibilityLayer` | Cut — one navigator (`AppNavigator`) survives the rebuild |
| `authSlice.ts.backup`, `firebaseAuthService.ts.backup`, duplicate `context/` vs `contexts/` | Cut in code phase |

## Net result

**~40 routes → 25 surfaces** (8 tabs across two modes, 13 stack screens, 4 sheets/modals). Every cut is either a dedupe, a deferral with a stated fallback, or replaced by a Turo-parity surface (check-in, vehicle manager, list-a-vehicle) the old app was missing.

Screens without mockups follow the mockup component language: cards from `tokens.css`, ink-on-limestone, coral only on the primary action, section headers as 11px uppercase labels, Fraunces for titles.
