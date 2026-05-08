# Centro de Servicio Multimarcas

Repair-shop management system for a multi-brand cellphone service center.
Tracks intake (recepciones), repair status, payments, customer signatures
on delivery, and exposes a public QR-based status page so the customer can
follow the repair without an account.

Built as a Next.js App Router app with Prisma + PostgreSQL.

## Tech stack

- **Next.js 16** App Router, React 19, Server Actions
- **TypeScript** with strict types
- **Prisma 7** + `@prisma/adapter-pg` against PostgreSQL (Prisma Postgres /
  Neon / any Postgres 14+)
- **Zod** for input validation on every Server Action
- **shadcn/ui + Tailwind CSS v4** for UI primitives
- **Recharts** for the dashboard charts
- **bcryptjs** + signed HMAC session cookie for auth

## Features

- Receptions with sequence-backed scalable folios (`REC-1`, `REC-100`,
  `REC-1000000`, no fixed digit cap, atomic generation under concurrency)
- Status workflow with allowed-transition guards
- Atomic delivery with customer signature
- Payments + ticket history
- Public QR tracking page that exposes only safe-to-share fields
- **Append-only audit log** of who created, edited, changed status,
  delivered, or deleted each reception or client
- Admin-only soft-delete for receptions and clients
- Dashboard with KPIs, charts, status overview, recent receptions,
  needs-attention alerts, and a live activity feed
- Mobile-first layout with off-canvas drawer below `md`
- Security headers (HSTS, X-Frame-Options, Permissions-Policy, …) and
  open-redirect protection on the auth callback

## Getting started locally

```bash
# 1) Install
npm install

# 2) Configure env
cp .env.example .env
#   then edit .env with your DATABASE_URL and a strong NEXTAUTH_SECRET
#   (generate one with: openssl rand -hex 32)

# 3) Set up the database (creates tables + seeds demo users + clients)
npm run db:setup

# 4) Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo users (created by the seed):

| Role        | Email                              | Password      |
|-------------|------------------------------------|---------------|
| Admin       | admin@centroservicio.com           | admin123      |
| Technician  | tecnico@centroservicio.com         | tecnico123    |
| Employee    | empleado@centroservicio.com        | empleado123   |

> Change these passwords before going to production.

## Environment variables

See `.env.example` for the full list with comments. Required minimum:

| Variable          | Required | Notes |
|-------------------|----------|-------|
| `DATABASE_URL`    | yes      | Postgres connection string. For Neon use the **pooled** URL. |
| `NEXTAUTH_SECRET` | yes      | ≥ 16 chars. `openssl rand -hex 32`. |
| `NEXTAUTH_URL`    | yes      | Public URL of the deployment (used in printed QR codes). |
| `SHADOW_DATABASE_URL` | no   | Only for `prisma migrate dev` against a shadow DB locally. |
| `SMS_PROVIDER_API_KEY` | no  | Leave blank to keep SMS in mock mode. |
| `TWILIO_*`        | no       | Filled in only if you wire a real provider. |

Never prefix any of these with `NEXT_PUBLIC_*`. They're server-only.

## Prisma commands

| Command | What it does |
|---|---|
| `npm run db:generate` | Regenerate the Prisma Client into `generated/prisma`. |
| `npm run db:push` | Push the schema directly to the DB without a migration file (useful for prototyping). |
| `npm run db:migrate:deploy` | Apply pending migrations from `prisma/migrations/` (safe for production). |
| `npm run db:seed` | Seed the demo users + clients + receptions. |
| `npm run db:setup` | One-shot: generate + push + seed. |

`prisma generate` also runs as a `postinstall` hook so the client is
always rebuilt against the schema after `npm install`.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Import Project** from GitHub.
3. Before the first deploy, add the env vars under
   *Settings → Environment Variables*:
   - `DATABASE_URL` (production Postgres URL — Prisma Postgres / Neon
     pooled / Supabase pooler / etc.)
   - `NEXTAUTH_SECRET` (`openssl rand -hex 32`)
   - `NEXTAUTH_URL` (`https://your-deployment.vercel.app`)
   - SMS vars only if you've configured a provider.
4. Click Deploy. Vercel runs `npm install` → `postinstall` →
   `prisma generate` → `next build`. No extra build settings needed.
5. After the first successful build, run **once** against the production DB:
   ```bash
   DATABASE_URL="<production-url>" npx prisma migrate deploy
   ```
   You can do this from your local machine or from a Vercel CLI shell.
   The seed script is **not** run automatically — invoke it explicitly if
   you want demo data in production.

## Project layout

```
src/
  app/                      App Router pages
    (auth)/login            Public login page
    (dashboard)/            Protected admin routes
    (print)/receptions      Print-only layout for service orders
    track/[token]           Public read-only QR page for customers
  actions/                  "use server" Server Actions, all wrapped by safeAction
  components/
    dashboard/              KPI cards, charts, feed, alerts
    receptions/             Forms, signature capture, print toolbar
    clients/                Delete-with-confirm dialog
    common/                 Sidebar, mobile shell, logout
    ui/                     shadcn primitives
    track/                  Live polling tracker
  lib/
    auth/                   Session helpers + role guards
    security/               ActionResult + safeAction + sanitize
    validations/            Zod schemas, one file per domain
    constants.ts            Status / brand / role labels
    prisma.ts               Singleton Prisma client (with HMR-safe cache invalidation)
  repositories/             Direct DB access; called only by actions/
  services/sms.ts           SMS adapter (mock by default)
prisma/
  schema.prisma
  migrations/               Versioned SQL migrations
  seed.ts
scripts/                    One-off verification scripts (run with `npx tsx`)
```

## Verification scripts

```bash
npx tsx scripts/verify-flows.ts             # 45 e2e checks of reception flows
npx tsx scripts/verify-delete-client.ts     # delete-client flow
npx tsx scripts/verify-prisma-runtime.ts    # confirms prisma.<model> works
npx tsx scripts/verify-folio-migration.ts   # post-migration folio sanity
```

## License

Proprietary. All rights reserved.
