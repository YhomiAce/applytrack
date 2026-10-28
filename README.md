# ApplyTrack

A job application tracker for job seekers. Keep every application on a kanban board, log what happened automatically, get nudged when it's time to follow up, and see how your search is going.

Multi-user: each account only ever sees its own applications.

## Features

- **Accounts**: sign up / sign in with email + password. Passwords are hashed with **argon2id**; sessions are database-backed, in `HttpOnly`, `SameSite=Lax` cookies (`Secure` when `AUTH_URL` is `https://`, or in production when the URL is inferred from proxy headers).
- **Kanban board** by stage (Wishlist, Applied, Screening, Interview, Offer, Rejected, Withdrawn) with drag and drop (dnd-kit, works with mouse, touch and keyboard). The order is saved, so a reload shows the same board.
- **Application details**: company, role, job URL, location and work mode (on-site / hybrid / remote), salary range and currency, source (LinkedIn, referral, …), applied date, contact person, **markdown notes** (with preview), and an **activity timeline**. Stage changes, follow-up changes and edits are logged automatically.
- **Reminders**: set a follow-up date; the board's **Due follow-ups** panel lists everything due today or overdue, with a one-click "Done".
- **Stats**: applications per week, funnel conversion by stage, response rate, and average days per stage.
- **CSV import / export**. The export opens in any spreadsheet. The import accepts the same columns (or field names), validates each row and reports the rows it skipped.
- **Search and filter** by text, stage, work mode and source. Responsive layout, dark mode (follows the OS, with a toggle).

## Stack

- Next.js 16 (App Router, Server Components, server actions, Cache Components), TypeScript (strict)
- Tailwind CSS 4 with shadcn/ui-style components, lucide icons, Recharts
- Prisma 7 with the `pg` driver adapter, PostgreSQL, committed migrations
- Better Auth (email + password), argon2 via `@node-rs/argon2`
- zod for every input: forms, CSV rows, query strings, env vars
- Vitest (unit), Playwright (optional smoke test)

### Why Better Auth (and not Auth.js)

Auth.js v5 is still published as a beta (`next-auth@beta`), and its Credentials provider is deliberately limited: no built-in sign-up, no password hashing, and JWT-only sessions unless you write the glue yourself. Better Auth is stable (1.x), has email + password sign-up and sign-in built in, stores revocable sessions in our own Postgres through its Prisma adapter, lets us plug in argon2 for hashing, and calls cleanly from server actions (`auth.api.signInEmail`) with the `nextCookies()` plugin. That's less custom security code for us to get wrong.

## Local development

Requirements: Node.js 20.19+ (22 recommended), npm, and a PostgreSQL database.

```bash
cp .env.example .env          # then edit DATABASE_URL and AUTH_SECRET
npm install                   # also runs `prisma generate`
npx prisma migrate deploy     # create the tables
npm run db:seed               # optional: the demo account is also created on first start
npm run dev                   # http://localhost:5110
```

Sign in with the demo account `demo@applytrack.dev` / `demo-password-123`, or create your own.

Useful scripts:

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 5110 |
| `npm test` | Unit tests (Vitest): stage moves and activity logging, CSV parse/serialize, stats |
| `npm run test:e2e` | Playwright smoke test against a running server (uses the system Google Chrome; `E2E_BASE_URL` defaults to `http://localhost:5110`). It moves a demo card and puts it back. |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint |
| `npm run db:migrate` | Create a new migration after editing `prisma/schema.prisma` |
| `npm run db:seed` | Create the demo account if it doesn't exist |

## Environment variables

| Name | Required | Example | Build or runtime |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | `postgresql://user:pass@db:5432/applytrack` | runtime |
| `AUTH_SECRET` | yes (32+ chars) | output of `openssl rand -base64 32` | runtime |
| `AUTH_URL` | one of these two | `https://applytrack.example.com` | runtime |
| `AUTH_TRUST_HOST` | one of these two | `true` | runtime |
| `DEMO_MODE` | no (default `false`) | `true` | runtime |
| `SEED_DEMO_DATA` | no (default on) | `false` to skip the demo account | runtime |
| `PORT` | no (default `3000`) | `8080` | runtime |

No variable is needed at build time. Pages never touch the database while building; everything that reads the session or the database renders per request.

### `AUTH_URL`, `AUTH_TRUST_HOST` and reverse proxies

- **`AUTH_URL` set** (recommended): Better Auth uses it as the app's public base URL. Origin checks only accept that origin, and cookies get the `Secure` flag when it starts with `https://`. Set it to the public URL users type, not the container's internal address.
- **`AUTH_URL` empty and `AUTH_TRUST_HOST=true`**: the base URL is worked out per request from the `X-Forwarded-Host` and `X-Forwarded-Proto` headers, and with `NODE_ENV=production` cookies are always `Secure` (so serve it over HTTPS). Use this behind a reverse proxy (Traefik, nginx, Caddy…) that **sets and overwrites** those headers, for example when the same app answers on several domains. Don't enable it if clients can reach the app directly, since they could then spoof the host.
- Sign-in, sign-up and sign-out are server actions. Next.js checks that their `Origin` matches the `Host` / `X-Forwarded-Host` header, which works behind a standard proxy with no extra configuration.

## Deploying

ApplyTrack is a standard Next.js server; no Dockerfile is needed.

| | |
| --- | --- |
| Install | `npm ci` (the `postinstall` script runs `prisma generate`) |
| Build | `npm run build` (`next build`, needs **no** env vars and no database) |
| Start | `npm run start:prod` (`prisma migrate deploy && next start -H 0.0.0.0`) |
| Port | `PORT` env var, default `3000`; listens on `0.0.0.0` |
| Health check | `GET /api/health`: `200 {"status":"ok","database":"up"}` or `503` |
| Build-time env | none |
| Runtime env | `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` (or `AUTH_TRUST_HOST=true`), optional `DEMO_MODE` |

On start, pending migrations are applied (idempotent), then the server seeds the demo account if it doesn't exist yet (`SEED_DEMO_DATA=false` to skip). `npm run start` runs `next start` without migrating.

Notes for container images:

- `prisma` is a regular dependency because `start:prod` runs `prisma migrate deploy` at runtime. Don't prune it.
- Prisma 7 queries through the `pg` driver (no query engine binary). `prisma migrate` still uses Prisma's schema-engine binary, which is downloaded for the build platform during `npm ci` (Alpine: the `linux-musl-openssl-3.0.x` build). On Alpine, install `openssl` (`apk add openssl`) so Prisma can detect the OpenSSL version.
- No Google Fonts or other network calls at build time: the UI uses the system font stack.

## Project layout

```
prisma/                 schema, migrations, seed script
src/app/                routes: (auth) sign-in/up, (app) board, details, stats, import-export, api/*
src/components/         UI (board, application, stats, ui primitives)
src/lib/domain/         pure logic: stages and board moves, activity diffing, CSV, stats, zod schemas
src/lib/                data access (scoped per user), auth, env, server actions
src/instrumentation.ts  seeds the demo account on server start
tests/                  Vitest unit tests      e2e/  Playwright smoke test
```

## License

MIT
