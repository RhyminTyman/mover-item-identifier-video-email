import { getAppState } from './actions/state-actions';
import { Container, Stack, Box, Typography, Card, Alert, AlertTitle } from '@mui/material';
import HeaderClientServer from '@/components/HeaderClientServer';
import FileUploadServer from '@/components/FileUploadServer';
import AnalysisControlsServer from '@/components/AnalysisControlsServer';
import AnalysisResultsServer from '@/components/AnalysisResultsServer';
import ProgressIndicator from '@/components/ProgressIndicator';
import InventoryListServer from '@/components/InventoryListServer';

export default async function HomePage() {
  const state = await getAppState();

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'grey.50' }}>
      <HeaderClientServer activeTab={state.activeTab} theme={state.theme} />
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
              <AnalysisResultsServer 
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