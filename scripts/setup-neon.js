#!/usr/bin/env node

/**
 * Neon Database Setup Script
 * 
 * This script helps you set up a Neon database for your Mover Item Identifier app.
 * Run with: node scripts/setup-neon.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Neon database integration...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.local.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local file...');
  
  const envContent = `# Database
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# App Configuration
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Vercel (for deployment)
VERCEL_TOKEN="your_vercel_token"
VERCEL_ORG_ID="your_vercel_org_id"
VERCEL_PROJECT_ID="your_vercel_project_id"

# Optional: For local development with Neon
NEON_DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file');
} else {
  console.log('✅ .env.local file already exists');
}

// Create .env.local.example
if (!fs.existsSync(envExamplePath)) {
  console.log('📝 Creating .env.local.example file...');
  
  const envExampleContent = `# Database
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# App Configuration
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Vercel (for deployment)
VERCEL_TOKEN="your_vercel_token"
VERCEL_ORG_ID="your_vercel_org_id"
VERCEL_PROJECT_ID="your_vercel_project_id"

# Optional: For local development with Neon
NEON_DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
`;

  fs.writeFileSync(envExamplePath, envExampleContent);
  console.log('✅ Created .env.local.example file');
}

console.log('\n📋 Next steps:');
console.log('1. Go to https://neon.tech and create a new project');
console.log('2. Copy your connection string from the Neon dashboard');
console.log('3. Update the DATABASE_URL in your .env.local file');
console.log('4. Run: pnpm prisma migrate deploy');
console.log('5. Run: pnpm prisma generate');
console.log('\n🎉 Neon integration setup complete!');
