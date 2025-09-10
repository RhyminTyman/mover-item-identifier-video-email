import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, S3_BUCKET_NAME, publicUrlForKey } from "@/lib/s3";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    console.log("🔍 [S3 SIGN] Starting S3 URL generation...");
    console.log("🔍 [S3 SIGN] S3 client:", s3 ? "Initialized" : "Not initialized");
    console.log("🔍 [S3 SIGN] S3 bucket:", S3_BUCKET_NAME || "Not set");
    console.log("🔍 [S3 SIGN] AWS region:", process.env.AWS_REGION || "Not set");
    
    const { filename, contentType } = await req.json();
    if (!filename || !contentType) {
      return NextResponse.json({ error: "filename and contentType required" }, { status: 400 });
    }
    
    // Check if S3 is configured
    if (!s3 || !S3_BUCKET_NAME) {
      console.log("❌ [S3 SIGN] S3 not configured - returning 503");
      return NextResponse.json({ error: "S3 not configured" }, { status: 503 });
    }
    
    const ext = filename.includes(".") ? filename.split(".").pop() : "bin";
    const key = `uploads/${new Date().toISOString().slice(0,10)}/${randomUUID()}.${ext}`;
    const put = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      ACL: "public-read",
    });
    const uploadUrl = await getSignedUrl(s3, put, { expiresIn: 60 });
    const publicUrl = publicUrlForKey(key);

    console.log("✅ [S3 SIGN] Successfully generated signed URL");
    return NextResponse.json({ uploadUrl, publicUrl, key, bucket: S3_BUCKET_NAME });
  } catch (e: unknown) {
    const error = e as Error;
    console.error("❌ [S3 SIGN] Error generating signed URL:", error);
    console.error("❌ [S3 SIGN] Error name:", error?.name);
    console.error("❌ [S3 SIGN] Error message:", error?.message);
    console.error("❌ [S3 SIGN] Error stack:", error?.stack);
    
    return NextResponse.json({ 
      error: error?.message ?? "S3 sign error",
      details: {
        name: error?.name,
        type: "s3_error"
      }
    }, { status: 500 });
  }
}
