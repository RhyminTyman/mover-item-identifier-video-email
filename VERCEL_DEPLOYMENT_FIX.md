# 🚀 Vercel Deployment Fix Guide

## ❌ Current Issue
The GitHub Action is failing with: `Error: The specified token is not valid. Use 'vercel login' to generate a new token.`

## 🔧 Solution Options

### Option 1: Fix Vercel Secrets (Recommended)

1. **Get Vercel Token:**
   ```bash
   # Install Vercel CLI locally
   npm install -g vercel
   
   # Login to Vercel
   vercel login
   
   # Get your token
   vercel whoami
   ```

2. **Get Vercel Project Info:**
   ```bash
   # Link to your project
   vercel link
   
   # This will show you:
   # - VERCEL_ORG_ID
   # - VERCEL_PROJECT_ID
   ```

3. **Add Secrets to GitHub:**
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Add these secrets:
     - `VERCEL_TOKEN`: Your Vercel token
     - `VERCEL_ORG_ID`: Your organization ID
     - `VERCEL_PROJECT_ID`: Your project ID

### Option 2: Use Vercel GitHub Integration (Easiest)

1. **Connect Repository to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically deploy on every push

2. **Set Environment Variables in Vercel:**
   - Go to your project dashboard
   - Settings → Environment Variables
   - Add all your secrets there

3. **Remove GitHub Action:**
   - Delete the `.github/workflows/deploy.yml` file
   - Vercel will handle deployments automatically

### Option 3: Simplified GitHub Action

If you want to keep the GitHub Action, use this simplified version:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 🎯 Recommended Steps

1. **Try Option 2 first** (Vercel GitHub integration) - it's the easiest
2. If you need the GitHub Action, use Option 1 to fix the secrets
3. The updated workflow I created should work better than the CLI approach

## 🔍 Debugging

If you still have issues:
1. Check that all secrets are set correctly in GitHub
2. Verify the Vercel token has the right permissions
3. Make sure the project ID and org ID are correct
4. Check Vercel dashboard for any error messages

## 📝 Environment Variables Needed

Make sure these are set in Vercel dashboard:
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_BASE_URL`
- `OPENAI_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
