import { Resend } from 'resend';

// Initialize Resend with API key (only if available)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const MAIL_FROM = process.env.MAIL_FROM || "Barreleyes <delivered@resend.dev>";

interface InviteEmailData {
  email: string;
  firstName: string;
  lastName: string;
  role: 'sales' | 'admin' | 'company-admin';
  message?: string;
  companyInfo?: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone?: string;
    email?: string;
    website?: string;
  };
}

interface NewInventoryNotificationData {
  salesRepEmail: string;
  salesRepName: string;
  inventoryId: string;
  inventoryTitle: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  companyName: string;
  submittedAt: Date;
}

export async function sendInviteEmail(data: InviteEmailData) {
  try {
    if (!resend) {
      throw new Error("Resend API key not configured. Please set RESEND_API_KEY environment variable.");
    }

    // For testing purposes, if email is not the owner's email, send to owner instead
    const ownerEmail = "josephtyman@gmail.com";
    const actualRecipient = data.email;
    const sendToOwner = data.email !== ownerEmail;
    
    if (sendToOwner) {
      console.log(`⚠️ [Email] Resend testing mode: Sending invitation for ${data.email} to owner ${ownerEmail} instead`);
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const signUpUrl = `${baseUrl}/sign-up?invite=${encodeURIComponent(data.email)}&role=${data.role}`;

    const { data: emailData, error } = await resend.emails.send({
      from: MAIL_FROM,
      to: [sendToOwner ? ownerEmail : data.email],
      subject: `Invitation to join Barreleyes as ${data.role === 'admin' ? 'Administrator' : data.role === 'company-admin' ? 'Company Administrator' : 'Sales Representative'}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitation to Barreleyes</title>
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
                <p>Join Barreleyes as a <span class="role-badge">${data.role.toUpperCase()}</span></p>
              </div>
              <div class="content">
                <h2>Hello ${data.firstName}!</h2>
                ${sendToOwner ? `<div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; color: #856404;">
                  <strong>⚠️ Testing Mode:</strong> This invitation was intended for <strong>${actualRecipient}</strong> but is being sent to you for testing purposes.
                </div>` : ''}
                <p>You've been invited to join Barreleyes, our AI-powered moving inventory management system.</p>
                
                <p><strong>Your Role:</strong> ${data.role === 'admin' ? 'Administrator' : data.role === 'company-admin' ? 'Company Administrator' : 'Sales Representative'}</p>
                
                ${data.role === 'company-admin' && data.companyInfo ? `
                  <div style="background: #f3e5f5; padding: 15px; border-left: 4px solid #9c27b0; margin: 20px 0;">
                    <strong>Company Information:</strong><br>
                    <strong>Name:</strong> ${data.companyInfo.name}<br>
                    <strong>Address:</strong> ${data.companyInfo.address}<br>
                    <strong>City:</strong> ${data.companyInfo.city}, ${data.companyInfo.state} ${data.companyInfo.zipCode}<br>
                    ${data.companyInfo.phone ? `<strong>Phone:</strong> ${data.companyInfo.phone}<br>` : ''}
                    ${data.companyInfo.email ? `<strong>Email:</strong> ${data.companyInfo.email}<br>` : ''}
                    ${data.companyInfo.website ? `<strong>Website:</strong> ${data.companyInfo.website}<br>` : ''}
                  </div>
                ` : ''}
                
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
                <p>This invitation was sent by an administrator of Barreleyes.</p>
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

export async function sendNewInventoryNotification(data: NewInventoryNotificationData) {
  try {
    if (!resend) {
      throw new Error("Resend API key not configured. Please set RESEND_API_KEY environment variable.");
    }

    // For testing purposes, if email is not the owner's email, send to owner instead
    const ownerEmail = "josephtyman@gmail.com";
    const actualRecipient = data.salesRepEmail;
    const sendToOwner = data.salesRepEmail !== ownerEmail;
    
    if (sendToOwner) {
      console.log(`⚠️ [Email] Resend testing mode: Sending inventory notification for ${data.salesRepEmail} to owner ${ownerEmail} instead`);
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const inventoryUrl = `${baseUrl}/inventories/${data.inventoryId}`;

    const { data: emailData, error } = await resend.emails.send({
      from: MAIL_FROM,
      to: [sendToOwner ? ownerEmail : data.salesRepEmail],
      subject: `New Inventory Submission: ${data.inventoryTitle} - ${data.customerName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Inventory Submission</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
              .info-box { background: #e3f2fd; padding: 15px; border-left: 4px solid #1976d2; margin: 20px 0; }
              .customer-info { background: #f3e5f5; padding: 15px; border-left: 4px solid #9c27b0; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📦 New Inventory Submission</h1>
                <p>Customer has submitted their moving inventory for review</p>
              </div>
              <div class="content">
                <h2>Hello ${data.salesRepName}!</h2>
                ${sendToOwner ? `<div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; color: #856404;">
                  <strong>⚠️ Testing Mode:</strong> This notification was intended for <strong>${actualRecipient}</strong> but is being sent to you for testing purposes.
                </div>` : ''}
                
                <div class="info-box">
                  <strong>Inventory Details:</strong><br>
                  <strong>Title:</strong> ${data.inventoryTitle}<br>
                  <strong>Items Count:</strong> ${data.itemCount} items<br>
                  <strong>Submitted:</strong> ${new Date(data.submittedAt).toLocaleString()}<br>
                  <strong>Company:</strong> ${data.companyName}
                </div>
                
                <div class="customer-info">
                  <strong>Customer Information:</strong><br>
                  <strong>Name:</strong> ${data.customerName}<br>
                  <strong>Email:</strong> ${data.customerEmail}
                </div>
                
                <p><strong>Next Steps:</strong></p>
                <ol>
                  <li>Review the inventory items and dimensions</li>
                  <li>Schedule a site visit if needed</li>
                  <li>Verify and edit any incorrect dimensions</li>
                  <li>Provide final quote to customer</li>
                  <li>Follow up on customer acceptance</li>
                </ol>
                
                <div style="text-align: center;">
                  <a href="${inventoryUrl}" class="button">View Inventory & Take Action</a>
                </div>
                
                <p><strong>Priority:</strong> Please review this inventory within 24 hours to provide timely service to the customer.</p>
                
                <p>If you have any questions about this submission, please contact your supervisor or the customer directly.</p>
              </div>
              <div class="footer">
                <p>This notification was sent automatically by ${data.companyName} Barreleyes System.</p>
                <p>If you're not the assigned sales rep for this customer, please contact your supervisor.</p>
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

    console.log('New inventory notification sent successfully:', emailData);
    return { success: true, data: emailData };
  } catch (error) {
    console.error("Error sending new inventory notification:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
