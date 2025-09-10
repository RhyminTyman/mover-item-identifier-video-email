# Redis Setup Guide

This guide will help you set up Redis for your Mover Item Identifier application.

## 🚀 Quick Setup (Recommended: Upstash)

### Step 1: Create Upstash Account
1. Go to [upstash.com](https://upstash.com)
2. Sign up with your GitHub account
3. Click "Create Database"

### Step 2: Configure Database
- **Database Name**: `mover-item-identifier-redis`
- **Region**: Choose closest to your users (e.g., `us-east-1`)
- **Type**: `Global` (for better performance)
- **Plan**: `Free` (10,000 requests/day)

### Step 3: Get Credentials
After creating the database, you'll get:
- `UPSTASH_REDIS_REST_URL`: `https://your-db-name.upstash.io`
- `UPSTASH_REDIS_REST_TOKEN`: `your-token-here`

### Step 4: Update Environment Variables

**Local Development (.env.local):**
```bash
UPSTASH_REDIS_REST_URL="https://your-db-name.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token-here"
```

**Vercel Production:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `UPSTASH_REDIS_REST_URL`: `https://your-db-name.upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN`: `your-token-here`

## 🔧 Alternative: Redis Cloud

### Step 1: Create Redis Cloud Account
1. Go to [redis.com](https://redis.com)
2. Sign up for free account
3. Create a new subscription

### Step 2: Create Database
- **Cloud Provider**: AWS (recommended)
- **Region**: Choose closest to your users
- **Memory**: 30MB (free tier)

### Step 3: Get Connection Details
- **Endpoint**: `redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com:12345`
- **Password**: `your-password`

### Step 4: Update Configuration
If using Redis Cloud, you'll need to update the Redis client configuration in your code.

## 🧪 Test Redis Connection

### Local Testing
```bash
# Test Redis connection
pnpm test:redis

# Or manually test
curl http://localhost:3000/api/health/redis
```

### Production Testing
```bash
# Test your deployed app
curl https://your-app.vercel.app/api/health/redis
```

## 📊 Redis Usage in Your App

Your app uses Redis for:
- **Rate limiting**: API request throttling
- **Caching**: Temporary data storage
- **Session management**: User state persistence
- **Queue management**: Background job processing

## 🔍 Monitoring

### Upstash Dashboard
- View request metrics
- Monitor usage
- Check performance

### Redis Cloud Dashboard
- Monitor memory usage
- View connection stats
- Check performance metrics

## 🛠️ Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check Redis URL format
   - Verify credentials
   - Ensure Redis is running

2. **Authentication Failed**
   - Verify token/password
   - Check token permissions
   - Ensure token is not expired

3. **Rate Limit Exceeded**
   - Check usage in dashboard
   - Upgrade plan if needed
   - Implement better caching

### Debug Commands

```bash
# Check Redis connection
pnpm redis:ping

# View Redis logs
pnpm redis:logs

# Test Redis operations
pnpm redis:test
```

## 📚 Additional Resources

- [Upstash Documentation](https://docs.upstash.com/)
- [Redis Cloud Documentation](https://docs.redis.com/)
- [Redis Commands Reference](https://redis.io/commands/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## 🆘 Support

If you encounter issues:

1. Check the Redis dashboard for service status
2. Verify environment variables are set correctly
3. Test connection locally first
4. Check Vercel function logs for errors
5. Review Redis usage limits
