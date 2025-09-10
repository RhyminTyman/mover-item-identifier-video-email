import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Grid,
  Chip,
  Stack,
  Paper,
  Divider,
} from '@mui/material';
import {
  Inventory,
  Straighten,
  LocalOffer,
  Room,
  Save,
} from '@mui/icons-material';
import type { Analysis } from '@/types';

interface AnalysisResultsProps {
  result: Analysis;
  onSave: () => void;
  saving: boolean;
  s3UploadFailed: boolean;
}

export default function AnalysisResults({ 
  result, 
  onSave, 
  saving, 
  s3UploadFailed 
}: AnalysisResultsProps) {
  const formatDimensions = (item: { estimatedDimensionsInches: { length: number | null; width: number | null; height: number | null } }) => {
    const { length, width, height } = item.estimatedDimensionsInches;
    const dims = [length, width, height].filter(d => d !== null);
    return dims.length > 0 ? `${dims.join(' × ')} in` : 'Unknown';
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h2" gutterBottom>
            Analysis Results
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {result.items.length} items identified
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          size="large"
          startIcon={<Save />}
          onClick={onSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Inventory'}
        </Button>
      </Box>

      {/* S3 Warning */}
      {s3UploadFailed && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>S3 Upload Failed</AlertTitle>
          Images are being processed using base64 data. They will be saved locally but may not be accessible via direct URLs.
        </Alert>
      )}

      {/* Confidence Note */}
      {result.confidenceNote && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Note:</strong> {result.confidenceNote}
          </Typography>
        </Alert>
      )}

      {/* Items Grid */}
      {result.items.length > 0 ? (
        <Grid container spacing={3}>
          {result.items.map((item, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Item Header */}
                  <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
                    <Paper
                      sx={{
                        p: 1,
                        backgroundColor: 'primary.light',
                        color: 'primary.contrastText',
                        minWidth: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Inventory />
                    </Paper>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h3">
                        {item.shortName}
                      </Typography>
                      {item.roomName && (
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                          <Room sx={{ fontSize: 14 }} />
                          <Typography variant="caption" color="text.secondary">
                            {item.roomName}
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                  </Stack>

                  {/* Description */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {item.description}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  {/* Dimensions */}
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Straighten sx={{ fontSize: 16 }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatDimensions(item)}
                    </Typography>
                  </Stack>

                  {/* Notes */}
                  {item.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      <strong>Notes:</strong> {item.notes}
                    </Typography>
                  )}

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {item.tags.map((tag, tagIndex) => (
                        <Chip
                          key={tagIndex}
                          icon={<LocalOffer />}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        /* Empty State */
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Inventory sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No items identified
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try uploading clearer photos or different angles
          </Typography>
        </Box>
      )}
    </Box>
  );
}