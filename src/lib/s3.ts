import { S3Client } from "@aws-sdk/client-s3";

export const AWS_REGION = process.env.AWS_REGION || "us-east-1";
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "";
export const S3_PUBLIC_URL_PREFIX = process.env.S3_PUBLIC_URL_PREFIX; // optional

// Only create S3 client if we have the required configuration
export const s3 = S3_BUCKET_NAME && AWS_REGION ? new S3Client({
  region: AWS_REGION,
}) : null;

export function publicUrlForKey(key: string) {
  if (S3_PUBLIC_URL_PREFIX) return `${S3_PUBLIC_URL_PREFIX.replace(/\/$/, "")}/${key}`;
  if (S3_BUCKET_NAME && AWS_REGION) {
    return `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
  }
  return ""; // Return empty string if S3 is not configured
}
