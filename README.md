# KeyLo

**Peer-to-peer car rental for the Bahamas.** Rent a local's car instead of a rental counter — book across Nassau, Freeport, and Exuma with Instant Book, airport pickup, and delivery. Turo-style marketplace mechanics with a distinctive island identity.

KeyLo is one Expo/React Native app (iOS, Android, web) backed by a TypeScript API. This repo holds all three parts:

| Path | What it is |
|---|---|
| `/` (`src/`, `App.tsx`) | The Expo app — every screen on the **KeyLo component kit** (NativeWind + Fraunces/Inter) |
| `backend/` | The API — **Fastify + Prisma + PostgreSQL**, deployed on Railway |
| `design/` | The design package — brand identity, user flows, API spec, data model, and HTML mockups |

## Highlights

- **Two-sided marketplace.** Guests browse, book, check in/out with photos, message, and review. Hosts list cars (in-app 6-step wizard), manage a fleet, approve requests, and get paid.
- **Turo-parity mechanics.** Instant Book vs request-to-book, protection-plan tiers, host-defined extras, delivery/airport pickup, trip extensions, cancellation + refund policy, and two-sided blind reviews.
- **"Coastal Modern / Junkanoo Night" brand.** Warm limestone base, ink typography, a single Junkanoo-coral accent, and a first-class dark mode — see `design/01-brand-identity.md`.
- **Real backend.** JWT auth (rotating refresh), PayPal payments + payouts, Socket.IO realtime chat, Cloudflare R2 photo storage, BullMQ scheduled jobs, and Expo push notifications. Every subsystem degrades gracefully when its service isn't configured, so local dev runs on just Postgres. Status table: `backend/README.md`.

## Quick start (local, ~10 min)

Full runbook — local, Railway, and PayPal sandbox — is in **[`SETUP.md`](SETUP.md)**. The short version:

```bash
# 1. API + database
cd backend
cp .env.example .env          # set JWT_SECRET + JWT_REFRESH_SECRET
npm install
npm run db:up                 # Postgres + Redis via docker compose
npm run setup                 # migrate + seed (islands, protection plans, demo fleet)
npm run dev                   # http://localhost:3000/health

# 2. The app (second terminal, repo root)
cp .env.example .env          # already points at http://localhost:3000
npm install
npx expo start                # scan the QR with Expo Go
```

The seed creates a demo host `demo@keylo.bs` / `keylodemo123` with four listed cars, so Explore shows real vehicles on first run. On a physical phone, set `EXPO_PUBLIC_API_BASE_URL` to your laptop's LAN IP (see SETUP.md).

## Tech stack

- **App:** Expo SDK 53, React Native 0.79, React 19, TypeScript, React Navigation, NativeWind v4, `@expo-google-fonts` (Fraunces + Inter), Redux Toolkit, socket.io-client, Stripe/PayPal client, expo-image-picker.
- **Backend:** Fastify 5, Prisma 6 (PostgreSQL), Zod, argon2, JWT, Socket.IO (+ Redis adapter), BullMQ, PayPal Orders/Payouts, Cloudflare R2 (S3-compatible), Expo Server SDK. Deploys on Railway via `backend/railway.json`.

## Repository layout

```
src/                 App screens, navigation, services, the KeyLo kit (src/components/ui)
backend/             Fastify API — modules/, prisma/, jobs/, realtime/, lib/
design/              Brand, flows, screen inventory, backend architecture, API spec,
                     data model, and mockups/ (open mockups/index.html)
SETUP.md             End-to-end runbook (local · Railway · PayPal sandbox)
```

## Configuration

The app reads `EXPO_PUBLIC_*` vars from `.env` (see `.env.example`) — chiefly `EXPO_PUBLIC_API_BASE_URL` (and `EXPO_PUBLIC_R2_PUBLIC_URL` for photos). The API reads its config from `backend/.env` (see `backend/.env.example`): database, JWT secrets, and optional PayPal / R2 / Redis / Expo credentials. Firebase is no longer used — auth is the custom API.

## Status

The product loop is complete end to end (auth, booking, the full trip lifecycle, hosting, chat, payments, photos, push). Deliberately out of scope: an admin/verification console, and production credentials (Railway, PayPal, R2, Expo) — all covered in `SETUP.md`. Per-subsystem detail lives in `backend/README.md`.
