#!/usr/bin/env node

/**
 * Redis Setup Script
 * 
 * This script helps you set up Redis for your Mover Item Identifier app.
 * Run with: node scripts/setup-redis.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Setting up Redis for your application...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env.local file not found');
  console.log('Please run: pnpm setup:neon first');
  process.exit(1);
}

// Read current .env.local
let envContent = fs.readFileSync(envPath, 'utf8');

console.log('📋 Redis Setup Options:');
console.log('1. Upstash Redis (Recommended for Vercel)');
console.log('2. Redis Cloud');
console.log('3. Local Redis (Development only)');
console.log('4. Skip Redis setup\n');

rl.question('Choose an option (1-4): ', (option) => {
  switch (option) {
    case '1':
      setupUpstash();
      break;
    case '2':
      setupRedisCloud();
      break;
    case '3':
      setupLocalRedis();
      break;
    case '4':
      console.log('⏭️  Skipping Redis setup');
      rl.close();
      break;
    default:
      console.log('❌ Invalid option');
      rl.close();
  }
});

function setupUpstash() {
  console.log('\n🔧 Setting up Upstash Redis...');
  console.log('1. Go to https://upstash.com');
  console.log('2. Sign up with your GitHub account');
  console.log('3. Create a new database');
  console.log('4. Copy your credentials\n');
  
  rl.question('Enter your UPSTASH_REDIS_REST_URL: ', (url) => {
    if (!url || !url.includes('upstash.io')) {
      console.error('❌ Invalid Upstash URL format');
      console.log('Expected format: https://your-db-name.upstash.io');
      rl.close();
      return;
    }
    
    rl.question('Enter your UPSTASH_REDIS_REST_TOKEN: ', (token) => {
      if (!token) {
        console.error('❌ Token is required');
        rl.close();
        return;
      }
      
      updateEnvFile(url, token);
      rl.close();
    });
  });
}

function setupRedisCloud() {
  console.log('\n🔧 Setting up Redis Cloud...');
  console.log('1. Go to https://redis.com');
  console.log('2. Sign up for free account');
  console.log('3. Create a new subscription');
  console.log('4. Create a database');
  console.log('5. Get connection details\n');
  
  console.log('⚠️  Note: Redis Cloud requires additional configuration in your code');
  console.log('This script will set up environment variables only.\n');
  
  rl.question('Enter your Redis endpoint (e.g., redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com:12345): ', (endpoint) => {
    if (!endpoint) {
      console.error('❌ Endpoint is required');
      rl.close();
      return;
    }
    
    rl.question('Enter your Redis password: ', (password) => {
      if (!password) {
        console.error('❌ Password is required');
        rl.close();
        return;
      }
      
      // For Redis Cloud, we'll use a different format
      const url = `redis://:${password}@${endpoint}`;
      updateEnvFile(url, '');
      rl.close();
    });
  });
}

function setupLocalRedis() {
  console.log('\n🔧 Setting up Local Redis...');
  console.log('1. Install Redis locally: brew install redis (macOS) or apt-get install redis-server (Ubuntu)');
  console.log('2. Start Redis: redis-server');
  console.log('3. Redis will be available at redis://localhost:6379\n');
  
  const url = 'redis://localhost:6379';
  updateEnvFile(url, '');
  rl.close();
}

function updateEnvFile(url, token) {
  // Update UPSTASH_REDIS_REST_URL
  if (envContent.includes('UPSTASH_REDIS_REST_URL=')) {
    envContent = envContent.replace(
      /UPSTASH_REDIS_REST_URL=.*/,
      `UPSTASH_REDIS_REST_URL="${url}"`
    );
  } else {
    envContent += `\nUPSTASH_REDIS_REST_URL="${url}"`;
  }
  
  // Update UPSTASH_REDIS_REST_TOKEN
  if (envContent.includes('UPSTASH_REDIS_REST_TOKEN=')) {
    envContent = envContent.replace(
      /UPSTASH_REDIS_REST_TOKEN=.*/,
      `UPSTASH_REDIS_REST_TOKEN="${token}"`
    );
  } else {
    envContent += `\nUPSTASH_REDIS_REST_TOKEN="${token}"`;
  }
  
  // Write updated .env.local
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ Updated .env.local with Redis configuration');
  console.log('\n📋 Next steps:');
  console.log('1. Test connection: pnpm health:redis');
  console.log('2. Start dev server: pnpm dev');
  console.log('3. Test Redis operations: pnpm test:redis');
  console.log('\n🎉 Redis setup complete!');
}
