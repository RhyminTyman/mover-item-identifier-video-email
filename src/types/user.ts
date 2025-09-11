export type UserRole = 'customer' | 'sales' | 'admin';

export interface UserProfile {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPermissions {
  canViewInventories: boolean;
  canCreateInventories: boolean;
  canEditInventories: boolean;
  canDeleteInventories: boolean;
  canViewAnalytics: boolean;
  canManageUsers: boolean;
  canAccessAdminPanel: boolean;
}

export const USER_ROLES = {
  CUSTOMER: 'customer' as const,
  SALES: 'sales' as const,
  ADMIN: 'admin' as const,
} as const;

export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  customer: {
    canViewInventories: true,
    canCreateInventories: true,
    canEditInventories: true,
    canDeleteInventories: false,
    canViewAnalytics: false,
    canManageUsers: false,
    canAccessAdminPanel: false,
  },
  sales: {
    canViewInventories: true,
    canCreateInventories: true,
    canEditInventories: true,
    canDeleteInventories: true,
    canViewAnalytics: true,
    canManageUsers: false,
    canAccessAdminPanel: false,
  },
  admin: {
    canViewInventories: true,
    canCreateInventories: true,
    canEditInventories: true,
    canDeleteInventories: true,
    canViewAnalytics: true,
    canManageUsers: true,
    canAccessAdminPanel: true,
  },
};
