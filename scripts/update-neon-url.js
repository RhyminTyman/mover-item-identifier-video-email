#!/usr/bin/env node

/**
 * Update Neon URL in .env.local
 * 
 * This script helps you update your .env.local with the Neon connection string.
 * Run with: node scripts/update-neon-url.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔄 Updating .env.local with Neon connection string...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env.local file not found');
  console.log('Please run: pnpm setup:neon first');
  process.exit(1);
}

// Read current .env.local
let envContent = fs.readFileSync(envPath, 'utf8');

// Ask for Neon connection string
rl.question('Enter your Neon DATABASE_URL (postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require): ', (neonUrl) => {
  if (!neonUrl || !neonUrl.includes('neon.tech')) {
    console.error('❌ Invalid Neon URL format');
    console.log('Expected format: postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require');
    process.exit(1);
  }

  // Update DATABASE_URL
  envContent = envContent.replace(
    /DATABASE_URL="[^"]*"/,
    `DATABASE_URL="${neonUrl}"`
  );

  // Add DIRECT_URL if not present
  if (!envContent.includes('DIRECT_URL=')) {
    envContent += `\nDIRECT_URL="${neonUrl}"\n`;
  } else {
    envContent = envContent.replace(
      /DIRECT_URL="[^"]*"/,
      `DIRECT_URL="${neonUrl}"`
    );
  }

  // Write updated .env.local
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ Updated .env.local with Neon connection string');
  console.log('\n📋 Next steps:');
  console.log('1. Test connection: pnpm health:neon');
  console.log('2. Push schema: pnpm prisma db push');
  console.log('3. Generate client: pnpm prisma generate');
  
  rl.close();
});
