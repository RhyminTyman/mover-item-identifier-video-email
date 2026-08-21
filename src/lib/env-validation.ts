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
    // src/lib/s3.ts reads S3_BUCKET_NAME, not AWS_S3_BUCKET - the old entry
    // named a variable no code reads.
    'S3_BUCKET_NAME',
    'AWS_REGION',
  ],
  optional: [
    // Static credentials are optional: the AWS SDK also resolves them from an
    // instance/task role or OIDC, so their absence is not an error.
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'CLERK_WEBHOOK_SECRET',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'NEXT_PUBLIC_VIDEO_FRAME_API_URI',
    'VIDEO_FRAME_API_URL',
    'RESEND_API_KEY',
    'MAIL_FROM',
    'NEXT_PUBLIC_BASE_URL',
    'NEXT_PUBLIC_SENTRY_DSN',
    'ENCRYPTION_KEY',
    'OPENAI_VISION_MODEL',
    'S3_PUBLIC_URL_PREFIX',
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

  // Validate AWS region by shape rather than against a hardcoded allowlist,
  // which went stale and flagged legitimate regions.
  const awsRegion = process.env.AWS_REGION;
  if (awsRegion && !/^[a-z]{2}(-gov)?-[a-z]+-\d$/.test(awsRegion)) {
    warnings.push(`AWS_REGION '${awsRegion}' does not look like a valid region identifier`);
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

/**
 * Print the validation result. Never throws - callers decide how to react.
 * This module previously ran itself on import and threw in production, which
 * made it unsafe to reference and is why nothing imported it.
 */
export function logEnvStatus(): { valid: boolean; errors: string[]; warnings: string[] } {
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

  return { valid, errors, warnings };
}

