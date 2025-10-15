/**
 * Email templates for various notifications
 * All templates use responsive HTML design
 */

interface BaseEmailData {
  recipientName: string;
  recipientEmail: string;
}

interface WelcomeEmailData extends BaseEmailData {
  dashboardUrl: string;
}

interface QuoteSubmittedEmailData extends BaseEmailData {
  quoteId: string;
  companyName: string;
  totalCost: number;
  itemCount: number;
  moveDate?: string;
  quoteUrl: string;
}

interface QuoteReceivedEmailData extends BaseEmailData {
  customerName: string;
  customerEmail: string;
  itemCount: number;
  moveDate?: string;
  quoteDashboardUrl: string;
}

interface QuoteAcceptedEmailData extends BaseEmailData {
  customerName: string;
  quoteId: string;
  totalCost: number;
  moveDate?: string;
  inventoryUrl: string;
}

// Base email styles
const emailStyles = `
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .email-header {
      background: linear-gradient(135deg, #28c2a0 0%, #1ea085 100%);
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .email-logo {
      font-size: 28px;
      font-weight: bold;
      margin: 0;
    }
    .email-body {
      padding: 30px 20px;
    }
    .email-button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #28c2a0;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .email-footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #e9ecef;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #28c2a0;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    h1, h2 { color: #333; margin-top: 0; }
    p { margin: 10px 0; }
    a { color: #28c2a0; }
  </style>
`;

// Base template wrapper
function wrapEmailTemplate(body: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Barreleyes</title>
  ${emailStyles}
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1 class="email-logo">📦 Barreleyes</h1>
    </div>
    <div class="email-body">
      ${body}
    </div>
    <div class="email-footer">
      <p>&copy; ${new Date().getFullYear()} Barreleyes. All rights reserved.</p>
      <p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/privacy">Privacy Policy</a> | 
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/terms">Terms of Service</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export function generateWelcomeEmail(data: WelcomeEmailData): { subject: string; html: string } {
  const body = `
    <h2>Welcome to Barreleyes! 🎉</h2>
    <p>Hi ${data.recipientName},</p>
    <p>Thanks for joining Barreleyes! We're excited to help you with your moving needs.</p>
    
    <div class="info-box">
      <strong>What you can do with Barreleyes:</strong>
      <ul>
        <li>📸 Upload photos or videos of your belongings</li>
        <li>🤖 Get AI-powered inventory analysis</li>
        <li>💰 Receive accurate moving quotes</li>
        <li>📊 Manage your inventory and quotes in one place</li>
      </ul>
    </div>

    <p style="text-align: center;">
      <a href="${data.dashboardUrl}" class="email-button">Go to Dashboard</a>
    </p>

    <p>If you have any questions, feel free to reply to this email.</p>
    <p>Happy moving!</p>
    <p><strong>The Barreleyes Team</strong></p>
  `;

  return {
    subject: 'Welcome to Barreleyes! 🎉',
    html: wrapEmailTemplate(body)
  };
}

export function generateQuoteSubmittedEmail(data: QuoteSubmittedEmailData): { subject: string; html: string } {
  const body = `
    <h2>Your Quote Request Has Been Submitted! ✅</h2>
    <p>Hi ${data.recipientName},</p>
    <p>Great news! Your quote request has been successfully submitted to <strong>${data.companyName}</strong>.</p>
    
    <div class="info-box">
      <strong>Quote Summary:</strong>
      <p style="margin: 5px 0;"><strong>Quote ID:</strong> ${data.quoteId}</p>
      <p style="margin: 5px 0;"><strong>Items:</strong> ${data.itemCount} items</p>
      ${data.moveDate ? `<p style="margin: 5px 0;"><strong>Move Date:</strong> ${new Date(data.moveDate).toLocaleDateString()}</p>` : ''}
      <p style="margin: 5px 0;"><strong>Estimated Cost:</strong> $${data.totalCost.toFixed(2)}</p>
    </div>

    <p>The moving company will review your request and get back to you soon with a detailed quote.</p>

    <p style="text-align: center;">
      <a href="${data.quoteUrl}" class="email-button">View Quote Details</a>
    </p>

    <p>You'll receive an email notification when the moving company responds.</p>
    <p><strong>The Barreleyes Team</strong></p>
  `;

  return {
    subject: `Quote Request Submitted - ${data.companyName}`,
    html: wrapEmailTemplate(body)
  };
}

