# Vercel Deployment Guide

## Environment Variables Setup

To deploy this application to Vercel, you need to configure the following environment variables in your Vercel dashboard:

### Required Environment Variables

1. **Database Configuration**
   ```
   DATABASE_URL=postgresql://username:password@hostname:port/database
   DIRECT_URL=postgresql://username:password@hostname:port/database
   ```

2. **Clerk Authentication**
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

3. **Application Configuration**
   ```
   NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
   ```

4. **OpenAI Configuration**
   ```
   OPENAI_API_KEY=sk-...
   ```

5. **AWS S3 Configuration**
   ```
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=your-bucket-name
   ```

6. **Email Configuration**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

### Optional Environment Variables

7. **Redis Configuration** (if using Redis)
   ```
   REDIS_URL=redis://localhost:6379
   ```

## How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each environment variable with its value
5. Make sure to set them for all environments (Production, Preview, Development)

## Database Setup

1. Create a PostgreSQL database (recommended: Neon, Supabase, or Vercel Postgres)
2. Get the connection string from your database provider
3. Set the `DATABASE_URL` and `DIRECT_URL` environment variables
4. Run database migrations: `pnpm prisma db push`

## Clerk Setup

1. Create a Clerk account at https://clerk.com
2. Create a new application
3. Get your publishable key and secret key from the API Keys section
4. Set the Clerk environment variables

## Common Issues

### "DATABASE_URL references Secret which does not exist"
- Remove the `env` section from `vercel.json` (already fixed)
- Set environment variables directly in Vercel dashboard instead of using secrets

### "Missing publishableKey"
- Make sure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in Vercel
- The key should start with `pk_test_` or `pk_live_`

### Build fails during static generation
- Ensure all required environment variables are set
- Check that your database is accessible from Vercel
- Verify Clerk keys are correct

## Testing Locally

Create a `.env.local` file with your environment variables to test locally:

```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

## Deployment Steps

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Set all environment variables in Vercel dashboard
4. Deploy!

The application should now deploy successfully without environment variable errors.
