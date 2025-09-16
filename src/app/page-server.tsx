import { getAppState } from './actions/state-actions';
import { Container, Stack, Box, Typography, Alert, AlertTitle } from '@mui/material';
import Header from '@/components/HeaderServer';
import FileUpload from '@/components/FileUploadServer';
import AnalysisResults from '@/components/AnalysisResultsServer';
import ProgressIndicator from '@/components/ProgressIndicator';
import InventoryList from '@/components/InventoryListServer';
import AnalyzeButton from '@/components/AnalyzeButton';
import StateReset from '@/components/StateReset';

export default async function HomePageServer() {
  const state = await getAppState();

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'grey.50' }}>
      <StateReset />
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

            {/* Analyze Button */}
            {state.files.length > 0 && !state.result && (
              <AnalyzeButton 
                files={state.files}
                disabled={state.phase !== "idle"}
                isAnalyzing={state.phase !== "idle" && state.phase !== "complete" && state.phase !== "error"}
              />
            )}

            {/* Analysis Results Modal - Only show if there are results */}
            {state.result && (
              <AnalysisResults 
                result={state.result} 
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
