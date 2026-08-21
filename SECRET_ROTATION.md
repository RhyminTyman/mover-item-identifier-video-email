# Credential rotation — required

Live credentials were committed to this repository in `.env.backup`,
`.env.local.backup`, `.env.temp` and `.env.vercel`. Those files have been
removed from git tracking and `.gitignore` now covers `.env.*`, **but the values
remain in git history**. History was deliberately not rewritten, so rotation is
what actually neutralizes the exposure.

Treat every credential below as compromised. Rotate in roughly this order —
highest blast radius first.

## Must rotate

| Credential | Where | Notes |
|---|---|---|
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | Project key (`sk-proj-…`). Revoke the old key, don't just add a new one. Check usage history for unexpected spend. |
| `DATABASE_URL` / `DIRECT_URL` | Neon console → project → Roles → Reset password for `neondb_owner` | One real Neon project was exposed (`ep-polished-union-adsah598`), via both its pooled and direct connection strings. The other DSNs in those files were a local `postgresql://joetyman@localhost` (no password, harmless) and an `ep-xxx`/`username` placeholder. |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash console → database → Details → Rotate token | The REST URL was exposed alongside it, so the endpoint is known. |
| `RESEND_API_KEY` | [resend.com/api-keys](https://resend.com/api-keys) | Revoke and reissue. An attacker with this can send mail as your verified domain — check the sending log. |
| `CLERK_SECRET_KEY` | Clerk dashboard → API keys | The exposed key is a **development** instance key (`sk_test_…`), so production sessions are not directly affected. Verified: no `sk_live_` key appears anywhere in the history of these files. Rotate the test key anyway. |

## Restrict rather than rotate

| Credential | Action |
|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Public by design (it ships to the browser), so rotation alone achieves nothing. In Google Cloud console, add an **HTTP referrer restriction** for your domains and an **API restriction** limiting it to the Maps/Places APIs you use. Without those, anyone can bill your project. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public by design. No action. |

## No action needed

| Credential | Why |
|---|---|
| `VERCEL_OIDC_TOKEN` | Short-lived JWT; long expired. |
| `SMTP_USER` / `SMTP_PASS` | Committed values were placeholders (`your_…`), never real. Nodemailer/SMTP has since been removed — mail goes through Resend. |
| `S3_BUCKET_NAME` | Committed value was a placeholder. No AWS access keys were present in any committed file. |

## After rotating

1. Update the new values in Vercel (Project → Settings → Environment Variables)
   and in your local `.env.local`.
2. Redeploy so running instances pick up the new values.
3. Confirm nothing broke: `GET /api/health` now reports a `config` check that
   lists how many required variables are missing or malformed.
4. Verify no `.env` file is tracked any more:

```bash
git ls-files | grep -E '^\.env' 
```

Only `.env.example`, `.env.local.example` and `.env.test` should appear. If you
later decide to purge history after all, `git-filter-repo --path .env.backup
--path .env.local.backup --path .env.temp --path .env.vercel --invert-paths`
followed by a force-push is the tool — but it rewrites every commit SHA, so
coordinate with anyone else holding a clone.

## Preventing a recurrence

Consider enabling GitHub **push protection** (Settings → Code security →
Secret scanning) so a future commit containing a recognised key shape is
blocked at push time rather than discovered in review.
