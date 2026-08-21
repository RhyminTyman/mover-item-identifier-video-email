import { prisma as db } from "./db";
import { UserRole, ROLE_PERMISSIONS } from "@/types/user";

// Helper function to check if database is available
const isDatabaseAvailable = () => {
  return process.env.DATABASE_URL && process.env.DATABASE_URL !== "postgresql://placeholder:placeholder@localhost:5432/placeholder";
};

export async function createUserProfile(clerkId: string, email: string, firstName: string, lastName: string, role: UserRole = "customer") {
  try {
    if (!isDatabaseAvailable()) {
      throw new Error("Database not available");
    }
    
    const user = await db.user.create({
      data: {
        clerkId,
        email,
        firstName,
        lastName,
        role,
        isActive: true,
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
    if (!isDatabaseAvailable()) {
      return null;
    }
    
    const user = await db.user.findUnique({
      where: { clerkId },
    });
    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export async function ensureUserExists(clerkId: string, email: string, firstName: string, lastName: string, role: UserRole = "customer") {
  try {
    // First try to get existing user
    let user = await getUserByClerkId(clerkId);
    
    if (!user) {
      // User doesn't exist, create them
      console.log(`Creating user profile for ${email} (${clerkId})`);
      user = await createUserProfile(clerkId, email, firstName, lastName, role);
    }
    
    return user;
  } catch (error) {
    console.error("Error ensuring user exists:", error);
    throw new Error("Failed to ensure user exists");
  }
}

export async function getUserRole(clerkId: string): Promise<UserRole> {
  try {
    if (!isDatabaseAvailable()) {
      console.warn("Database not available, returning default role");
      return "customer";
    }
    
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

export async function getUserOnboardingStatus(clerkId: string): Promise<boolean> {
  try {
    if (!isDatabaseAvailable()) {
      console.warn("Database not available, returning false for onboarding status");
      return false;
    }
    
    const user = await db.user.findUnique({
      where: { clerkId },
      select: { onboarded: true },
    });
    return user?.onboarded || false;
  } catch (error) {
    console.error("Error fetching user onboarding status:", error);
    return false;
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

/**
 * List users. Pass `companyId` to restrict to a single tenant - company admins
 * must never receive the full cross-company user list.
 */
export async function getAllUsers(companyId?: string | null) {
  try {
    const users = await db.user.findMany({
      where: companyId === undefined ? {} : { companyId },
      orderBy: { createdAt: "desc" },
    });
    return users;
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
}

export async function updateUser(clerkId: string, data: { firstName?: string; lastName?: string; role?: UserRole; isActive?: boolean }) {
  try {
    const user = await db.user.update({
      where: { clerkId },
      data,
    });
    return user;
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error("Failed to update user");
  }
}

export async function toggleUserStatus(clerkId: string) {
  try {
    const user = await db.user.findUnique({
      where: { clerkId },
      select: { isActive: true },
    });
    
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = await db.user.update({
      where: { clerkId },
      data: { isActive: !user.isActive },
    });
    
    return updatedUser;
  } catch (error) {
    console.error("Error toggling user status:", error);
    throw new Error("Failed to toggle user status");
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
