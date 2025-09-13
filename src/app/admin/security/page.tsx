import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/user";
import { ensureUserExists } from "@/lib/user";
import { currentUser } from "@clerk/nextjs/server";
import HeaderClientServer from "@/components/HeaderClientServer";
import { Box, Container, Typography, Card, CardContent } from "@mui/material";
import DebugPanel from "@/components/admin/DebugPanel";

// Force this page to be server-rendered, not statically generated
export const dynamic = 'force-dynamic';

export default async function AdminSecurityPage() {
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
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Security & Logs
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor system security, debug information, and system logs
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Debug Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Real-time system status, API health, and debugging information
            </Typography>
            <DebugPanel />
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
