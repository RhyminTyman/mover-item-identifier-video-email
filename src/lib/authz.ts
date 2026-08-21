/**
 * Centralised authentication + authorization helpers.
 *
 * IMPORTANT: Clerk's `userId` (e.g. "user_2abc...") is NOT the same as our
 * `User.id` (a cuid). Every relation in schema.prisma (Inventory.userId,
 * Address.userId, ...) points at `User.id`. Comparing a Clerk id against those
 * columns silently never matches, which is how several routes ended up either
 * always-403 or entirely unguarded. Always resolve to the internal user first.
 */

import { auth } from "@clerk/nextjs/server";
import { prisma } from "./db";

export type AuthedUser = {
  id: string;
  clerkId: string;
  email: string;
  role: string;
  companyId: string | null;
  isActive: boolean;
};

/** Resolve the signed-in Clerk session to our internal User row, or null. */
export async function getAuthedUser(): Promise<AuthedUser | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      role: true,
      companyId: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) return null;
  return user;
}

export function isAdmin(user: AuthedUser): boolean {
  return user.role === "admin";
}

/** Platform admins and company admins both get elevated read access. */
export function isAnyAdmin(user: AuthedUser): boolean {
  return user.role === "admin" || user.role === "company-admin";
}

/** The subset of Inventory columns needed to make an access decision. */
export type InventoryAccessScope = {
  userId: string | null;
  salesUserId: string | null;
  assignedSalesRepId: string | null;
  companyId: string | null;
};

export const inventoryAccessSelect = {
  userId: true,
  salesUserId: true,
  assignedSalesRepId: true,
  companyId: true,
} as const;

/**
 * Read access: the owning customer, the sales user who created it, the
 * assigned sales rep, a platform admin, or a company admin of the same company.
 */
export function canAccessInventory(user: AuthedUser, inv: InventoryAccessScope): boolean {
  if (isAdmin(user)) return true;
  if (user.role === "company-admin") {
    return user.companyId !== null && user.companyId === inv.companyId;
  }
  return (
    inv.userId === user.id ||
    inv.salesUserId === user.id ||
    inv.assignedSalesRepId === user.id
  );
}

/** Write access currently mirrors read access. */
export function canMutateInventory(user: AuthedUser, inv: InventoryAccessScope): boolean {
  return canAccessInventory(user, inv);
}

/**
 * Prisma `where` fragment restricting a list query to inventories the user may
 * see. Returns `{}` for platform admins (no restriction).
 */
export function inventoryScopeFilter(user: AuthedUser) {
  if (isAdmin(user)) return {};
  if (user.role === "company-admin") {
    // A company admin with no company must not fall through to "companyId: null",
    // which would expose every unassigned inventory in the system.
    return { companyId: user.companyId ?? "__no_company__" };
  }
  return {
    OR: [
      { userId: user.id },
      { salesUserId: user.id },
      { assignedSalesRepId: user.id },
    ],
  };
}
