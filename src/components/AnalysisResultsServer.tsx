"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  TextField,
  Stack
} from '@mui/material';
import {
  Edit,
  Close,
  Calculate,
  Straighten,
  LocalOffer
} from '@mui/icons-material';
import type { Analysis } from '@/types';
import { AnalysisItem } from '@/app/actions/state-actions';
import { setWorkflowPhase, updateTitle, updateNote, setCustomerId } from '@/app/actions/state-actions';
import { saveInventoryToDatabase } from '@/app/actions/analysis-actions';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import ItemEditModal from './ItemEditModal';
import ReviewScreen from './ReviewScreen';
import PricingCalculator from './PricingCalculator';
import { CustomerSelector } from './CustomerSelector';
import { useUser } from '@clerk/nextjs';

interface AnalysisResultsServerProps {
  result: Analysis;
  saving: boolean;
}

export default function AnalysisResultsServer({ 
  result, 
  saving
}: AnalysisResultsServerProps) {
  const { user } = useUser();
  const { switchTab } = useTabNavigation();
  const [showAnalysisModal, setShowAnalysisModal] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReviewScreen] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const pricingModalRef = useRef(false);
  
  // Internal state management
  const [editedItems, setEditedItems] = useState<AnalysisItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inventoryTitle, setInventoryTitle] = useState('My Move');
  const [notes, setNotes] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('customer');

  // Load user role
  useEffect(() => {
    const loadUserRole = async () => {
      if (user) {
        try {
          const response = await fetch('/api/user/role');
          if (response.ok) {
            const data = await response.json();
            setUserRole(data.role);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
    };
    loadUserRole();
  }, [user]);

  // Helper functions for dimensions and volume
  const formatDimensions = (item: { estimatedDimensionsInches: { length: number | null; width: number | null; height: number | null } }) => {
    const { length, width, height } = item.estimatedDimensionsInches;
    const dims = [length, width, height].filter(d => d !== null);
    return dims.length > 0 ? `${dims.join(' × ')} in` : 'Unknown';
  };

  const calculateVolume = (item: { estimatedDimensionsInches: { length: number | null; width: number | null; height: number | null } }) => {
    const { length, width, height } = item.estimatedDimensionsInches;
    if (length && width && height) {
      const cubicInches = length * width * height;
      const cubicFeet = cubicInches / 1728; // Convert cubic inches to cubic feet
      return `${cubicFeet.toFixed(2)} cu ft`;
    }
    return 'Unknown';
  };

  // Convert Analysis items to AnalysisItem format
  const convertedItems: AnalysisItem[] = result.items.map(item => ({
    ...item,
    confidence: 0.8, // Default confidence since it's not in the original type
    notes: item.notes || ''
  }));

  const isAdmin = userRole === 'admin' || userRole === 'sales' || userRole === 'company-admin';

  const handleAnalyzeClick = () => {
    setShowAnalysisModal(true);
  };

  const handleEditItems = () => {
    setShowAnalysisModal(false);
    setShowEditModal(true);
  };

  const handleEditSave = async (items: AnalysisItem[]) => {
    try {
      setEditedItems(items);
      setShowEditModal(false);
      setShowAnalysisModal(true);
    } catch {
      setError('Failed to save edited items');
    }
  };

  const handlePricingSave = async () => {
    try {
      await setWorkflowPhase('review');
    } catch {
      setError('Failed to save pricing data');
    }
  };

  const handleExit = async () => {
    try {
      await setWorkflowPhase('complete');
      switchTab('inventories');
    } catch {
      setError('Failed to exit workflow');
    }
  };

  const handleSaveInventory = async () => {
    try {
      await setWorkflowPhase('complete');
      switchTab('inventories');
    } catch {
      setError('Failed to save inventory');
    }
  };

  const handleSaveAndPricing = () => {
    console.log('Save & Pricing clicked - opening pricing modal');
    
    // Close analysis modal and open pricing modal immediately
    setShowAnalysisModal(false);
    setShowPricingModal(true);
    pricingModalRef.current = true;
    
    console.log('Modal states set - analysis:', false, 'pricing:', true);
    
    // DON'T call saveInventoryInBackground - that's what's causing the re-render
    // The save will happen when the user submits the pricing form
  };

  const saveInventoryInBackground = async () => {
    console.log('Starting background save...');
    try {
      await updateTitle(inventoryTitle);
      await updateNote(notes);
      if (selectedCustomerId) {
        await setCustomerId(selectedCustomerId);
      }
      
      const result = await saveInventoryToDatabase();
      
      if (!result.success) {
        console.error('Save failed:', result.error);
        setError(`Failed to save inventory: ${result.error || 'Unknown error'}`);
      } else {
        console.log('Save completed successfully');
      }
      
    } catch (error) {
      console.error('Failed to save inventory:', error);
      setError(`Failed to save inventory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePricingSubmit = async (pricingData: unknown) => {
    try {
      console.log('Pricing submitted:', pricingData);
      
      // Save when user submits pricing
      await saveInventoryInBackground();
      
      setShowPricingModal(false);
      pricingModalRef.current = false;
      window.location.href = '/inventories';
    } catch (error) {
      console.error('Failed to handle pricing submission:', error);
      setError('Failed to process pricing data');
    }
  };

  const handlePricingCancel = async () => {
    try {
      // Save when user cancels pricing too
      await saveInventoryInBackground();
      
      setShowPricingModal(false);
      pricingModalRef.current = false;
      setShowAnalysisModal(true);
    } catch (error) {
      console.error('Failed to save on cancel:', error);
      setError('Failed to save inventory');
    }
  };

  if (showReviewScreen) {
    return (
      <ReviewScreen
        items={editedItems}
        onEditItems={handleEditSave}
        onSavePricing={handlePricingSave}
        onExit={handleExit}
        onSaveInventory={handleSaveInventory}
        saving={saving}
      />
    );
  }

  return (
    <>
      {/* Pricing Calculator Modal - RENDERED FIRST AND OUTSIDE EVERYTHING */}
      {console.log('Rendering pricing modal:', showPricingModal, 'ref:', pricingModalRef.current)}
      {(showPricingModal || pricingModalRef.current) && (
        <Box sx={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}>
          <Box sx={{ 
            backgroundColor: 'white', 
            borderRadius: 2, 
            maxWidth: '95vw', 
            maxHeight: '95vh',
            overflow: 'auto',
            width: '100%'
          }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">Pricing Calculator</Typography>
                <Button
                  variant="outlined"
                  startIcon={<Close />}
                  onClick={handlePricingCancel}
                  size="small"
                >
                  Close
                </Button>
              </Box>
            </Box>
            <Box sx={{ p: 2 }}>
              <PricingCalculator
                items={editedItems.length > 0 ? editedItems : convertedItems}
                onSave={handlePricingSubmit}
                onCancel={handlePricingCancel}
              />
            </Box>
          </Box>
        </Box>
      )}

      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h2" gutterBottom>
              Analysis Complete
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {result.items.length} item{result.items.length !== 1 ? 's' : ''} identified
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<Edit />}
            onClick={handleAnalyzeClick}
            sx={{ minWidth: 140 }}
          >
            Analyze Items
          </Button>
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

        {/* Analysis Results Modal */}
        <Dialog
          open={showAnalysisModal}
          onClose={() => setShowAnalysisModal(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: { minHeight: '80vh' }
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5">Analysis Results</Typography>
              <Button
                variant="outlined"
                startIcon={<Close />}
                onClick={() => setShowAnalysisModal(false)}
                size="small"
              >
                Close
              </Button>
            </Box>
          </DialogTitle>

          <DialogContent dividers>
            {/* Admin Controls */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Inventory Details
                </Typography>
                
                <Stack spacing={3}>
                  {/* Customer Selection (Admin only) */}
                  {isAdmin && (
                    <CustomerSelector 
                      currentCustomerId={selectedCustomerId}
                      onCustomerChange={setSelectedCustomerId}
                    />
                  )}

                  {/* Inventory Title */}
                  <TextField
                    fullWidth
                    label="Inventory Title"
                    value={inventoryTitle}
                    onChange={(e) => setInventoryTitle(e.target.value)}
                  />

                  {/* Notes */}
                  <TextField
                    fullWidth
                    label="Notes (Optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    multiline
                    rows={3}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Confidence Note */}
            {result.confidenceNote && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>Analysis Note</AlertTitle>
                {result.confidenceNote}
              </Alert>
            )}

            {/* Items Grid */}
            <Typography variant="h6" gutterBottom>
              Identified Items ({editedItems.length > 0 ? editedItems.length : result.items.length})
            </Typography>
            <Grid container spacing={2}>
              {(editedItems.length > 0 ? editedItems : result.items).map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle1">
                          {item.shortName}
                        </Typography>
                        <Chip 
                          label={`${item.count} ${item.count === 1 ? 'item' : 'items'}`} 
                          size="small" 
                          color="primary" 
                          variant="filled"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        {item.description}
                      </Typography>
                      
                      {/* Dimensions and Volume */}
                      <Box sx={{ 
                        backgroundColor: 'action.hover', 
                        p: 1.5, 
                        borderRadius: 1, 
                        mb: 1.5,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                          <Straighten sx={{ fontSize: 16, color: 'primary.main' }} />
                          <Typography variant="body2" fontWeight="medium" color="text.primary">
                            {formatDimensions(item)}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <LocalOffer sx={{ fontSize: 16, color: 'secondary.main' }} />
                          <Typography variant="body2" fontWeight="medium" color="text.primary">
                            Volume: {calculateVolume(item)}
                          </Typography>
                        </Stack>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        {item.roomName && (
                          <Chip
                            label={item.roomName}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {item.tags && item.tags.slice(0, 3).map((tag, tagIndex) => (
                          <Chip
                            key={tagIndex}
                            label={tag}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                      
                      {item.notes && (
                        <Typography variant="caption" color="text.secondary">
                          {item.notes}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setShowAnalysisModal(false)} variant="outlined">
              Cancel
            </Button>
            <Button 
              onClick={handleEditItems}
              variant="outlined" 
              startIcon={<Edit />}
            >
              Edit Items
            </Button>
            <Button 
              onClick={handleSaveAndPricing}
              variant="contained" 
              startIcon={<Calculate />}
            >
              Save & Pricing
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Items Modal */}
        <ItemEditModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditSave}
          initialItems={convertedItems}
          title="Edit Items"
        />
      </Box>
    </>
  );
}