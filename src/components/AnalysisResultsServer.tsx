"use client";

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
} from '@mui/material';
import {
  Straighten,
  Room,
  Save,
  Close,
} from '@mui/icons-material';
import type { Analysis } from '@/types';
import { saveInventoryToDatabase } from '@/app/actions/analysis-actions';
import { useRouter } from 'next/navigation';

interface AnalysisResultsServerProps {
  result: Analysis;
  saving: boolean;
}

export default function AnalysisResultsServer({ 
  result, 
  saving
}: AnalysisResultsServerProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const formatDimensions = (item: { estimatedDimensionsInches: { length: number | null; width: number | null; height: number | null } }) => {
    const { length, width, height } = item.estimatedDimensionsInches;
    const dims = [length, width, height].filter(d => d !== null);
    return dims.length > 0 ? `${dims.join(' × ')} in` : 'Unknown';
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await saveInventoryToDatabase();
      if (result.success && result.inventoryId) {
        router.push(`/inventories/${result.inventoryId}`);
      } else {
        setError(result.error || 'Failed to save inventory');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save inventory');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h2" gutterBottom>
            Analysis Results
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {result.items.length} item{result.items.length !== 1 ? 's' : ''} identified
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Close />}
            onClick={() => router.push('/?tab=inventories')}
            sx={{ minWidth: 140 }}
          >
            View Inventories
          </Button>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={saving || isSaving}
            sx={{ minWidth: 140 }}
          >
            {isSaving ? 'Saving...' : 'Save Inventory'}
          </Button>
        </Stack>
      </Box>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {/* Confidence Note */}
      {result.confidenceNote && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Analysis Note</AlertTitle>
          {result.confidenceNote}
        </Alert>
      )}

      {/* Items Grid */}
      <Grid container spacing={3}>
        {result.items.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h3" gutterBottom>
                  {item.shortName}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {item.description}
                </Typography>

                {/* Dimensions */}
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Straighten fontSize="small" color="action" />
                  <Typography variant="body2">
                    {formatDimensions(item)}
                  </Typography>
                </Stack>

                {/* Room */}
                {item.roomName && (
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Room fontSize="small" color="action" />
                    <Typography variant="body2">
                      {item.roomName}
                    </Typography>
                  </Stack>
                )}

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {item.tags.map((tag, tagIndex) => (
                        <Chip
                          key={tagIndex}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Notes */}
                {item.notes && (
                  <Paper variant="outlined" sx={{ p: 2, mt: 'auto' }}>
                    <Typography variant="body2" color="text.secondary">
                      {item.notes}
                    </Typography>
                  </Paper>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Summary */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <Stack direction="row" spacing={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Items
              </Typography>
              <Typography variant="h6">
                {result.items.length}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Rooms
              </Typography>
              <Typography variant="h6">
                {new Set(result.items.map(item => item.roomName).filter(Boolean)).size}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
