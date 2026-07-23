# Running KeyLo end-to-end

Two paths. **Local** (Path A) gets you a running app + API in ~10 minutes with no cloud accounts. **Railway** (Path B) puts the API online so the mobile app works off your laptop. PayPal sandbox (Path C) is optional — booking works without it; only the *payment* step needs it.

The app is one Expo codebase (`/`) talking to a Fastify API (`/backend`). Data model, endpoints, and architecture live in `design/04-backend-architecture.md`, `05-api-spec.md`, `06-data-model.md`.

---

## Path A — Run locally (fastest)

**Prereqs:** Node 20+, Docker Desktop (for Postgres + Redis), the Expo Go app on your phone (or an emulator).

### 1. Start the API

```bash
cd backend
cp .env.example .env
# .env works as-is for local dev — DATABASE_URL already points at the docker Postgres.
# Set JWT_SECRET and JWT_REFRESH_SECRET to any 16+ char strings.

npm install
npm run db:up        # starts Postgres + Redis (docker compose)
npm run setup        # prisma generate + migrate deploy + seed (islands + protection plans)
npm run dev          # API on http://localhost:3000
```

Check it: `curl http://localhost:3000/health` → `{"ok":true,"service":"keylo-api"}`.

### 2. Start the app

In a second terminal, from the repo root:

```bash
cp .env.example .env   # already points EXPO_PUBLIC_API_BASE_URL at http://localhost:3000
npm install
npx expo start
```

Scan the QR with Expo Go. **On a physical phone, `localhost` is the phone, not your laptop** — set `EXPO_PUBLIC_API_BASE_URL` to your laptop's LAN IP (e.g. `http://192.168.1.20:3000`) and restart Expo. An emulator on the same machine can keep `localhost`.

### 3. See data

The seed creates the three islands and protection tiers but **no vehicles** — search will be empty by design. To see cars, either create a host + listing through the API (`POST /v1/hosts` then `POST /v1/vehicles`, then flip its `verificationStatus` to `verified` and set `listedAt` in the DB), or ask me to add a demo-fleet seed. Explore's empty state ("Nothing on this island yet.") is the correct render until then.

---

## Path B — Deploy the API to Railway

**Prereqs:** a [Railway](https://railway.app) account (the free trial is enough to start).

1. **New project** → *Deploy from GitHub repo* → pick `island-rides-app`.
2. Railway will detect the repo. In the service **Settings → Root Directory**, set it to `backend` (the API is a subdirectory). Build/start commands come from `backend/railway.json` automatically (Nixpacks build, `prisma migrate deploy` on start, `/health` healthcheck).
3. **Add Postgres:** in the project, *New → Database → Add PostgreSQL*. Railway injects `DATABASE_URL` into the service.
4. **Add Redis:** *New → Database → Add Redis*. Injects `REDIS_URL`.
5. **Set service variables** (Settings → Variables) — from `backend/.env.example`:
   - `JWT_SECRET`, `JWT_REFRESH_SECRET` — long random strings (`openssl rand -base64 32`).
   - `APP_ORIGIN` — your app's web origin, or `*` while testing.
   - PayPal vars from Path C (optional at first).
   - `DATABASE_URL` / `REDIS_URL` — **don't set these**; the plugins provide them.
6. **Deploy.** On first boot `prisma migrate deploy` runs the committed migration (`backend/prisma/migrations/0_init`) and creates every table. Seed once from the Railway shell: `npm run prisma:seed`.
7. **Generate a domain:** Settings → Networking → *Generate Domain*. You'll get `https://<something>.up.railway.app`.
8. **Point the app at it:** in the app's `.env`, set
   `EXPO_PUBLIC_API_BASE_URL=https://<something>.up.railway.app` and
   `EXPO_PUBLIC_WS_URL=wss://<something>.up.railway.app`, then restart Expo.

Health check: open `https://<something>.up.railway.app/health` in a browser.

---

## Path C — PayPal sandbox (for the payment step)

Booking creates a PayPal order and opens the approval sheet. Without credentials the API returns a clear "PayPal is not configured" error at that step; everything up to it works. To enable it:

1. Go to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/) and log in.
2. **Apps & Credentials → Sandbox → Create App.** Name it "KeyLo". You'll get a **Client ID** and **Secret**.
3. Set on the API (local `.env` or Railway variables):
   - `PAYPAL_CLIENT_ID` = the sandbox client id
   - `PAYPAL_CLIENT_SECRET` = the sandbox secret
   - `PAYPAL_ENV` = `sandbox`
4. **Webhook** (so capture/refund events update payment state): in the app's settings, *Add Webhook* pointing at `https://<your-api-domain>/v1/payments/webhook`, subscribe to `PAYMENT.AUTHORIZATION.CREATED`, `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.REFUNDED`, `PAYMENT.CAPTURE.DENIED`. Copy the **Webhook ID** into `PAYPAL_WEBHOOK_ID`. (Webhooks need a public URL — do this once you're on Railway, not localhost.)
5. **Test buyer:** Sandbox → Accounts gives you a fake buyer email/password to approve payments with. Real money is never involved in sandbox.

---

## What only *you* can do vs. what's ready

Ready in the repo: the deployable API (`railway.json`, committed migration, seed), local infra (`docker-compose.yml`), and the app wired to read `EXPO_PUBLIC_API_BASE_URL`.

Only you can: create the Railway and PayPal accounts and paste their credentials — those are tied to your login and billing. Everything above is the exact sequence.

## Not yet wired (deferred, tracked in `backend/README.md`)

Photo upload/delivery (Cloudflare R2), realtime chat (Socket.IO), the scheduled jobs (request expiry, payout scheduling, auto-complete, review reveal), and check-out/refund math. The app renders branded placeholders where these land, so it runs and demos without them.
