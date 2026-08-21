import { NextResponse } from "next/server";
import { getAllUsers } from "@/lib/user";
import { getAuthedUser, isAdmin, isAnyAdmin } from "@/lib/authz";

export async function GET() {
  try {
    const user = await getAuthedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAnyAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Platform admins see everyone; company admins only see their own tenant.
    const users = isAdmin(user) ? await getAllUsers() : await getAllUsers(user.companyId);
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
