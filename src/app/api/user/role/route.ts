import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserRole } from "@/lib/user";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getUserRole(userId);
    return NextResponse.json({ role });
  } catch (error) {
    console.error("Error fetching user role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
