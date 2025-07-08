# 🛠️ Island Rides – Project Health Check & Dependency Audit Guide

This document describes the recommended commands for quickly validating the health of both **frontend** (`IslandRidesApp`) and **backend** (`backend`) code-bases.  
Run these commands whenever you pull fresh changes, before opening a pull-request, or during CI to catch issues early.

---

## 📱 Frontend (React Native + Expo)

| Purpose | Command |
|---------|---------|
| Install / refresh dependencies | `npm install` |
| **List** installed packages & detect unmet / invalid peer dependencies | `npm ls --depth=0` |
| **TypeScript** compilation & type-safety check | `npm run typecheck` |
| **Security** vulnerability scan (moderate & above) | `npm audit --audit-level moderate` |
| **Clean** cache & reinstall (useful if install/typecheck fails) | `npm run clean && npm install` |

> Run the commands from the `IslandRidesApp` directory:
>
> ```bash
> cd IslandRidesApp
> # …then run any of the commands above
> ```

### Example
```bash
cd IslandRidesApp
npm install
npm ls --depth=0
npm run typecheck
npm audit --audit-level moderate
```

---

## 🚀 Backend (Node.js + Express)

| Purpose | Command |
|---------|---------|
| Install / refresh dependencies | `npm install` |
| **List** installed packages & detect unmet / invalid peer dependencies | `npm ls --depth=0` |
| **Security** vulnerability scan (moderate & above) | `npm audit --audit-level moderate` |
| **Unit tests** (Jest) | `npm test` |
| **Syntax check** main entry (cheap Node parse) | `node -c server.js` |

> Run the commands from the `backend` directory:
>
> ```bash
> cd backend
> # …then run any of the commands above
> ```

### Example
```bash
cd backend
npm install
npm ls --depth=0
npm audit --audit-level moderate
node -c server.js
npm test
```

---

## 🗂️ Combined One-Liner (root-level)

From the repository root you can run **all** checks sequentially:

```bash
# Frontend checks
(cd IslandRidesApp && npm install && npm ls --depth=0 && npm run typecheck && npm audit --audit-level moderate)

# Backend checks
(cd backend && npm install && npm ls --depth=0 && npm audit --audit-level moderate && node -c server.js && npm test)
```

---

## ℹ️ Notes & Best Practices

1. **Keep dependencies up-to-date** – address high / critical vulnerabilities promptly.
2. **Commit lockfiles** – `package-lock.json` keeps installs deterministic.
3. **Fail CI on type or audit errors** – integrate these commands into your pipeline.
4. **Clean caches when in doubt** – Expo & Metro caches can cause phantom issues; use `npm run clean` in the frontend.

Happy coding! 💙🏝️ 