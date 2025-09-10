"use client";

import React, { useState, useCallback } from 'react';
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
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import {
  Straighten,
  Room,
  Save,
  Edit,
  Check,
  Feedback,
} from '@mui/icons-material';
import type { Analysis } from '@/types';
import { saveInventory } from '@/app/actions/analysis-actions';
import { 
  addItemAnalytics, 
  createFeedbackSession,
  type ItemAnalyticsData 
} from '@/lib/analytics';

interface EditableAnalysisResultsProps {
  result: Analysis;
  saving: boolean;
}

interface EditableItem {
  shortName: string;
  description: string;
  estimatedDimensionsInches: {
    length: number | null;
    width: number | null;
    height: number | null;
  };
  notes?: string;
  tags?: string[];
  roomName?: string | null;
  originalDimensions?: {
    length: number | null;
    width: number | null;
    height: number | null;
  };
}

export default function EditableAnalysisResults({ 
  result, 
  saving
}: EditableAnalysisResultsProps) {
  const [items, setItems] = useState<EditableItem[]>(
    result.items.map(item => ({
      ...item,
      originalDimensions: { ...item.estimatedDimensionsInches }
    }))
  );
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [feedbackSnackbar, setFeedbackSnackbar] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const formatDimensions = (item: EditableItem) => {
    const { length, width, height } = item.estimatedDimensionsInches;
    const dims = [length, width, height].filter(d => d !== null);
    return dims.length > 0 ? `${dims.join(' × ')} in` : 'Unknown';
  };

  const calculateDifference = (original: number | null, edited: number | null): number => {
    if (!original || !edited) return 0;
    return Math.abs((edited - original) / original) * 100;
  };

  const hasSignificantDifference = useCallback((item: EditableItem): boolean => {
    if (!item.originalDimensions) return false;
    const { length, width, height } = item.estimatedDimensionsInches;
    const { length: origLength, width: origWidth, height: origHeight } = item.originalDimensions;
    
    return calculateDifference(origLength, length) > 10 ||
           calculateDifference(origWidth, width) > 10 ||
           calculateDifference(origHeight, height) > 10;
  }, []);

  const handleEditDimensions = (index: number) => {
    setEditingItem(index);
    setEditDialogOpen(true);
  };

  const handleSaveDimensions = useCallback(() => {
    if (editingItem === null) return;
    
    const item = items[editingItem];
    const hasSignificantDiff = hasSignificantDifference(item);
    
    if (hasSignificantDiff) {
      setFeedbackMessage(`Dimensions for "${item.shortName}" were significantly different from AI estimates. This feedback will help improve future analysis accuracy.`);
      setFeedbackSnackbar(true);
    }
    
    setEditDialogOpen(false);
    setEditingItem(null);
  }, [editingItem, items, hasSignificantDifference]);

  const handleDimensionChange = (field: 'length' | 'width' | 'height', value: string) => {
    if (editingItem === null) return;
    
    const numValue = value === '' ? null : parseFloat(value);
    if (numValue !== null && (isNaN(numValue) || numValue < 0)) return;
    
    setItems(prev => prev.map((item, index) => 
      index === editingItem 
        ? {
            ...item,
            estimatedDimensionsInches: {
              ...item.estimatedDimensionsInches,
              [field]: numValue
            }
          }
        : item
    ));
  };

  const handleSave = async () => {
    // Generate a session ID for this save operation (you might want to pass this from the analysis)
    const sessionId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Track edited items
    const editedItems = items.filter(item => item.originalDimensions && hasSignificantDifference(item));
    const itemsWithSignificantDiff = items.filter(hasSignificantDifference);
    
    try {
      // Update analytics with edit data
      if (editedItems.length > 0) {
        const itemAnalyticsData: ItemAnalyticsData[] = editedItems.map(item => ({
          shortName: item.shortName,
          description: item.description,
          roomName: item.roomName,
          tags: item.tags || [],
          aiLength: item.originalDimensions?.length,
          aiWidth: item.originalDimensions?.width,
          aiHeight: item.originalDimensions?.height,
          userLength: item.estimatedDimensionsInches.length,
          userWidth: item.estimatedDimensionsInches.width,
          userHeight: item.estimatedDimensionsInches.height,
          wasEdited: true,
          editTimestamp: new Date(),
        }));

        await addItemAnalytics(sessionId, itemAnalyticsData);
      }

      // Send feedback to the AI if there were significant differences
      if (itemsWithSignificantDiff.length > 0) {
        console.log('Items with significant dimension differences:', itemsWithSignificantDiff);
        
        try {
          const correctedDimensions = itemsWithSignificantDiff.map(item => ({
            shortName: item.shortName,
            originalDimensions: item.originalDimensions,
            correctedDimensions: item.estimatedDimensionsInches,
            differences: {
              length: item.originalDimensions?.length && item.estimatedDimensionsInches.length 
                ? calculateDifference(item.originalDimensions.length, item.estimatedDimensionsInches.length)
                : 0,
              width: item.originalDimensions?.width && item.estimatedDimensionsInches.width 
                ? calculateDifference(item.originalDimensions.width, item.estimatedDimensionsInches.width)
                : 0,
              height: item.originalDimensions?.height && item.estimatedDimensionsInches.height 
                ? calculateDifference(item.originalDimensions.height, item.estimatedDimensionsInches.height)
                : 0,
            }
          }));

          const feedbackResponse = await fetch('/api/feedback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              originalAnalysis: result,
              correctedDimensions: correctedDimensions,
              feedback: `User corrected ${correctedDimensions.length} items with dimension differences >10%`
            }),
          });

          const feedbackData = await feedbackResponse.json();

          // Create feedback session analytics
          await createFeedbackSession(sessionId, {
            correctedItems: correctedDimensions.length,
            totalDifferences: correctedDimensions.reduce((sum, item) => 
              sum + item.differences.length + item.differences.width + item.differences.height, 0),
            averageDifference: correctedDimensions.reduce((sum, item) => {
              const diffs = [item.differences.length, item.differences.width, item.differences.height];
              return sum + diffs.reduce((s, d) => s + d, 0) / diffs.length;
            }, 0) / correctedDimensions.length,
            maxDifference: Math.max(...correctedDimensions.map(item => 
              Math.max(item.differences.length, item.differences.width, item.differences.height)
            )),
            aiFeedback: feedbackData.aiFeedback,
            learningInsights: feedbackData.learningInsights,
            suggestedImprovements: feedbackData.suggestedImprovements,
          });

          setFeedbackMessage(`Feedback sent to AI for ${correctedDimensions.length} corrected items to improve future accuracy.`);
          setFeedbackSnackbar(true);
        } catch (error) {
          console.error('Error sending feedback to AI:', error);
          setFeedbackMessage('Dimensions saved, but feedback to AI failed.');
          setFeedbackSnackbar(true);
        }
      }
      
      await saveInventory();
    } catch (error) {
      console.error('Error saving analytics data:', error);
      // Still save the inventory even if analytics fails
      await saveInventory();
    }
  };

  const currentItem = editingItem !== null ? items[editingItem] : null;

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h2" gutterBottom>
            Analysis Results
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and edit the detected items. Click the edit icon to adjust dimensions.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={saving}
          size="large"
        >
          {saving ? 'Saving...' : 'Save Inventory'}
        </Button>
      </Box>

      {/* Confidence Note */}
      {result.confidenceNote && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Analysis Note</AlertTitle>
          {result.confidenceNote}
        </Alert>
      )}

      {/* Items Grid */}
      <Grid container spacing={3}>
        {items.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              border: hasSignificantDifference(item) ? '2px solid #ff9800' : '1px solid #e0e0e0'
            }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {item.shortName}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleEditDimensions(index)}
                    color="primary"
                  >
                    <Edit />
                  </IconButton>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {item.description}
                </Typography>

                {/* Dimensions */}
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Straighten fontSize="small" color="action" />
                  <Typography variant="body2">
                    {formatDimensions(item)}
                  </Typography>
                  {hasSignificantDifference(item) && (
                    <Chip
                      label="Edited"
                      size="small"
                      color="warning"
                      icon={<Feedback />}
                    />
                  )}
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

      {/* Edit Dimensions Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Edit Dimensions - {currentItem?.shortName}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Adjust the dimensions if the AI estimates are incorrect. Changes greater than 10% will be noted for AI improvement.
          </Typography>
          
          <Stack spacing={3}>
            <TextField
              label="Length (inches)"
              type="number"
              value={currentItem?.estimatedDimensionsInches.length || ''}
              onChange={(e) => handleDimensionChange('length', e.target.value)}
              fullWidth
              inputProps={{ min: 0, step: 0.1 }}
            />
            <TextField
              label="Width (inches)"
              type="number"
              value={currentItem?.estimatedDimensionsInches.width || ''}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
              fullWidth
              inputProps={{ min: 0, step: 0.1 }}
            />
            <TextField
              label="Height (inches)"
              type="number"
              value={currentItem?.estimatedDimensionsInches.height || ''}
              onChange={(e) => handleDimensionChange('height', e.target.value)}
              fullWidth
              inputProps={{ min: 0, step: 0.1 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveDimensions} 
            variant="contained"
            startIcon={<Check />}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Snackbar */}
      <Snackbar
        open={feedbackSnackbar}
        autoHideDuration={6000}
        onClose={() => setFeedbackSnackbar(false)}
        message={feedbackMessage}
      />

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
                {items.length}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Edited Items
              </Typography>
              <Typography variant="h6">
                {items.filter(hasSignificantDifference).length}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Rooms
              </Typography>
              <Typography variant="h6">
                {new Set(items.map(item => item.roomName).filter(Boolean)).size}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
