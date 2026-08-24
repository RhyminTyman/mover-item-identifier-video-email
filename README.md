# Mover Item Identifier

Upload photos or video of a home, and OpenAI Vision produces a structured moving
inventory — item names, descriptions, estimated dimensions, counts, and room
assignments — which sales reps verify, price, and send to the customer as a quote.

- **Ingest** — images, or video sampled into frames
- **Analyze** — OpenAI Vision returns schema-validated JSON (Zod-checked)
- **Review** — edit items, dimensions, tags, and rooms; assign to rooms
- **Price** — cubic feet, weight, distance, stairs, packing, storage, tax
- **Deliver** — CSV / XLSX / PDF export, or email the inventory to the customer
- **Workflow** — submitted → assigned → verified → quoted → accepted
- **Roles** — customer, sales, company-admin, admin (multi-tenant by company)

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15.5 (App Router), React 18, TypeScript |
| Database | Postgres via Prisma 6 (Neon in production) |
| Auth | Clerk (`@clerk/nextjs`), enforced in `src/middleware.ts` |
| Vision | OpenAI (`gpt-4o-mini` by default) |
| Storage | AWS S3, presigned upload + presigned read |
| Rate limiting | Upstash Redis, with an in-memory fallback |
| Email | Resend |
| UI | MUI 6 + Emotion |
| Export | `exceljs`, `jspdf`, `pdfkit` |
| Tests | Jest + Testing Library (unit), Playwright (e2e) |

## Prerequisites

- **Node >= 20** — pinned to 22 in `.nvmrc` and `engines`. Playwright requires
  20+, and Node 18 is end-of-life.
- **pnpm** — the version is declared in `packageManager`; `corepack enable` picks
  it up. Do **not** use npm: there is a single `pnpm-lock.yaml`, and `vercel.json`
  installs with pnpm.
- **Postgres** — `docker compose up -d` runs one locally on port 5432.

## Setup

```bash
corepack enable
pnpm install
cp .env.example .env.local
```

