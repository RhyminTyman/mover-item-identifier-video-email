# Database Migration Guide: Local PostgreSQL to Neon

This guide will help you migrate your existing PostgreSQL database to Neon.

## 🚀 Quick Migration (Recommended)

### Method 1: Prisma Schema Migration (Fresh Database)

If you want to start fresh with your current schema:

```bash
# 1. Set up Neon database
node scripts/setup-neon.js

# 2. Update .env.local with your Neon connection string
# DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
# DIRECT_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# 3. Run Prisma migration
node scripts/prisma-migrate-to-neon.js
```

### Method 2: Data Migration (Preserve Existing Data)

If you need to migrate existing data:

```bash
# 1. Set up Neon database
node scripts/setup-neon.js

# 2. Update .env.local with your Neon connection string

# 3. Set your local database URL
export LOCAL_DATABASE_URL="postgres://neon:npg@localhost:5432/<database_name>"

# 4. Run data migration
node scripts/migrate-to-neon.js
```

## 📋 Step-by-Step Manual Migration

### 1. Create Neon Database

1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy your connection string
4. Update `.env.local`:

```bash
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### 2. Export from Local Database

```bash
# Export schema only
pg_dump "postgres://neon:npg@localhost:5432/<database_name>" --schema-only --no-owner --no-privileges > schema.sql

# Export data only
pg_dump "postgres://neon:npg@localhost:5432/<database_name>" --data-only --no-owner --no-privileges > data.sql
```

### 3. Import to Neon Database

```bash
# Import schema
psql "postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require" -f schema.sql

# Import data
psql "postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require" -f data.sql
```

### 4. Verify Migration

```bash
# Test connection
pnpm health:neon

# Check tables
psql "postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require" -c "\\dt"

# Check data
psql "postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT COUNT(*) FROM inventories;"
```

## 🔧 Prisma-Specific Migration

### Using Prisma Migrate

```bash
# 1. Generate Prisma client
pnpm prisma generate

# 2. Push schema to Neon
pnpm prisma db push

# 3. Create migration (if needed)
pnpm prisma migrate dev --name init

# 4. Deploy migration
pnpm prisma migrate deploy
```

### Using Prisma Studio

```bash
# Open Prisma Studio to verify data
pnpm db:studio
```

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check your local PostgreSQL is running
   - Verify connection string format
   - Ensure database exists

2. **Permission Denied**
   - Check database user permissions
   - Verify connection string credentials
   - Ensure SSL is properly configured

3. **Schema Conflicts**
   - Drop existing tables in Neon first
   - Use `--clean` flag with pg_dump
   - Check for naming conflicts

4. **Data Type Issues**
   - Check for unsupported data types
   - Verify encoding settings
   - Review migration logs

### Debug Commands

```bash
# Test local connection
psql "postgres://neon:npg@localhost:5432/<database_name>" -c "SELECT version();"

# Test Neon connection
psql "postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT version();"

# Check table structure
psql "postgres://neon:npg@localhost:5432/<database_name>" -c "\\d+ inventories"

# Check data count
psql "postgres://neon:npg@localhost:5432/<database_name>" -c "SELECT COUNT(*) FROM inventories;"
```

## 📊 Data Verification

### Compare Table Counts

```bash
# Local database
psql "postgres://neon:npg@localhost:5432/<database_name>" -c "SELECT COUNT(*) FROM inventories;"

# Neon database
psql "postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT COUNT(*) FROM inventories;"
```

### Compare Schema

```bash
# Export schema from both databases
pg_dump "postgres://neon:npg@localhost:5432/<database_name>" --schema-only > local_schema.sql
pg_dump "postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require" --schema-only > neon_schema.sql

# Compare schemas
diff local_schema.sql neon_schema.sql
```

## 🚀 Production Deployment

### Update Vercel Environment Variables

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add:
   - `DATABASE_URL`: Your Neon connection string
   - `DIRECT_URL`: Your Neon direct connection string

### Update GitHub Secrets

1. Go to GitHub Repository Settings
2. Go to Secrets and variables > Actions
3. Update:
   - `DATABASE_URL`: Your Neon connection string
   - `DIRECT_URL`: Your Neon direct connection string

## 📚 Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Prisma Migration Guide](https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## 🆘 Support

If you encounter issues:

1. Check the migration logs
2. Verify connection strings
3. Test database connectivity
4. Review Prisma schema
5. Check Neon dashboard for service status
