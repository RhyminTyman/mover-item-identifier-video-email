import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, S3_BUCKET_NAME } from "@/lib/s3";
import { prisma } from "@/lib/db";
import { getAuthedUser, canAccessInventory, inventoryAccessSelect } from "@/lib/authz";

export const runtime = "nodejs";

// Long enough for a page of images to load and be cached by the browser, short
// enough that a leaked URL expires quickly.
const URL_TTL_SECONDS = 300;

/**
 * Redirects to a short-lived presigned GET URL for one photo.
 *
 * Uploads are no longer written with `ACL: public-read`, so objects are not
 * world-readable and cannot be embedded by their raw S3 URL. Going through this
 * route means every image fetch is authenticated and authorised against the
 * owning inventory, instead of relying on an unguessable URL.
 */
export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const photo = await prisma.photo.findUnique({
    where: { id },
    select: {
      key: true,
      bucket: true,
      url: true,
      inventory: { select: inventoryAccessSelect },
    },
  });

  // 404 rather than 403 for photos the caller may not see, so this route cannot
  // be used to enumerate valid photo ids.
  if (!photo || !canAccessInventory(user, photo.inventory)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Legacy rows created before keys were recorded still carry an absolute URL.
  if (!photo.key) {
    if (photo.url) return NextResponse.redirect(photo.url);
    return NextResponse.json({ error: "Photo has no stored object key" }, { status: 404 });
  }

  if (!s3 || !S3_BUCKET_NAME) {
    return NextResponse.json({ error: "S3 not configured" }, { status: 503 });
  }

  try {
    const signed = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: photo.bucket || S3_BUCKET_NAME,
        Key: photo.key,
      }),
      { expiresIn: URL_TTL_SECONDS }
    );

    const res = NextResponse.redirect(signed);
    // The redirect target is user-specific and expiring; keep it private and
    // let it go stale well before the signature does.
    res.headers.set("Cache-Control", `private, max-age=${URL_TTL_SECONDS - 60}`);
    return res;
  } catch (error) {
    console.error("[PHOTOS] Failed to presign photo", id, error);
    return NextResponse.json({ error: "Failed to load photo" }, { status: 500 });
  }
}