Fill in `.env.local` (see [Environment](#environment)), then create the schema:

```bash
docker compose up -d        # optional local Postgres
pnpm db:push               # NOT `migrate dev` - see note below
pnpm dev
```

Open http://localhost:3000.

> **Schema note.** `prisma/migrations/` is gitignored, so the repo has no
> migration history. Use `pnpm db:push` to sync the schema from
> `prisma/schema.prisma`. `prisma migrate dev` will try to create an initial
> migration against a database that already has tables.

To seed reference data:

```bash
node prisma/seed-states.js
node scripts/seed-moving-companies.js
```

## Environment

`src/lib/env-validation.ts` is the source of truth. It runs at startup via
`src/instrumentation.ts` and logs exactly what is missing, and
`GET /api/health` reports the same.

### Required — the app will not function without these

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Pooled connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API keys |
| `CLERK_SECRET_KEY` | Clerk dashboard → API keys |
| `OPENAI_API_KEY` | Billing must be active or analysis 402s |
| `S3_BUCKET_NAME` | **Not** `AWS_S3_BUCKET` — see gotchas |
| `AWS_REGION` | e.g. `us-east-1` |

### Optional — features degrade rather than break

| Variable | Effect when unset |
|---|---|
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | SDK falls back to instance/task role or OIDC |
| `DIRECT_URL` | Currently unused — the datasource declares no `directUrl` and no code reads it, though CI still passes it as a secret |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Rate limiting falls back to per-instance memory |
| `RESEND_API_KEY` | Email endpoints return 500 |
| `MAIL_FROM` | Falls back to `onboarding@resend.dev` |
| `CLERK_WEBHOOK_SECRET` | The Clerk webhook rejects all deliveries |
| `VIDEO_FRAME_API_URL` / `NEXT_PUBLIC_VIDEO_FRAME_API_URI` | Video ingest unavailable; defaults to `http://localhost:3001` |
| `NEXT_PUBLIC_BASE_URL` | Email links infer from the request host |
| `S3_PUBLIC_URL_PREFIX` | CDN/CloudFront prefix for object URLs |
| `ENCRYPTION_KEY` | CRM credentials cannot be encrypted at rest |
| `NEXT_PUBLIC_SENTRY_DSN` | No error reporting |
| `OPENAI_VISION_MODEL` | Defaults to `gpt-4o-mini` |

Image upload and analysis work with only the required set. **Video ingest needs a
separate frame-extraction service** listening at `VIDEO_FRAME_API_URL` — it is not
part of this repo.

## Everyday commands

```bash
pnpm dev              # dev server on :3000
pnpm build            # production build (runs prisma generate first)
pnpm typecheck        # tsc --noEmit
pnpm lint             # next lint
pnpm test             # jest - 506 unit tests
pnpm test:coverage    # with coverage
pnpm test:e2e         # Playwright (boots its own dev server)
pnpm db:studio        # Prisma Studio
pnpm db:push          # sync schema without migrations
```

The unit suite is hermetic — no database, no network, no secrets.

The e2e suite (`e2e/auth-boundary.spec.ts`) drives a real server, so it needs
Clerk keys and `DATABASE_URL`; it tolerates a degraded config otherwise. It
covers the authorization boundary as an anonymous visitor — protected pages
redirect to sign-in, protected APIs return `401` JSON rather than an HTML
redirect, and cross-origin writes are refused.

Testing *signed-in* flows needs `@clerk/testing` (`clerkSetup` +
`setupClerkTestingToken`) and a seeded user per role; that is not set up yet.
Faking a session in `localStorage` does not work — Clerk validates a signed JWT
in an HttpOnly cookie server-side, so the earlier specs that did this asserted
against pages they never reached.

## Layout

```
src/
  app/
    api/            route handlers (REST)
    (pages)/        App Router pages
    actions/        server actions
  components/       UI, grouped by role (admin/, company-admin/, dashboard/)
  lib/
    authz.ts        ownership + role checks - every resource route goes through this
    db.ts           Prisma singleton
    openai.ts       lazily constructed OpenAI client
    s3.ts           S3 client + key helpers
    env-validation.ts
    rateLimit.ts    Redis sliding window, memory fallback
  middleware.ts     Clerk auth + public-route allowlist
prisma/schema.prisma
scripts/            operational scripts (see below)
tests/unit/         Jest
e2e/                Playwright
```

### Authorization

Every resource route resolves the caller through `src/lib/authz.ts`. Two rules
matter when adding endpoints:

1. **Clerk's `userId` is not `User.id`.** Clerk ids look like `user_2abc…`;
   `Inventory.userId` and `Address.userId` are foreign keys to the internal cuid.
   Comparing them directly always fails silently. Use the helpers.
2. **Missing and forbidden both return 404.** Returning 403 for a record that
   exists but isn't yours lets a caller enumerate ids.

## Deployment

Vercel, via `vercel.json`. Three GitHub Actions workflows:

| Workflow | Trigger | Does |
|---|---|---|
| `test.yml` | push/PR to `main`, `develop` | lint, typecheck, unit tests, e2e |
| `deploy.yml` | push/PR to `main` | tests then Vercel deploy |
| `simple-deploy.yml` | push to `main` | Vercel production deploy |

`simple-deploy.yml` deploys production on **any** push to `main`, so work on a
branch and merge via PR.

CI needs 16 repository secrets. `./scripts/push-github-secrets.sh` pushes the ones
derivable from local env files (dry run by default, `--commit` to apply); the rest
must be set by hand:

```bash
gh secret set VERCEL_TOKEN        # also VERCEL_ORG_ID, VERCEL_PROJECT_ID
gh secret set AWS_ACCESS_KEY_ID   # also AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME
```

## Security

**Credentials in this repo's git history are compromised.** Env files carrying
live OpenAI, Clerk, Resend, Upstash, and Neon values were committed. They have
been untracked, but untracking does not remove them from history. See
[SECRET_ROTATION.md](SECRET_ROTATION.md) for what to rotate and where.

Other operational notes:

- `.gitignore` covers `.env.*` with an allowlist for `.env.example` templates.
  Never commit a new env file variant.
- S3 objects are private. Photos are served through
  `GET /api/photos/[id]`, which authorizes the caller and redirects to a
  short-lived presigned URL.
- Analysis is rate limited per authenticated user, with a cap on images per
  request, because each call costs money.
- Inventories created before ownership was enforced have no `userId` and are
  visible only to admins. `scripts/backfill-inventory-owners.js` reports them;
  it only writes when given an explicit owner.

## Gotchas

Things that cost time before:

- **`S3_BUCKET_NAME`, not `AWS_S3_BUCKET`.** `src/lib/s3.ts` reads the former.
  The workflows and health check previously referenced the latter, which no code
  reads, so a correctly-set bucket still looked missing.
- **pnpm must be installed before `actions/setup-node`** in CI. `cache: 'pnpm'`
  shells out to pnpm to compute the cache key.
- **Don't pass `version:` to `pnpm/action-setup`.** It conflicts with
  `packageManager` and fails with "Multiple versions of pnpm specified".
- **Tests pin `TZ=UTC`** in `jest.globalSetup.js`. Snapshots render
  `toLocaleString()`, so an unpinned timezone makes them pass locally and fail in
  CI. It must be `globalSetup` — by the time a setup file runs, V8 has already
  cached the zone and setting `process.env.TZ` is a silent no-op.
- **`next build` imports every route module**, so anything constructed at module
  scope runs at build time. Clients are lazy for this reason; keep them that way
  or the build starts requiring live credentials.

## Further reading

Setup guides for individual services: [CLERK_SETUP.md](CLERK_SETUP.md),
[NEON_SETUP.md](NEON_SETUP.md), [REDIS_SETUP.md](REDIS_SETUP.md),
[RESEND_SETUP.md](RESEND_SETUP.md), [VIDEO_PROCESSING.md](VIDEO_PROCESSING.md),
[TESTING.md](TESTING.md), [RAG_FEEDBACK_FLOW.md](RAG_FEEDBACK_FLOW.md).

Older status and checklist documents in the repo root (`PRODUCTION_READY.md`,
`HIGH_PRIORITY_COMPLETE.md`, `LAUNCH_CHECKLIST.md`, the `VERCEL_DEPLOYMENT*`
files, `MIGRATION_GUIDE.md`, `ENVIRONMENT_FIX.md`) are historical snapshots and
describe claims that no longer hold. Treat this file as authoritative.
