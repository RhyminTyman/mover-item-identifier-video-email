import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserRole, ensureUserExists } from "@/lib/user";
import { getAppState } from '../actions/state-actions';
import { Container, Stack, Box, Typography, Alert, AlertTitle, Button } from '@mui/material';
import { AdminPanelSettings } from '@mui/icons-material';
import Link from 'next/link';
import HeaderClientServer from '@/components/HeaderClientServer';
import FileUploadServer from '@/components/FileUploadServer';
import AnalysisControlsServer from '@/components/AnalysisControlsServer';
import EditableAnalysisResults from '@/components/EditableAnalysisResults';
import ProgressIndicator from '@/components/ProgressIndicator';
import InventoryListServer from '@/components/InventoryListServer';
import { SalesDashboard } from "@/components/dashboard/SalesDashboard";

// Force this page to be server-rendered, not statically generated
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Ensure user exists in database first
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
  
  const userRole = await getUserRole(userId);
  const state = await getAppState();

  // Show role-specific dashboards for sales users only
  if (userRole === "sales") {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        <HeaderClientServer activeTab="inventories" />
        <SalesDashboard />
      </Box>
    );
  }

  // For admins and customers, show the main app interface (inventory creation)
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <HeaderClientServer activeTab={state.activeTab} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Admin Tools - only show for admins */}
        {userRole === "admin" && (
          <Box sx={{ mb: 3, textAlign: 'right' }}>
            <Button 
              variant="outlined" 
              component={Link} 
              href="/admin/users"
              startIcon={<AdminPanelSettings />}
            >
              Admin Tools
            </Button>
          </Box>
        )}
        {/* Analyze Tab */}
        {state.activeTab === 'analyze' && (
          <Stack spacing={4}>
            {/* Title and Description */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h2" component="h1" gutterBottom color="text.primary">
                Smart Move Inventory
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                Upload photos or videos of your belongings and let AI create a detailed inventory for your move
              </Typography>
            </Box>

            {/* Progress Indicator */}
            {state.phase !== "idle" && (
              <ProgressIndicator 
                phase={state.phase} 
                progress={state.progress} 
                error={state.error} 
              />
            )}

            {/* Error Messages */}
            {state.error && (
              <Alert severity="error">
                <AlertTitle>Error</AlertTitle>
                {state.error}
              </Alert>
            )}

            {/* File Upload */}
            <FileUploadServer files={state.files} />

            {/* Analysis Controls */}
            {state.files.length > 0 && (
              <AnalysisControlsServer 
                files={state.files}
                result={state.result}
                title={state.title}
                note={state.note}
                saving={state.saving}
                phase={state.phase}
              />
            )}

            {/* Analysis Results */}
            {state.result && (
              <EditableAnalysisResults 
                result={state.result} 
                saving={state.saving}
              />
            )}
          </Stack>
        )}

        {/* Inventories Tab */}
        {state.activeTab === 'inventories' && (
          <InventoryListServer />
        )}
      </Container>
    </Box>
  );
}