export function generateQuoteReceivedEmail(data: QuoteReceivedEmailData): { subject: string; html: string } {
  const body = `
    <h2>New Quote Request Received! 📬</h2>
    <p>Hi ${data.recipientName},</p>
    <p>You have a new quote request from <strong>${data.customerName}</strong>.</p>
    
    <div class="info-box">
      <strong>Request Details:</strong>
      <p style="margin: 5px 0;"><strong>Customer:</strong> ${data.customerName}</p>
      <p style="margin: 5px 0;"><strong>Email:</strong> ${data.customerEmail}</p>
      <p style="margin: 5px 0;"><strong>Items:</strong> ${data.itemCount} items</p>
      ${data.moveDate ? `<p style="margin: 5px 0;"><strong>Move Date:</strong> ${new Date(data.moveDate).toLocaleDateString()}</p>` : ''}
    </div>

    <p>Review the request and create a quote for the customer through your dashboard.</p>

    <p style="text-align: center;">
      <a href="${data.quoteDashboardUrl}" class="email-button">Review Quote Request</a>
    </p>

    <p>Respond quickly to increase your chances of winning this customer!</p>
    <p><strong>The Barreleyes Team</strong></p>
  `;

  return {
    subject: `New Quote Request from ${data.customerName}`,
    html: wrapEmailTemplate(body)
  };
}

export function generateQuoteAcceptedEmail(data: QuoteAcceptedEmailData): { subject: string; html: string } {
  const body = `
    <h2>Quote Accepted! 🎊</h2>
    <p>Hi ${data.recipientName},</p>
    <p>Great news! <strong>${data.customerName}</strong> has accepted your quote.</p>
    
    <div class="info-box">
      <strong>Quote Details:</strong>
      <p style="margin: 5px 0;"><strong>Quote ID:</strong> ${data.quoteId}</p>
      <p style="margin: 5px 0;"><strong>Customer:</strong> ${data.customerName}</p>
      <p style="margin: 5px 0;"><strong>Total Amount:</strong> $${data.totalCost.toFixed(2)}</p>
      ${data.moveDate ? `<p style="margin: 5px 0;"><strong>Move Date:</strong> ${new Date(data.moveDate).toLocaleDateString()}</p>` : ''}
    </div>

    <p>The customer is ready to proceed. Please reach out to them to finalize the details and schedule the move.</p>

    <p style="text-align: center;">
      <a href="${data.inventoryUrl}" class="email-button">View Full Details</a>
    </p>

    <p>Congratulations on winning this customer!</p>
    <p><strong>The Barreleyes Team</strong></p>
  `;

  return {
    subject: `Quote Accepted - ${data.customerName}`,
    html: wrapEmailTemplate(body)
  };
}

export function generatePasswordResetEmail(recipientName: string, recipientEmail: string, resetUrl: string): { subject: string; html: string } {
  const body = `
    <h2>Password Reset Request 🔐</h2>
    <p>Hi ${recipientName},</p>
    <p>We received a request to reset your password for your Barreleyes account.</p>
    
    <p style="text-align: center;">
      <a href="${resetUrl}" class="email-button">Reset Password</a>
    </p>

    <p>This link will expire in 24 hours for security reasons.</p>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
    <p><strong>The Barreleyes Team</strong></p>
  `;

  return {
    subject: 'Reset Your Barreleyes Password',
    html: wrapEmailTemplate(body)
  };
}

export function generateInviteEmail(recipientName: string, recipientEmail: string, inviterName: string, companyName: string, inviteUrl: string): { subject: string; html: string } {
  const body = `
    <h2>You've Been Invited to Barreleyes! 🎉</h2>
    <p>Hi ${recipientName},</p>
    <p><strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on Barreleyes.</p>
    
    <p>Barreleyes helps moving companies streamline their quote process and manage customer inventories efficiently.</p>

    <p style="text-align: center;">
      <a href="${inviteUrl}" class="email-button">Accept Invitation</a>
    </p>

    <p>This invitation will expire in 7 days.</p>
    <p><strong>The Barreleyes Team</strong></p>
  `;

  return {
    subject: `You're invited to join ${companyName} on Barreleyes`,
    html: wrapEmailTemplate(body)
  };
}

