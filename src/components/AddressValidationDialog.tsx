"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  LocationOn,
  Save,
} from '@mui/icons-material';
import AddressAutocomplete from './AddressAutocomplete';
import { AddressSuggestion } from '@/lib/address-autocomplete';

interface AddressValidationDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (address: string) => void;
  currentAddress?: string;
  title?: string;
  description?: string;
}

export default function AddressValidationDialog({
  open,
  onClose,
  onSave,
  currentAddress = '',
  title = 'Address Required',
  description = 'Please provide your address to continue using the application.',
}: AddressValidationDialogProps) {
  const [address, setAddress] = useState(currentAddress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setAddress(currentAddress);
      setError('');
    }
  }, [open, currentAddress]);

  const handleSave = async () => {
    if (!address.trim()) {
      setError('Please enter a valid address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSave(address.trim());
      onClose();
    } catch (err) {
      setError('Failed to save address. Please try again.');
      console.error('Address save error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    setAddress(suggestion.formatted_address);
    setError('');
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    if (error) {
      setError('');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationOn color="primary" />
          <Typography variant="h6">{title}</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {description}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <AddressAutocomplete
          value={address}
          onChange={handleAddressChange}
          onSelect={handleAddressSelect}
          label="Your Address"
          placeholder="Enter your full address..."
          error={!!error}
          helperText="This address will be used as the default for your moving estimates"
          required
        />
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          disabled={loading || !address.trim()}
        >
          {loading ? 'Saving...' : 'Save Address'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
