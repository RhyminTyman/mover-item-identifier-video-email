# Neon Database Setup Guide

This guide will help you set up Neon PostgreSQL database for your Mover Item Identifier application.

## 🚀 Quick Start

### 1. Create Neon Account and Database

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Choose a region close to your users
4. Copy your connection string from the dashboard

### 2. Environment Variables

Create a `.env.local` file in your project root:

```bash
# Database URLs
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# App Configuration
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### 3. Run Setup Script

```bash
node scripts/setup-neon.js
```

### 4. Database Migration

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate deploy

# Or for development
pnpm prisma migrate dev
```

## 🔧 Configuration Details

### Prisma Schema

The Prisma schema has been optimized for Neon:

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Connection string for Prisma | Yes |
| `DIRECT_URL` | Direct connection for migrations | Yes |
| `NEXT_PUBLIC_BASE_URL` | Your app's public URL | Yes |

## 🏗️ Architecture

### Connection Types

1. **HTTP Client** (`neonHttp`): For Vercel Edge Functions
2. **Connection Pool** (`pool`): For Node.js environments
3. **Prisma Client**: For ORM operations

### File Structure

```
src/
├── lib/
│   ├── neon.ts          # Neon connection utilities
│   └── db.ts            # Prisma client
├── app/
│   └── api/
│       └── health/
│           └── neon/    # Health check endpoint
scripts/
└── setup-neon.js        # Setup automation
```

## 🚀 Deployment

### Vercel Environment Variables

Add these to your Vercel project:

```bash
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

### GitHub Secrets

Add to your GitHub repository secrets:

```bash
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## 🔍 Health Checks

### Test Database Connection

```bash
# Local development
curl http://localhost:3000/api/health/neon

# Production
curl https://your-app.vercel.app/api/health/neon
```

### Expected Response

```json
{
  "status": "healthy",
  "database": "neon",
  "connection": "active",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": [{"test": 1}]
}
```

## 🛠️ Development

### Local Development

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Check database connection:
   ```bash
   curl http://localhost:3000/api/health/neon
   ```

3. View database in Prisma Studio:
   ```bash
   pnpm prisma studio
   ```

### Database Management

```bash
# Reset database
pnpm prisma migrate reset

# Create new migration
pnpm prisma migrate dev --name your_migration_name

# Deploy migrations
pnpm prisma migrate deploy

# Generate Prisma client
pnpm prisma generate
```

## 🔒 Security Best Practices

1. **Connection Strings**: Never commit connection strings to version control
2. **Environment Variables**: Use `.env.local` for local development
3. **Secrets Management**: Use Vercel's environment variables for production
4. **SSL**: Always use `sslmode=require` in production

## 🐛 Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check your Neon project status
   - Verify connection string format
   - Ensure SSL is enabled

2. **Migration Failures**
   - Check `DIRECT_URL` is set correctly
   - Verify database permissions
   - Run `pnpm prisma migrate reset` if needed

3. **Prisma Client Issues**
   - Run `pnpm prisma generate`
   - Check Prisma schema syntax
   - Verify environment variables

### Debug Commands

```bash
# Check Prisma connection
pnpm prisma db pull

# Test database connection
pnpm prisma db execute --stdin < <(echo "SELECT 1;")

# View connection details
pnpm prisma db execute --stdin < <(echo "SELECT current_database(), current_user, version();")
```

## 📊 Monitoring

### Neon Dashboard

- Monitor connection usage
- View query performance
- Check database metrics
- Set up alerts

### Application Monitoring

- Use the health check endpoint
- Monitor connection pool status
- Track query performance
- Set up error alerts

## 🚀 Performance Optimization

### Connection Pooling

The Neon client is configured with:
- Max 20 connections
- 30-second idle timeout
- 2-second connection timeout

### Query Optimization

1. Use Prisma's `select` to limit fields
2. Implement proper indexing
3. Use connection pooling
4. Monitor slow queries

## 📚 Resources

- [Neon Documentation](https://neon.tech/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

## 🆘 Support

If you encounter issues:

1. Check the Neon dashboard for service status
2. Review the health check endpoint response
3. Check Vercel function logs
4. Verify environment variables are set correctly
5. Test database connection locally first
