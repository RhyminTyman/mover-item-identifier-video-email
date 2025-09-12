import nodemailer from "nodemailer";

export function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false") === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP env not configured (SMTP_HOST, SMTP_USER, SMTP_PASS required)");
  }

  return nodemailer.createTransport({
    host, port, secure,
    auth: { user, pass }
  });
}

export const MAIL_FROM = process.env.MAIL_FROM || "Mover Inventory <no-reply@example.com>";

interface InviteEmailData {
  email: string;
  firstName: string;
  lastName: string;
  role: 'sales' | 'admin';
  message?: string;
}

export async function sendInviteEmail(data: InviteEmailData) {
  try {
    const transporter = getTransport();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const signUpUrl = `${baseUrl}/sign-up?invite=${encodeURIComponent(data.email)}&role=${data.role}`;

    const html = `
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
            .role-badge { display: inline-block; background: ${data.role === 'admin' ? '#f44336' : '#ff9800'}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
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
              
              <p><strong>Your Role:</strong> ${data.role === 'admin' ? 'Administrator' : 'Sales Representative'}</p>
              
              ${data.message ? `<div style="background: #e3f2fd; padding: 15px; border-left: 4px solid #1976d2; margin: 20px 0;">
                <strong>Personal Message:</strong><br>
                ${data.message}
              </div>` : ''}
              
              <p>As a ${data.role === 'admin' ? 'administrator' : 'sales representative'}, you'll be able to:</p>
              <ul>
                ${data.role === 'admin' ? `
                  <li>Manage all users and their roles</li>
                  <li>Send invitations to new team members</li>
                  <li>View system analytics and reports</li>
                  <li>Access all customer inventories</li>
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
    `;

    const text = `
Hello ${data.firstName}!

You've been invited to join Smart Move Inventory as a ${data.role === 'admin' ? 'Administrator' : 'Sales Representative'}.

${data.message ? `Personal Message: ${data.message}\n\n` : ''}

To accept this invitation, please visit: ${signUpUrl}

What you can do as a ${data.role}:
${data.role === 'admin' ? `
- Manage all users and their roles
- Send invitations to new team members  
- View system analytics and reports
- Access all customer inventories
` : `
- View and manage customer inventories
- Create inventories on behalf of customers
- Access sales analytics and reports
- Export inventory data for customers
`}

Best regards,
Smart Move Inventory Team
    `;

    await transporter.sendMail({
      from: MAIL_FROM,
      to: data.email,
      subject: `Invitation to join Smart Move Inventory as ${data.role === 'admin' ? 'Administrator' : 'Sales Representative'}`,
      text,
      html
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending invite email:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
