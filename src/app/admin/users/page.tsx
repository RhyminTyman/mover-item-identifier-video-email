import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/user";
import { ensureUserExists } from "@/lib/user";
import { currentUser } from "@clerk/nextjs/server";
import HeaderClientServer from "@/components/HeaderClientServer";
import { Box, Container } from "@mui/material";
import UserManagement from "@/components/admin/UserManagement";
import DebugPanel from "@/components/admin/DebugPanel";

// Force this page to be server-rendered, not statically generated
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Ensure user exists in database
  const clerkUser = await currentUser();
  if (clerkUser) {
    await ensureUserExists(
      clerkUser.id,
      clerkUser.emailAddresses[0].emailAddress,
      clerkUser.firstName || '',
      clerkUser.lastName || '',
      'customer'
    );
  }

  // Check if user is admin
  const userRole = await getUserRole(userId);
  if (userRole !== "admin") {
    redirect("/dashboard");
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <HeaderClientServer activeTab="inventories" />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <DebugPanel />
        <Box sx={{ mt: 3 }}>
          <UserManagement />
        </Box>
      </Container>
    </Box>
  );
}
