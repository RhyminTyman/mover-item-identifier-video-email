# Mover Item Identifier (Images + Video) — Next.js + OpenAI Vision + Postgres + S3 + MUI + Email

- Upload **images or video** (video frames are sampled client-side).
- Choose/create a **room** per media item.
- Analyze with OpenAI Vision (structured JSON).
- Edit items, tags, and rooms; save to Postgres.
- Export **CSV** and **PDF**.
- **Email** the list (CSV attached, PDF link) via SMTP.
- All keys/secrets via `.env.local`.

## Quickstart

```bash
pnpm install
cp .env.example .env.local
# Fill in OPENAI_API_KEY, DATABASE_URL, S3 settings, SMTP_* and MAIL_FROM
docker compose up -d   # optional local Postgres
npx prisma migrate dev --name init
pnpm db:generate
pnpm dev
```

Open http://localhost:3000

## Notes
- Video processing uses the browser to sample frames (no ffmpeg needed).
- For serverless deployments, use pooled Postgres and proper S3 CORS/IAM.
- `NEXT_PUBLIC_BASE_URL` (optional) can be set for absolute links in email; otherwise it infers from the request host.
# Trigger deployment
# Test deployment with GitHub secrets
