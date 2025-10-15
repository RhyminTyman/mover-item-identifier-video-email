/**
 * Environment Variable Validation
 * Validates required environment variables on application startup
 */

interface EnvConfig {
  required: string[];
  optional: string[];
}

const envConfig: EnvConfig = {
  required: [
    'DATABASE_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'OPENAI_API_KEY',
    'AWS_S3_BUCKET',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
  ],
  optional: [
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'NEXT_PUBLIC_VIDEO_FRAME_API_URI',
    'RESEND_API_KEY',
    'MAIL_FROM',
    'NEXT_PUBLIC_BASE_URL',
    'NEXT_PUBLIC_SENTRY_DSN',
    'ENCRYPTION_KEY',
    'OPENAI_VISION_MODEL',
  ]
};

export function validateEnv(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of envConfig.required) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Check optional but recommended variables
  for (const varName of envConfig.optional) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      warnings.push(`Optional environment variable not set: ${varName}`);
    }
  }

  // Validate DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  // Validate AWS region
  const awsRegion = process.env.AWS_REGION;
  const validRegions = ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-northeast-1'];
  if (awsRegion && !validRegions.includes(awsRegion)) {
    warnings.push(`AWS_REGION '${awsRegion}' may not be valid. Common regions: ${validRegions.join(', ')}`);
  }

  // Validate production settings
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      errors.push('NEXT_PUBLIC_BASE_URL is required in production');
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (baseUrl && !baseUrl.startsWith('https://')) {
      warnings.push('NEXT_PUBLIC_BASE_URL should use https:// in production');
    }

    if (!process.env.ENCRYPTION_KEY) {
      errors.push('ENCRYPTION_KEY is required in production for securing sensitive data');
    }

    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      warnings.push('NEXT_PUBLIC_SENTRY_DSN not set - error tracking disabled');
    }
  }

  // Check Clerk configuration
  const clerkPublic = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (clerkPublic && !clerkPublic.startsWith('pk_')) {
    errors.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must start with pk_');
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (clerkSecret && !clerkSecret.startsWith('sk_')) {
    errors.push('CLERK_SECRET_KEY must start with sk_');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function logEnvStatus(): void {
  const { valid, errors, warnings } = validateEnv();

  console.log('\n🔍 Environment Variable Validation');
  console.log('=====================================');

  if (valid) {
    console.log('✅ All required environment variables are set');
  } else {
    console.error('❌ Environment validation failed:');
    errors.forEach(err => console.error(`  - ${err}`));
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Warnings:');
    warnings.forEach(warn => console.warn(`  - ${warn}`));
  }

  console.log('=====================================\n');

  if (!valid && process.env.NODE_ENV === 'production') {
    throw new Error('Environment validation failed. Please fix the errors above.');
  }
}

// Auto-validate on import in development
if (process.env.NODE_ENV !== 'test') {
  logEnvStatus();
}

