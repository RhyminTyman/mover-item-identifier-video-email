#!/usr/bin/env node

/**
 * Database Migration Script: Local PostgreSQL to Neon
 * 
 * This script helps migrate your existing PostgreSQL database to Neon.
 * Run with: node scripts/migrate-to-neon.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Starting database migration to Neon...\n');

// Configuration
const LOCAL_DB_URL = process.env.LOCAL_DATABASE_URL || 'postgres://neon:npg@localhost:5432/<database_name>';
const NEON_DB_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!NEON_DB_URL) {
  console.error('❌ Error: NEON_DATABASE_URL or DATABASE_URL environment variable is required');
  console.log('Please set your Neon connection string:');
  console.log('export NEON_DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"');
  process.exit(1);
}

console.log('📋 Migration Plan:');
console.log('1. Export schema from local database');
console.log('2. Export data from local database');
console.log('3. Create schema in Neon database');
console.log('4. Import data to Neon database');
console.log('5. Verify migration');
console.log('');

// Step 1: Export schema
console.log('📤 Step 1: Exporting schema from local database...');
try {
  execSync(`pg_dump "${LOCAL_DB_URL}" --schema-only --no-owner --no-privileges > schema.sql`, { stdio: 'inherit' });
  console.log('✅ Schema exported to schema.sql');
} catch (error) {
  console.error('❌ Failed to export schema:', error.message);
  process.exit(1);
}

// Step 2: Export data
console.log('📤 Step 2: Exporting data from local database...');
try {
  execSync(`pg_dump "${LOCAL_DB_URL}" --data-only --no-owner --no-privileges > data.sql`, { stdio: 'inherit' });
  console.log('✅ Data exported to data.sql');
} catch (error) {
  console.error('❌ Failed to export data:', error.message);
  process.exit(1);
}

// Step 3: Create schema in Neon
console.log('📥 Step 3: Creating schema in Neon database...');
try {
  execSync(`psql "${NEON_DB_URL}" -f schema.sql`, { stdio: 'inherit' });
  console.log('✅ Schema created in Neon database');
} catch (error) {
  console.error('❌ Failed to create schema in Neon:', error.message);
  process.exit(1);
}

// Step 4: Import data to Neon
console.log('📥 Step 4: Importing data to Neon database...');
try {
  execSync(`psql "${NEON_DB_URL}" -f data.sql`, { stdio: 'inherit' });
  console.log('✅ Data imported to Neon database');
} catch (error) {
  console.error('❌ Failed to import data to Neon:', error.message);
  process.exit(1);
}

// Step 5: Verify migration
console.log('🔍 Step 5: Verifying migration...');
try {
  const result = execSync(`psql "${NEON_DB_URL}" -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"`, { encoding: 'utf8' });
  console.log('✅ Migration verification:', result.trim());
} catch (error) {
  console.error('❌ Failed to verify migration:', error.message);
  process.exit(1);
}

// Cleanup
console.log('🧹 Cleaning up temporary files...');
try {
  fs.unlinkSync('schema.sql');
  fs.unlinkSync('data.sql');
  console.log('✅ Temporary files cleaned up');
} catch (error) {
  console.log('⚠️  Could not clean up temporary files:', error.message);
}

console.log('\n🎉 Database migration to Neon completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Update your .env.local with the Neon DATABASE_URL');
console.log('2. Test the connection: pnpm health:neon');
console.log('3. Run Prisma generate: pnpm prisma generate');
console.log('4. Test your application locally');
console.log('5. Deploy to Vercel with the new database');
