# Deployment Guide

This guide explains how to deploy the Mover Item Identifier application to Vercel using GitHub Actions.

## Prerequisites

1. **GitHub Repository**: Your code should be in a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Database**: Set up a PostgreSQL database (recommended: [Neon](https://neon.tech), [Supabase](https://supabase.com), or [PlanetScale](https://planetscale.com))

## Setup Steps

### 1. Vercel Setup

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `pnpm build`
   - **Install Command**: `pnpm install`
   - **Root Directory**: `./`

### 2. Environment Variables

In your Vercel project settings, add these environment variables:

```
DATABASE_URL=your_postgresql_connection_string
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

### 3. GitHub Secrets

In your GitHub repository, go to Settings > Secrets and variables > Actions, and add:

- `VERCEL_TOKEN`: Get from Vercel Account Settings > Tokens
- `VERCEL_ORG_ID`: Get from Vercel Team Settings > General
- `VERCEL_PROJECT_ID`: Get from your Vercel project settings
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXT_PUBLIC_BASE_URL`: Your Vercel app URL

### 4. Database Setup

1. Create a PostgreSQL database
2. Run the Prisma migration:
   ```bash
   pnpm prisma migrate deploy
   ```
3. Or use the Vercel CLI:
   ```bash
   vercel env pull .env.local
   pnpm prisma migrate deploy
   ```

## GitHub Actions Workflow

The included GitHub Action (`.github/workflows/deploy.yml`) will:

- ✅ Run on every push to `main` branch
- ✅ Run on pull requests
- ✅ Install dependencies with pnpm
- ✅ Run type checking and linting
- ✅ Build the application
- ✅ Deploy to Vercel (preview for PRs, production for main)

## Manual Deployment

You can also deploy manually using the Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Troubleshooting

### Build Failures

If the build fails, check:

1. **TypeScript errors**: Run `pnpm tsc --noEmit` locally
2. **Missing dependencies**: Ensure all packages are in `package.json`
3. **Environment variables**: Verify all required env vars are set

### Database Connection Issues

1. Check your `DATABASE_URL` format
2. Ensure your database allows connections from Vercel's IPs
3. Verify the database is accessible from the internet

### Vercel Deployment Issues

1. Check the Vercel deployment logs
2. Verify all GitHub secrets are correctly set
3. Ensure the Vercel project ID and org ID are correct

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXT_PUBLIC_BASE_URL` | Your app's public URL | Yes |
| `VERCEL_TOKEN` | Vercel API token (GitHub secret) | Yes |
| `VERCEL_ORG_ID` | Vercel organization ID (GitHub secret) | Yes |
| `VERCEL_PROJECT_ID` | Vercel project ID (GitHub secret) | Yes |

## Support

If you encounter issues:

1. Check the GitHub Actions logs
2. Check the Vercel deployment logs
3. Verify all environment variables are set correctly
4. Ensure your database is accessible and properly configured
