import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserRole } from "@/lib/user";
import { sendInviteEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const userRole = await getUserRole(userId);
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const { email, firstName, lastName, role, message } = await req.json();

    // Validate required fields
    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json({ 
        error: "Missing required fields: email, firstName, lastName, role" 
      }, { status: 400 });
    }

    // Validate role
    if (!["sales", "admin", "company-admin"].includes(role)) {
      return NextResponse.json({ 
        error: "Invalid role. Must be 'sales', 'admin', or 'company-admin'" 
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/users`)
      .then(res => res.json())
      .then(users => users.find((user: { email: string }) => user.email === email));

    if (existingUser) {
      return NextResponse.json({ 
        error: "User with this email already exists" 
      }, { status: 409 });
    }

    // Send invitation email
    const inviteResult = await sendInviteEmail({
      email,
      firstName,
      lastName,
      role,
      message: message || ""
    });

    if (!inviteResult.success) {
      return NextResponse.json({ 
        error: "Failed to send invitation email" 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Invitation sent successfully" 
    });

  } catch (error) {
    console.error("Error sending invitation:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
