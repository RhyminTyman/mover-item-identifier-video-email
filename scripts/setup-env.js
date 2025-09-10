#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupEnvironment() {
  console.log('🔧 Environment Variables Setup\n');
  
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';
  
  // Read existing .env.local if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  console.log('Please provide the following information (press Enter to skip):\n');
  
  // AWS S3 Configuration
  console.log('📦 AWS S3 Configuration:');
  const awsAccessKey = await question('AWS Access Key ID: ');
  const awsSecretKey = await question('AWS Secret Access Key: ');
  const s3Bucket = await question('S3 Bucket Name: ');
  const s3Region = await question('S3 Region (default: us-east-1): ') || 'us-east-1';
  
  // SMTP Configuration
  console.log('\n📧 SMTP Configuration:');
  const smtpHost = await question('SMTP Host: ');
  const smtpPort = await question('SMTP Port (default: 587): ') || '587';
  const smtpUser = await question('SMTP Username: ');
  const smtpPass = await question('SMTP Password: ');
  const mailFrom = await question('From Email (e.g., "Your App <noreply@yourdomain.com>"): ');
  
  // Base URL
  console.log('\n🌐 Base URL:');
  const baseUrl = await question('Base URL for production (e.g., https://your-app.vercel.app): ');
  
  // Update .env.local
  let updatedContent = envContent;
  
  // Update AWS S3
  if (awsAccessKey) {
    updatedContent = updatedContent.replace(/AWS_ACCESS_KEY_ID=.*/g, '');
    updatedContent += `\nAWS_ACCESS_KEY_ID=${awsAccessKey}`;
  }
  if (awsSecretKey) {
    updatedContent = updatedContent.replace(/AWS_SECRET_ACCESS_KEY=.*/g, '');
    updatedContent += `\nAWS_SECRET_ACCESS_KEY=${awsSecretKey}`;
  }
  if (s3Bucket) {
    updatedContent = updatedContent.replace(/S3_BUCKET_NAME=.*/g, '');
    updatedContent += `\nS3_BUCKET_NAME=${s3Bucket}`;
  }
  updatedContent = updatedContent.replace(/AWS_REGION=.*/g, '');
  updatedContent += `\nAWS_REGION=${s3Region}`;
  
  // Update SMTP
  if (smtpHost) {
    updatedContent = updatedContent.replace(/SMTP_HOST=.*/g, '');
    updatedContent += `\nSMTP_HOST=${smtpHost}`;
  }
  if (smtpPort) {
    updatedContent = updatedContent.replace(/SMTP_PORT=.*/g, '');
    updatedContent += `\nSMTP_PORT=${smtpPort}`;
  }
  if (smtpUser) {
    updatedContent = updatedContent.replace(/SMTP_USER=.*/g, '');
    updatedContent += `\nSMTP_USER=${smtpUser}`;
  }
  if (smtpPass) {
    updatedContent = updatedContent.replace(/SMTP_PASS=.*/g, '');
    updatedContent += `\nSMTP_PASS=${smtpPass}`;
  }
  if (mailFrom) {
    updatedContent = updatedContent.replace(/MAIL_FROM=.*/g, '');
    updatedContent += `\nMAIL_FROM=${mailFrom}`;
  }
  
  // Update Base URL
  if (baseUrl) {
    updatedContent = updatedContent.replace(/NEXT_PUBLIC_BASE_URL=.*/g, '');
    updatedContent += `\nNEXT_PUBLIC_BASE_URL=${baseUrl}`;
  }
  
  // Clean up duplicate newlines
  updatedContent = updatedContent.replace(/\n\n+/g, '\n\n');
  
  // Write to .env.local
  fs.writeFileSync(envPath, updatedContent);
  
  console.log('\n✅ Environment variables updated in .env.local');
  console.log('\n📋 Next steps:');
  console.log('1. Set the same variables in GitHub Secrets for CI/CD');
  console.log('2. Set the same variables in Vercel Environment Variables');
  console.log('3. Run "pnpm dev" to test locally');
  
  rl.close();
}

setupEnvironment().catch(console.error);
