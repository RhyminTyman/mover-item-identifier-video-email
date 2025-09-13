# Resend Email Service Setup Guide

This guide will help you set up Resend as your email service provider for the Smart Move Inventory application.

## Why Resend?

Resend is a modern email service built specifically for developers and Next.js applications. It offers:

- **Excellent deliverability** - High inbox placement rates
- **Developer-friendly** - Simple API and great documentation
- **Next.js integration** - Built-in support for React email templates
- **Reasonable pricing** - Free tier with 3,000 emails/month
- **Modern features** - Webhooks, analytics, and more

## Setup Steps

### 1. Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key

1. Log into your Resend dashboard
2. Go to "API Keys" in the sidebar
3. Click "Create API Key"
4. Give it a name (e.g., "Smart Move Inventory")
5. Copy the API key (starts with `re_`)

### 3. Configure Environment Variables

Add these variables to your `.env.local` file:

```bash
# Resend Email Service Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email sender configuration
MAIL_FROM=Smart Move Inventory <onboarding@resend.dev>
# Or with your own domain:
# MAIL_FROM=Smart Move Inventory <noreply@yourdomain.com>

# Base URL for email links (optional, will be auto-detected)
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### 4. Domain Verification (Optional but Recommended)

For better deliverability and branding:

1. In your Resend dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the required DNS records to your domain provider
5. Wait for verification (usually takes a few minutes)
6. Update your `MAIL_FROM` to use your verified domain

### 5. Test the Integration

1. Start your development server: `pnpm dev`
2. Go to the admin panel
3. Try inviting a user
4. Check the Resend dashboard for delivery status

## Features Implemented

### User Invitations
- Beautiful HTML email templates
- Role-based content (admin, company-admin, sales)
- Personal messages support
- Sign-up links with pre-filled data

### Inventory Reports
- Professional email templates
- PDF report links
- CSV data inclusion
- Custom notes support

## Monitoring and Analytics

Resend provides detailed analytics:

- **Delivery rates** - Track successful email deliveries
- **Open rates** - See which emails are opened
- **Click rates** - Monitor link clicks
- **Bounce rates** - Identify delivery issues
- **Webhooks** - Real-time delivery notifications

## Pricing

- **Free Tier**: 3,000 emails/month
- **Pro Plan**: $20/month for 50,000 emails
- **Business Plan**: $80/month for 200,000 emails

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Check that your `RESEND_API_KEY` is correct
   - Ensure there are no extra spaces or characters

2. **"From address not verified" error**
   - Use the default Resend domain: `onboarding@resend.dev`
   - Or verify your own domain in the Resend dashboard

3. **Emails not being delivered**
   - Check the Resend dashboard for delivery status
   - Look for bounce notifications
   - Verify your domain's DNS settings

### Support

- **Resend Documentation**: [resend.com/docs](https://resend.com/docs)
- **Resend Support**: Available through their dashboard
- **Community**: [GitHub Discussions](https://github.com/resend/resend/discussions)

## Migration from SMTP

If you're migrating from SMTP (nodemailer), the changes are minimal:

1. Install Resend: `pnpm add resend`
2. Replace SMTP configuration with Resend API key
3. Update email sending code to use Resend's API
4. Test thoroughly before deploying

The application has been updated to use Resend by default, but you can still use SMTP by keeping your existing environment variables and reverting the email service changes if needed.
