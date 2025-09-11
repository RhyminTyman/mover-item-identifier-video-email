import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getUserRole } from "@/lib/user";

export async function GET() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getUserRole(user.id);
    return NextResponse.json({ role });
  } catch (error) {
    console.error("Error fetching user role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
