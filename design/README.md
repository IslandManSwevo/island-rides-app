# KeyLo Redesign — Design Package

A complete reimagining of KeyLo (peer-to-peer car rental for the Bahamas) that keeps the concept and the single Expo codebase, functions like **Turo**, and looks like nothing else: **"Coastal Modern / Junkanoo Night."** This package is docs + mockups only — the approval gate before any code rebuild.

## Contents

| Doc | What's in it |
|---|---|
| [01 · Brand identity](01-brand-identity.md) | Palette, type (Fraunces + Inter), shape/motion, voice, rejected directions |
| [02 · User flows](02-user-flows.md) | Two-role IA, booking flow, lifecycle state machine, Turo-parity mechanics |
| [03 · Screen inventory](03-screen-inventory.md) | Every current route mapped: keep / merge / cut (~40 → 24 surfaces) |
| [04 · Backend architecture](04-backend-architecture.md) | Railway topology (Fastify + Postgres + Redis + R2), auth, Stripe, jobs |
| [05 · API spec](05-api-spec.md) | REST surface by domain, mirrors the app's existing service layer |
| [06 · Data model](06-data-model.md) | ER diagram + Prisma schema sketch |
| [mockups/index.html](mockups/index.html) | 9 HTML mockups on the shared token sheet — **start here** |

## How to review

Open `design/mockups/index.html` in any browser (no build, no dependencies — Google Fonts load when online, system fonts otherwise). Click through 01→08; each mockup has a caption explaining what it demonstrates. Then read the docs in order.

## Decision log

| Decision | Chosen | Rejected & why |
|---|---|---|
| Deliverable | Design package before code | Straight-to-code — too many direction decisions to make silently |
| Platform | One Expo codebase (iOS/Android/web) | Separate Next.js site — doubles the design system for a v1 |
| Brand | Keep KeyLo · "Coastal Modern / Junkanoo Night" | "Regatta" (reads corporate-ferry) · "Pink Sand Editorial" (too fashion for a utility app) |
| Functional model | Turo parity: Instant Book/request, check-in/out, protection tiers, host tools | Simple rental-desk flow — the host marketplace is the product |
| Host storefronts | Shareable branded pages at `keylo.bs/@handle` with editor + share attribution | Bare host profile page — hosts marketing their own fleets is a growth loop |
| Backend host | Railway (api + Postgres + Redis) | — (user's choice) |
| Framework | Fastify + TS + Zod | NestJS (heavier), Express (unvalidated) |
| ORM | Prisma | Drizzle — Prisma's migration story wins for a rebuild |
| Storage | Cloudflare R2, presigned uploads | Railway MinIO — self-managed ops burden |
| Payments | Stripe (Intents + Connect Express payouts) | PayPal (no manual capture ergonomics, no payout rails) — fallback documented |
| Roles | `user / host / admin` | Old `owner` role merges into host |
| Auth | Custom JWT + rotating refresh on the new API | Finishing the Firebase migration — orphaned by the custom-backend choice |

## What happens after approval

Code phase, in order: (1) new theme tokens replace `src/styles/theme.ts` / `gluestackTheme.ts`; (2) navigation collapses to the new IA, deleting duplicate navigators/auth systems; (3) backend scaffold on Railway per docs 04–06; (4) screens rebuilt against the real API. Each step is its own PR.
