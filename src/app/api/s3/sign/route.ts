import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, S3_BUCKET_NAME, publicUrlForKey } from "@/lib/s3";
import { randomUUID } from "node:crypto";
import { getAuthedUser } from "@/lib/authz";
import { rateLimit } from "@/lib/rateLimit";
import { rateLimitRules } from "@/lib/rate-limit-config";

export const runtime = "nodejs";

// Only media this app actually analyses. An unvalidated contentType was
// previously echoed straight into the presigned PUT, so a caller could have the
// bucket serve arbitrary types (e.g. text/html) from our origin.
const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

export async function POST(req: Request) {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Presigned URLs are cheap to mint but expensive downstream; meter them.
    const rule = rateLimitRules.upload.image;
    const rl = await rateLimit({
      key: `s3-sign:${user.id}`,
      points: rule.points,
      windowSec: rule.windowSec,
    });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { filename, contentType } = await req.json();
    if (!filename || !contentType) {
      return NextResponse.json({ error: "filename and contentType required" }, { status: 400 });
    }

    const extension = ALLOWED_CONTENT_TYPES[String(contentType).toLowerCase()];
    if (!extension) {
      return NextResponse.json({ error: "Unsupported contentType" }, { status: 415 });
    }

    if (!s3 || !S3_BUCKET_NAME) {
      return NextResponse.json({ error: "S3 not configured" }, { status: 503 });
    }

    // The extension comes from the validated contentType, never from the
    // filename. Deriving it from `filename.split(".").pop()` let a name like
    // "a.jpg/../../evil" push the object outside the uploads/ prefix.
    const key = `uploads/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;

    const put = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      // No ACL: the previous "public-read" made every upload world-readable,
      // and customer room photos are not public data. Serve them through
      // S3_PUBLIC_URL_PREFIX (CloudFront) or a presigned GET instead.
    });

    const uploadUrl = await getSignedUrl(s3, put, { expiresIn: 60 });
    const publicUrl = publicUrlForKey(key);

    return NextResponse.json({ uploadUrl, publicUrl, key, bucket: S3_BUCKET_NAME });
  } catch (e: unknown) {
    const error = e as Error;
    console.error("[S3 SIGN] Error generating signed URL:", error);
    // Do not echo the SDK's message to the caller: it can include bucket
    // names, ARNs and credential-resolution detail.
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }
}
