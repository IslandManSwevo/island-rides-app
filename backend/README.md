# KeyLo API

Fastify + TypeScript + Prisma backend for KeyLo, designed for Railway.
Architecture, API surface, and data model: `../design/04-backend-architecture.md`, `05-api-spec.md`, `06-data-model.md`.

## Local dev

```bash
cd backend
npm install
cp .env.example .env         # fill DATABASE_URL + JWT secrets
npx prisma generate
npx prisma migrate dev       # needs a local Postgres
npm run prisma:seed          # islands + protection plans
npm run dev                  # http://localhost:3000/health
```

## Railway

One service (`api`) + Postgres + Redis plugins. `railway.json` builds with
Nixpacks and runs `prisma migrate deploy` on start. Set the variables from
`.env.example` in the service settings; `DATABASE_URL`/`REDIS_URL` come from
the plugins. Point the app's `EXPO_PUBLIC_API_BASE_URL` at the service domain.

## What's implemented vs stubbed

| Area | State |
|---|---|
| Auth (register/login/rotating refresh/lockout) | ✅ working |
| Islands, protection plans (seeded) | ✅ working |
| Vehicle search/detail/create/settings | ✅ working |
| Booking quote (pricing engine), create (Instant Book vs request), approve/decline, check-in with dual-party → active | ✅ working |
| Booking state machine (server-authoritative) | ✅ working |
| PayPal Orders/capture/void/refund/Payouts + webhook verify | ✅ implemented, needs sandbox creds |
| Storefronts (@handle, editor, redirects, visit attribution) | ✅ working |
| Favorites, push tokens, verification submit | ✅ working |
| Conversations (REST) | ✅ working |
| R2 presigned uploads (presign PUT, public-URL reads, vehicle photos endpoint) | ✅ working (needs R2 creds; 501 without them) |
| BullMQ scheduled jobs (request expiry, payout, auto-complete, review reveal) | ✅ working (needs Redis; no-ops without it) |
| Socket.IO realtime chat (JWT auth, room authz, DB persistence, Redis adapter) | ✅ working |
| Trip lifecycle: check-out, cancel + refund policy, extensions, two-sided reviews | ✅ working |
| Listing management (create, PATCH details, extras, documents, submit-to-list) | ✅ working |
| Expo push notifications (booking request/approve/decline, new message) | ✅ working (needs device tokens; no-ops without them) |
