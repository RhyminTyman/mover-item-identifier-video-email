import { getAppState } from './actions/state-actions';
import { Container, Stack, Box, Typography, Card, Button, Alert, AlertTitle } from '@mui/material';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import AnalysisResults from '@/components/AnalysisResults';
import ProgressIndicator from '@/components/ProgressIndicator';
import InventoryList from '@/components/InventoryList';

export default async function HomePageServer() {
  const state = await getAppState();

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'grey.50' }}>
      <Header activeTab={state.activeTab} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
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
            <FileUpload files={state.files} />

            {/* Analysis Controls */}
            {state.files.length > 0 && (
              <Card>
                {/* Analysis controls will be handled by client components */}
              </Card>
            )}

            {/* Analysis Results */}
            {state.result && (
              <AnalysisResults 
                result={state.result} 
                title={state.title}
                note={state.note}
                saving={state.saving}
              />
            )}
          </Stack>
        )}

        {/* Inventories Tab */}
        {state.activeTab === 'inventories' && (
          <InventoryList />
        )}
      </Container>
    </Box>
  );
}
