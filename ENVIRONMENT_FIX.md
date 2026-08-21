# 🔧 Environment Variables Fix Guide

## 🚨 Critical Issues Found

### 1. Missing Clerk Variables in Vercel
Your Vercel project is missing these essential Clerk variables:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

### 2. Wrong Base URL
- Current: `https://your-vercel-app.vercel.app` (placeholder)
- Should be: `https://mover-item-identifier-video-email.vercel.app`

### 3. VERCEL_PROJECT_ID in Wrong Section
- Currently in "Variables" but should be in "Secrets"

## 🔧 Step-by-Step Fix

### Step 1: Add Missing Clerk Variables to Vercel

Run these commands to add the missing Clerk variables:

```bash
# Add Clerk Publishable Key
npx vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# When prompted, enter: <your NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY from the Clerk dashboard>

# Add Clerk Secret Key
npx vercel env add CLERK_SECRET_KEY
# When prompted, enter: <your CLERK_SECRET_KEY from the Clerk dashboard>
```

### Step 2: Update Base URL in Vercel

```bash
# Update the base URL
npx vercel env rm NEXT_PUBLIC_BASE_URL
npx vercel env add NEXT_PUBLIC_BASE_URL
# When prompted, enter: https://mover-item-identifier-video-email.vercel.app
```

### Step 3: Fix GitHub Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Move `VERCEL_PROJECT_ID` from "Variables" to "Secrets"
4. Add the value: `prj_xXaEOPaTBEyPS06sRPg4dsi8pBDs`

### Step 4: Verify All Variables

After adding the variables, verify they're set:

```bash
npx vercel env ls
```

You should see:
- ✅ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- ✅ CLERK_SECRET_KEY
- ✅ NEXT_PUBLIC_BASE_URL (with correct URL)
- ✅ DATABASE_URL
- ✅ DIRECT_URL
- ✅ OPENAI_API_KEY
- ✅ UPSTASH_REDIS_REST_URL
- ✅ UPSTASH_REDIS_REST_TOKEN

## 🎯 Why This Fixes the Issues

1. **Clerk Authentication**: Without these variables, Clerk can't authenticate users
2. **Base URL**: Wrong URL causes API calls to fail
3. **GitHub Actions**: VERCEL_PROJECT_ID needs to be a secret for deployment

## 🚀 After Fixing

1. Push a new commit to trigger GitHub Actions
2. Check the deployment logs
3. Test the admin panel buttons
4. Verify user authentication works

## 📝 Quick Commands

```bash
# Add all missing variables at once
npx vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
npx vercel env add CLERK_SECRET_KEY
npx vercel env rm NEXT_PUBLIC_BASE_URL
npx vercel env add NEXT_PUBLIC_BASE_URL

# Verify everything is set
npx vercel env ls
```
