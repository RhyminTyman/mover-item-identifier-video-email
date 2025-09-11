import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AccountManagement } from "@/components/account/AccountManagement";
import { ensureUserExists } from "@/lib/user";
import HeaderClientServer from "@/components/HeaderClientServer";
import { Box, Container } from "@mui/material";

export default async function AccountPage() {
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

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <HeaderClientServer activeTab="inventories" />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AccountManagement />
      </Container>
    </Box>
  );
}
