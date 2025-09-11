import { prisma as db } from "./db";
import { UserRole, ROLE_PERMISSIONS } from "@/types/user";

export async function createUserProfile(clerkId: string, email: string, firstName: string, lastName: string, role: UserRole = "customer") {
  try {
    const user = await db.user.create({
      data: {
        clerkId,
        email,
        firstName,
        lastName,
        role,
      },
    });
    return user;
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw new Error("Failed to create user profile");
  }
}

export async function getUserByClerkId(clerkId: string) {
  try {
    const user = await db.user.findUnique({
      where: { clerkId },
    });
    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export async function getUserRole(clerkId: string): Promise<UserRole> {
  try {
    const user = await db.user.findUnique({
      where: { clerkId },
      select: { role: true },
    });
    return (user?.role as UserRole) || "customer";
  } catch (error) {
    console.error("Error fetching user role:", error);
    return "customer";
  }
}

export async function updateUserRole(clerkId: string, newRole: UserRole) {
  try {
    const user = await db.user.update({
      where: { clerkId },
      data: { role: newRole },
    });
    return user;
  } catch (error) {
    console.error("Error updating user role:", error);
    throw new Error("Failed to update user role");
  }
}

export async function getUserPermissions(clerkId: string) {
  const role = await getUserRole(clerkId);
  return ROLE_PERMISSIONS[role];
}

export async function getAllUsers() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return users;
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
}

export async function deleteUser(clerkId: string) {
  try {
    await db.user.delete({
      where: { clerkId },
    });
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new Error("Failed to delete user");
  }
}
