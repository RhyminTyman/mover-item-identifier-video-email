import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { createUserProfile, deleteUser } from "@/lib/user";

export async function POST(request: NextRequest) {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      throw new Error("Please add CLERK_WEBHOOK_SECRET to .env.local");
    }

    // Get the headers
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: "Missing required headers" }, { status: 400 });
    }

    const headerPayload = {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    };

    // Get the body
    const payload = await request.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: {
      type: string;
      data: {
        id: string;
        email_addresses: Array<{ email_address: string }>;
        first_name: string;
        last_name: string;
      };
    };

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, headerPayload) as typeof evt;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
    }

    // Handle the webhook
    const eventType = evt.type;

    if (eventType === "user.created") {
      const { id, email_addresses, first_name, last_name } = evt.data;
      
      await createUserProfile(
        id,
        email_addresses[0].email_address,
        first_name || "",
        last_name || "",
        "customer" // Default role
      );
    }

    if (eventType === "user.deleted") {
      const { id } = evt.data;
      await deleteUser(id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
