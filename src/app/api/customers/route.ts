import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserRole } from "@/lib/user";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is sales or admin
    const userRole = await getUserRole(userId);
    if (userRole !== "sales" && userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all customers
    const customers = await prisma.user.findMany({
      where: {
        role: "customer"
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: {
        firstName: "asc"
      }
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
