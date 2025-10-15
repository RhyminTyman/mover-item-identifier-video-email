/**
 * Admin Notification System
 * Sends notifications to admins for important events
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export interface NotificationData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  userId?: string;
  metadata?: Record<string, any>;
}

export interface AdminNotification extends NotificationData {
  id: string;
  createdAt: Date;
  read: boolean;
  adminId: string;
}

/**
 * Send notification to all admins
 */
export async function notifyAdmins(data: NotificationData): Promise<void> {
  try {
    // Get all admin users
    const admins = await prisma.user.findMany({
      where: { 
        role: 'admin',
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    if (admins.length === 0) {
      logger.warn('No active admins found to notify', { notification: data.title });
      return;
    }

    // TODO: Store notifications in database
    // For now, log them
    logger.info('Admin notification sent', {
      component: 'notifications',
      title: data.title,
      type: data.type,
      adminCount: admins.length,
      metadata: data.metadata
    });

    // TODO: Send email notifications to admins
    // await sendEmailNotifications(admins, data);

    // TODO: Send in-app notifications
    // await createInAppNotifications(admins, data);

  } catch (error) {
    logger.error('Failed to send admin notifications', error as Error, {
      component: 'notifications',
      notification: data.title
    });
  }
}

/**
 * Notify admins about new user registration
 */
export async function notifyNewUserRegistration(userId: string, userEmail: string, userName: string): Promise<void> {
  await notifyAdmins({
    title: 'New User Registration',
    message: `${userName} (${userEmail}) has registered`,
    type: 'info',
    userId,
    metadata: {
      event: 'user_registration',
      userEmail,
      userName
    }
  });
}

/**
 * Notify admins about new company registration
 */
export async function notifyNewCompanyRegistration(companyId: string, companyName: string, adminEmail: string): Promise<void> {
  await notifyAdmins({
    title: 'New Company Registration',
    message: `${companyName} has registered (Admin: ${adminEmail})`,
    type: 'success',
    metadata: {
      event: 'company_registration',
      companyId,
      companyName,
      adminEmail
    }
  });
}

/**
 * Notify admins about errors
 */
export async function notifyAdminError(errorTitle: string, errorMessage: string, errorDetails?: any): Promise<void> {
  await notifyAdmins({
    title: errorTitle,
    message: errorMessage,
    type: 'error',
    metadata: {
      event: 'system_error',
      details: errorDetails
    }
  });
}

/**
 * Notify admins about high-value quote requests
 */
export async function notifyHighValueQuote(quoteId: string, totalCost: number, customerName: string): Promise<void> {
  if (totalCost >= 5000) { // Configurable threshold
    await notifyAdmins({
      title: 'High-Value Quote Request',
      message: `${customerName} requested a quote for $${totalCost.toFixed(2)}`,
      type: 'success',
      metadata: {
        event: 'high_value_quote',
        quoteId,
        totalCost,
        customerName
      }
    });
  }
}

/**
 * Notify admins about suspicious activity
 */
export async function notifySuspiciousActivity(activityType: string, details: string, userId?: string): Promise<void> {
  await notifyAdmins({
    title: 'Suspicious Activity Detected',
    message: `${activityType}: ${details}`,
    type: 'warning',
    userId,
    metadata: {
      event: 'suspicious_activity',
      activityType,
      details
    }
  });
}

/**
 * Notify admins about system health issues
 */
export async function notifySystemHealthIssue(service: string, issue: string): Promise<void> {
  await notifyAdmins({
    title: 'System Health Issue',
    message: `${service}: ${issue}`,
    type: 'error',
    metadata: {
      event: 'health_issue',
      service,
      issue
    }
  });
}

/**
 * Notify admins about failed payments (if payment system is implemented)
 */
export async function notifyPaymentFailure(userId: string, amount: number, reason: string): Promise<void> {
  await notifyAdmins({
    title: 'Payment Failure',
    message: `Payment of $${amount.toFixed(2)} failed: ${reason}`,
    type: 'warning',
    userId,
    metadata: {
      event: 'payment_failure',
      amount,
      reason
    }
  });
}

/**
 * Notify admins about data export requests (for compliance)
 */
export async function notifyDataExportRequest(userId: string, userEmail: string): Promise<void> {
  await notifyAdmins({
    title: 'Data Export Request',
    message: `${userEmail} requested a data export (GDPR compliance)`,
    type: 'info',
    userId,
    metadata: {
      event: 'data_export_request',
      userEmail
    }
  });
}

/**
 * Notify admins about account deletion requests
 */
export async function notifyAccountDeletionRequest(userId: string, userEmail: string, reason?: string): Promise<void> {
  await notifyAdmins({
    title: 'Account Deletion Request',
    message: `${userEmail} requested account deletion${reason ? `: ${reason}` : ''}`,
    type: 'warning',
    userId,
    metadata: {
      event: 'account_deletion_request',
      userEmail,
      reason
    }
  });
}

