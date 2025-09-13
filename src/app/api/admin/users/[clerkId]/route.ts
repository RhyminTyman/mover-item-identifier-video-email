import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserRole, updateUser, deleteUser } from "@/lib/user";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clerkId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or company-admin
    const userRole = await getUserRole(userId);
    if (userRole !== "admin" && userRole !== "company-admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { clerkId } = await params;

    const updateData = await request.json();
    const updatedUser = await updateUser(clerkId, updateData);
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clerkId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or company-admin
    const userRole = await getUserRole(userId);
    if (userRole !== "admin" && userRole !== "company-admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { clerkId } = await params;
    await deleteUser(clerkId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
