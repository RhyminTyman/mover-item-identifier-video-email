#!/usr/bin/env node

/**
 * Prisma-based Database Migration: Local PostgreSQL to Neon
 * 
 * This script uses Prisma to migrate your database to Neon.
 * Run with: node scripts/prisma-migrate-to-neon.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Starting Prisma-based migration to Neon...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env.local file not found');
  console.log('Please run: pnpm setup:neon first');
  process.exit(1);
}

// Read current .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
console.log('📋 Current .env.local configuration:');
console.log(envContent);
console.log('');

// Check if DATABASE_URL is set
if (!envContent.includes('DATABASE_URL=') || envContent.includes('DATABASE_URL="postgresql://username:password@ep-xxx')) {
  console.log('⚠️  DATABASE_URL not properly configured in .env.local');
  console.log('Please update your .env.local with your Neon connection string:');
  console.log('DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"');
  console.log('DIRECT_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"');
  console.log('');
  console.log('Then run this script again.');
  process.exit(1);
}

console.log('📋 Migration steps:');
console.log('1. Generate Prisma client');
console.log('2. Push schema to Neon database');
console.log('3. Verify connection');
console.log('');

// Step 1: Generate Prisma client
console.log('🔧 Step 1: Generating Prisma client...');
try {
  execSync('pnpm prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message);
  process.exit(1);
}

// Step 2: Push schema to Neon
console.log('📤 Step 2: Pushing schema to Neon database...');
try {
  execSync('pnpm prisma db push', { stdio: 'inherit' });
  console.log('✅ Schema pushed to Neon database');
} catch (error) {
  console.error('❌ Failed to push schema to Neon:', error.message);
  process.exit(1);
}

// Step 3: Verify connection
console.log('🔍 Step 3: Verifying Neon connection...');
try {
  execSync('pnpm health:neon', { stdio: 'inherit' });
  console.log('✅ Neon connection verified');
} catch (error) {
  console.log('⚠️  Health check failed, but database might still be working');
  console.log('You can test manually by running: pnpm health:neon');
}

console.log('\n🎉 Migration to Neon completed!');
console.log('\n📋 Next steps:');
console.log('1. Test your application: pnpm dev');
console.log('2. Check database in Prisma Studio: pnpm db:studio');
console.log('3. Deploy to Vercel with the new database');
console.log('\n💡 Note: This migration creates a fresh database with your schema.');
console.log('If you need to migrate existing data, use the pg_dump method instead.');
