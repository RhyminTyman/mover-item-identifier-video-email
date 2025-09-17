"use client";

import React, { useState } from 'react';
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
  Calculate
} from '@mui/icons-material';
import type { Analysis } from '@/types';
import { AnalysisItem } from '@/app/actions/state-actions';
import { setWorkflowPhase, updateTitle, updateNote, setCustomerId } from '@/app/actions/state-actions';
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
  const [showAnalysisModal, setShowAnalysisModal] = useState(true); // Auto-open modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReviewScreen] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editedItems, setEditedItems] = useState<AnalysisItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inventoryTitle, setInventoryTitle] = useState('My Move');
  const [notes, setNotes] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('customer');

  // Convert Analysis items to AnalysisItem format
  const convertedItems: AnalysisItem[] = result.items.map(item => ({
    ...item,
    confidence: 0.8, // Default confidence since it's not in the original type
    notes: item.notes || ''
  }));

  // Load user role
  React.useEffect(() => {
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
      // Stay in the analysis modal with updated items
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
      // Navigate to inventories tab
      switchTab('inventories');
    } catch {
      setError('Failed to exit workflow');
    }
  };

  const handleSaveInventory = async () => {
    try {
      await setWorkflowPhase('complete');
      // Here you would save the inventory to database
      // Navigate to inventories tab
      switchTab('inventories');
    } catch {
      setError('Failed to save inventory');
    }
  };

  const handleSaveAndPricing = async () => {
    try {
      // Save the inventory details
      await updateTitle(inventoryTitle);
      await updateNote(notes);
      if (selectedCustomerId) {
        await setCustomerId(selectedCustomerId);
      }
      
      // Close current modal and open pricing modal
      setShowAnalysisModal(false);
      setShowPricingModal(true);
    } catch {
      setError('Failed to save inventory details');
    }
  };

  const handlePricingSubmit = async (pricingData: unknown) => {
    try {
      // Handle pricing submission
      console.log('Pricing submitted:', pricingData);
      // Here you would save the pricing data
      setShowPricingModal(false);
      // Navigate to inventories tab using state management
      switchTab('inventories');
    } catch {
      setError('Failed to submit pricing');
    }
  };

  const handlePricingCancel = async () => {
    setShowPricingModal(false);
    switchTab('inventories');
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
                      {item.count > 1 && (
                        <Chip 
                          label={`${item.count} items`} 
                          size="small" 
                          color="primary" 
                          variant="filled"
                          sx={{ fontWeight: 'bold' }}
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {item.description}
                    </Typography>
                    
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

      {/* Pricing Calculator Modal */}
      <Dialog
        open={showPricingModal}
        onClose={handlePricingCancel}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { minHeight: '90vh' }
        }}
      >
        <DialogTitle>
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
        </DialogTitle>
        <DialogContent dividers>
          <PricingCalculator
            items={editedItems.length > 0 ? editedItems : convertedItems}
            onSave={handlePricingSubmit}
            onCancel={handlePricingCancel}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}