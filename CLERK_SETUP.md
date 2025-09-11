# Clerk.js Authentication Setup Guide

This guide will help you set up Clerk.js authentication with three user types: customers, sales, and admin.

## 🔑 **Step 1: Create Clerk Account**

1. **Go to**: [https://clerk.com](https://clerk.com)
2. **Sign up** for a free account
3. **Create a new application**

## 🔧 **Step 2: Get API Keys**

1. **Go to**: [https://dashboard.clerk.com/last-active?path=api-keys](https://dashboard.clerk.com/last-active?path=api-keys)
2. **Copy your keys**:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_test_`)
   - `CLERK_SECRET_KEY` (starts with `sk_test_`)

## 📝 **Step 3: Add Environment Variables**

Add these to your `.env.local` file:

```bash
# Clerk.js Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 🔗 **Step 4: Set Up Webhook (Optional)**

1. **Go to**: [https://dashboard.clerk.com/last-active?path=webhooks](https://dashboard.clerk.com/last-active?path=webhooks)
2. **Create a new webhook**:
   - **Endpoint URL**: `https://your-domain.com/api/webhooks/clerk`
   - **Events**: Select `user.created` and `user.deleted`
3. **Copy the webhook secret** and add it to your environment variables

## 👥 **Step 5: Configure User Roles**

The system is already configured with three user types:

### **Customer** (Default)
- Can create and manage their own inventories
- Can view their own analytics
- Cannot access admin features

### **Sales**
- Can view all inventories
- Can create inventories for customers
- Can view analytics
- Cannot manage users

### **Admin**
- Full system access
- Can manage all users and their roles
- Can view all analytics
- Can access admin panel

## 🚀 **Step 6: Test the Setup**

1. **Start your development server**:
   ```bash
   pnpm dev
   ```

2. **Visit**: `http://localhost:3000`
3. **Click "Sign In"** to test authentication
4. **Sign up** for a new account (will be assigned "customer" role by default)

## 🔧 **Step 7: Assign Roles (Admin Only)**

To assign roles to users:

1. **Sign in as an admin** (you'll need to manually update the database)
2. **Go to**: `/admin/users` (admin only)
3. **Edit user roles** as needed

## 📊 **Features Included**

### **Authentication Pages**
- `/sign-in` - User sign in
- `/sign-up` - User registration
- `/dashboard` - Role-based dashboard

### **User Management (Admin Only)**
- `/admin/users` - Manage all users
- Role assignment and user deletion
- User analytics and management

### **Role-Based Access**
- **Protected routes** based on user type
- **Different dashboards** for each role
- **Permission-based UI** components

### **Database Integration**
- **User profiles** stored in PostgreSQL
- **Role management** with Prisma
- **Webhook integration** for user sync

## 🛠 **Troubleshooting**

### **Build Errors**
- Make sure all environment variables are set
- Check that Clerk keys are valid
- Ensure database is accessible

### **Authentication Issues**
- Verify Clerk configuration
- Check middleware setup
- Ensure webhook is properly configured

### **Role Assignment**
- Users are created with "customer" role by default
- Admins can change roles via the admin panel
- Database must be updated for role changes

## 📚 **Next Steps**

1. **Set up your Clerk account** and get API keys
2. **Add environment variables** to `.env.local`
3. **Test authentication** with different user types
4. **Configure webhooks** for user management
5. **Customize roles** and permissions as needed

## 🎯 **User Types Summary**

| Role | Permissions | Dashboard Features |
|------|-------------|-------------------|
| **Customer** | Own inventories only | Create, view, edit own inventories |
| **Sales** | All inventories | Manage customer inventories, analytics |
| **Admin** | Full system access | User management, system settings, all features |

The system is now ready for multi-user authentication with role-based access control! 🚀
