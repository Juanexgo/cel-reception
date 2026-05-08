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
## License

Proprietary. All rights reserved.
