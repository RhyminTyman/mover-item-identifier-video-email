import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export const MAIL_FROM = process.env.MAIL_FROM || "Smart Move Inventory <onboarding@resend.dev>";

interface InviteEmailData {
  email: string;
  firstName: string;
  lastName: string;
  role: 'sales' | 'admin' | 'company-admin';
  message?: string;
}

export async function sendInviteEmail(data: InviteEmailData) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const signUpUrl = `${baseUrl}/sign-up?invite=${encodeURIComponent(data.email)}&role=${data.role}`;

    const { data: emailData, error } = await resend.emails.send({
      from: MAIL_FROM,
      to: [data.email],
      subject: `Invitation to join Smart Move Inventory as ${data.role === 'admin' ? 'Administrator' : data.role === 'company-admin' ? 'Company Administrator' : 'Sales Representative'}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitation to Smart Move Inventory</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
              .role-badge { display: inline-block; background: ${data.role === 'admin' ? '#f44336' : data.role === 'company-admin' ? '#9c27b0' : '#ff9800'}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 You're Invited!</h1>
                <p>Join Smart Move Inventory as a <span class="role-badge">${data.role.toUpperCase()}</span></p>
              </div>
              <div class="content">
                <h2>Hello ${data.firstName}!</h2>
                <p>You've been invited to join Smart Move Inventory, our AI-powered moving inventory management system.</p>
                
                <p><strong>Your Role:</strong> ${data.role === 'admin' ? 'Administrator' : data.role === 'company-admin' ? 'Company Administrator' : 'Sales Representative'}</p>
                
                ${data.message ? `<div style="background: #e3f2fd; padding: 15px; border-left: 4px solid #1976d2; margin: 20px 0;">
                  <strong>Personal Message:</strong><br>
                  ${data.message}
                </div>` : ''}
                
                <p>As a ${data.role === 'admin' ? 'administrator' : data.role === 'company-admin' ? 'company administrator' : 'sales representative'}, you'll be able to:</p>
                <ul>
                  ${data.role === 'admin' ? `
                    <li>Manage all users and their roles</li>
                    <li>Send invitations to new team members</li>
                    <li>View system analytics and reports</li>
                    <li>Access all customer inventories</li>
                  ` : data.role === 'company-admin' ? `
                    <li>Manage company users and their roles</li>
                    <li>Send invitations to new team members</li>
                    <li>View company analytics and reports</li>
                    <li>Access all company customer inventories</li>
                  ` : `
                    <li>View and manage customer inventories</li>
                    <li>Create inventories on behalf of customers</li>
                    <li>Access sales analytics and reports</li>
                    <li>Export inventory data for customers</li>
                  `}
                </ul>
                
                <div style="text-align: center;">
                  <a href="${signUpUrl}" class="button">Accept Invitation & Sign Up</a>
                </div>
                
                <p><strong>What's Next?</strong></p>
                <ol>
                  <li>Click the button above to create your account</li>
                  <li>Complete your profile setup</li>
                  <li>Start using the platform immediately</li>
                </ol>
                
                <p>If you have any questions, feel free to reach out to our support team.</p>
              </div>
              <div class="footer">
                <p>This invitation was sent by an administrator of Smart Move Inventory.</p>
                <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('Email sent successfully:', emailData);
    return { success: true, data: emailData };
  } catch (error) {
    console.error("Error sending invite email:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Function to send inventory email notifications
export async function sendInventoryEmail(to: string, inventoryId: string, note?: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const pdfUrl = `${baseUrl}/api/inventories/${inventoryId}/export/pdf`;

    const { data: emailData, error } = await resend.emails.send({
      from: MAIL_FROM,
      to: [to],
      subject: 'Your Moving Inventory Report',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Moving Inventory Report</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📦 Your Moving Inventory Report</h1>
              </div>
              <div class="content">
                <h2>Hello!</h2>
                <p>Your moving inventory has been processed and is ready for review.</p>
                
                ${note ? `<div style="background: #e3f2fd; padding: 15px; border-left: 4px solid #1976d2; margin: 20px 0;">
                  <strong>Note:</strong><br>
                  ${note}
                </div>` : ''}
                
                <p>You can view and download your inventory report using the link below:</p>
                
                <div style="text-align: center;">
                  <a href="${pdfUrl}" class="button">View Inventory Report</a>
                </div>
                
                <p>This report contains all the items identified in your moving inventory, organized by room and category.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error("Error sending inventory email:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
