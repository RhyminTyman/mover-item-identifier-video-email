"use client";

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  Divider
} from '@mui/material';
import {
  Edit,
  Calculate,
  ExitToApp,
  Save,
  Close,
} from '@mui/icons-material';
import { AnalysisItem } from '@/app/actions/state-actions';
import PricingCalculator from './PricingCalculator';
import ItemEditModal from './ItemEditModal';

// PricingData type from PricingCalculator - using any due to complex interface mismatch
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PricingData = any;

interface ReviewScreenProps {
  items: AnalysisItem[];
  onEditItems: (editedItems: AnalysisItem[]) => void;
  onSavePricing: (pricingData: PricingData) => void;
  onExit: () => void;
  onSaveInventory: () => void;
  saving?: boolean;
}

export default function ReviewScreen({
  items,
  onEditItems,
  onSavePricing,
  onExit,
  onSaveInventory,
  saving = false
}: ReviewScreenProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const handleEditItems = (editedItems: AnalysisItem[]) => {
    onEditItems(editedItems);
    setShowEditModal(false);
  };

  const handleSavePricing = (data: PricingData) => {
    setPricingData(data);
    onSavePricing(data);
    setShowPricingModal(false);
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  const handleSaveInventory = async () => {
    await onSaveInventory();
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  const formatDimensions = (item: AnalysisItem) => {
    const { length, width, height } = item.estimatedDimensionsInches;
    const dims = [length, width, height].filter(d => d !== null);
    return dims.length > 0 ? `${dims.join(' × ')} in` : 'Unknown';
  };

  const calculateTotalCubicFeet = () => {
    return items.reduce((total, item) => {
      const cubicFeet = (item.estimatedDimensionsInches.length || 0) * 
                       (item.estimatedDimensionsInches.width || 0) * 
                       (item.estimatedDimensionsInches.height || 0) / 1728;
      return total + cubicFeet;
    }, 0);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Review Your Inventory
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and finalize your inventory before saving
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => setShowEditModal(true)}
            size="large"
          >
            Edit Items
          </Button>
          <Button
            variant="outlined"
            startIcon={<Calculate />}
            onClick={async () => {
              await onSaveInventory();
              setShowPricingModal(true);
            }}
            size="large"
          >
            Pricing Calculator
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveInventory}
            disabled={saving}
            size="large"
          >
            {saving ? 'Saving...' : 'Save Inventory'}
          </Button>
        </Stack>
      </Box>

      {/* Success Alert */}
      {showSuccessAlert && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setShowSuccessAlert(false)}
        >
          <Typography variant="body2">
            <strong>Success!</strong> Your changes have been saved.
          </Typography>
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary">
                {items.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary">
                {calculateTotalCubicFeet().toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cubic Feet
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary">
                {pricingData ? `$${(pricingData.totalCost as number)?.toFixed(2) || '0.00'}` : '--'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Estimated Cost
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary">
                {new Set(items.map(item => item.roomName).filter(Boolean)).size}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rooms
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Items List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Inventory Items
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {items.length > 0 ? (
            <Grid container spacing={2}>
              {items.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {item.shortName}
                        </Typography>
                        <Chip
                          label={`${Math.round(item.confidence * 100)}%`}
                          size="small"
                          color={item.confidence > 0.8 ? 'success' : item.confidence > 0.6 ? 'warning' : 'error'}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {item.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Room: {item.roomName || 'Not specified'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Size: {formatDimensions(item)}
                        </Typography>
                      </Box>
                      
                      {item.tags.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {item.tags.map((tag, tagIndex) => (
                            <Chip
                              key={tagIndex}
                              label={tag}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No items to display. Add items to get started.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Pricing Summary */}
      {pricingData && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Pricing Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="h6">
                  ${(pricingData.subtotal as number)?.toFixed(2) || '0.00'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Total Cost
                </Typography>
                <Typography variant="h5" color="primary">
                  ${(pricingData.totalCost as number)?.toFixed(2) || '0.00'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ExitToApp />}
          onClick={onExit}
          size="large"
        >
          Exit to Inventory List
        </Button>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => setShowEditModal(true)}
            size="large"
          >
            Edit Items
          </Button>
          <Button
            variant="outlined"
            startIcon={<Calculate />}
            onClick={async () => {
              await onSaveInventory();
              setShowPricingModal(true);
            }}
            size="large"
          >
            Pricing Calculator
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveInventory}
            disabled={saving}
            size="large"
          >
            {saving ? 'Saving...' : 'Save Inventory'}
          </Button>
        </Stack>
      </Box>

      {/* Edit Items Modal */}
      <ItemEditModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditItems}
        initialItems={items}
        title="Edit Inventory Items"
      />

      {/* Pricing Calculator Modal */}
      <Dialog
        open={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { minHeight: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">Pricing Calculator</Typography>
            <IconButton onClick={() => setShowPricingModal(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <PricingCalculator
            items={items}
            onSave={handleSavePricing}
            onCancel={() => setShowPricingModal(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
