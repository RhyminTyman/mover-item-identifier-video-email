"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  FormHelperText,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';

interface State {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface AddressData {
  street1: string;
  street2?: string;
  city: string;
  stateId: string;
  zipCode: string;
  country?: string;
}

interface AddressFormProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  onSelect?: (address: AddressData) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
  margin?: 'none' | 'dense' | 'normal';
  size?: 'small' | 'medium';
  showCountry?: boolean;
  className?: string;
}

export default function AddressForm({
  value,
  onChange,
  onSelect,
  label = 'Address',
  error = false,
  helperText,
  disabled = false,
  required = false,
  fullWidth = true, // eslint-disable-line @typescript-eslint/no-unused-vars
  variant = 'outlined',
  margin = 'normal',
  size = 'medium',
  showCountry = false,
  className,
}: AddressFormProps) {
  const [localValue, setLocalValue] = useState<AddressData>(value);

  // Fetch states from API
  const { data: states = [], isLoading: statesLoading } = useQuery({
    queryKey: ['states'],
    queryFn: async (): Promise<State[]> => {
      const response = await fetch('/api/states');
      if (!response.ok) {
        throw new Error('Failed to fetch states');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleFieldChange = (field: keyof AddressData) => (event: React.ChangeEvent<HTMLInputElement> | { target: { value: string } }) => {
    const newValue = {
      ...localValue,
      [field]: event.target.value,
    };
    setLocalValue(newValue);
    onChange(newValue);
    
    if (onSelect) {
      onSelect(newValue);
    }
  };

  const handleStateChange = (event: { target: { value: string } }) => {
    const newValue = {
      ...localValue,
      stateId: event.target.value,
    };
    setLocalValue(newValue);
    onChange(newValue);
    
    if (onSelect) {
      onSelect(newValue);
    }
  };

  // Group states by type for better organization
  const groupedStates = states.reduce((acc, state) => {
    if (!acc[state.type]) {
      acc[state.type] = [];
    }
    acc[state.type].push(state);
    return acc;
  }, {} as Record<string, State[]>);

  const getStateTypeLabel = (type: string) => {
    switch (type) {
      case 'state': return 'States';
      case 'territory': return 'Territories';
      case 'military': return 'Military';
      default: return type;
    }
  };

  return (
    <Box className={className}>
      {label && (
        <Typography variant="subtitle2" gutterBottom>
          {label}
        </Typography>
      )}
      
      <Grid container spacing={2}>
        {/* Street Address 1 */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Street Address 1"
            value={localValue.street1}
            onChange={handleFieldChange('street1')}
            error={error}
            disabled={disabled}
            required={required}
            variant={variant}
            margin={margin}
            size={size}
            placeholder="123 Main Street"
          />
        </Grid>

        {/* Street Address 2 */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Street Address 2 (Optional)"
            value={localValue.street2 || ''}
            onChange={handleFieldChange('street2')}
            error={error}
            disabled={disabled}
            variant={variant}
            margin={margin}
            size={size}
            placeholder="Apt 4B, Suite 200, etc."
          />
        </Grid>

        {/* City */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="City"
            value={localValue.city}
            onChange={handleFieldChange('city')}
            error={error}
            disabled={disabled}
            required={required}
            variant={variant}
            margin={margin}
            size={size}
            placeholder="New York"
          />
        </Grid>

        {/* State */}
        <Grid item xs={12} sm={3}>
          <FormControl
            fullWidth
            error={error}
            disabled={disabled || statesLoading}
            required={required}
            variant={variant}
            margin={margin}
            size={size}
          >
            <InputLabel>State</InputLabel>
            <Select
              value={localValue.stateId}
              onChange={handleStateChange}
              label="State"
            >
              {Object.entries(groupedStates).map(([type, statesInType]) => (
                <Box key={type}>
                  <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 'bold', color: 'text.secondary' }}>
                    {getStateTypeLabel(type)}
                  </Typography>
                  {statesInType.map((state) => (
                    <MenuItem key={state.id} value={state.id}>
                      {state.name} ({state.code})
                    </MenuItem>
                  ))}
                </Box>
              ))}
            </Select>
            {error && <FormHelperText>Please select a state</FormHelperText>}
          </FormControl>
        </Grid>

        {/* ZIP Code */}
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="ZIP Code"
            value={localValue.zipCode}
            onChange={handleFieldChange('zipCode')}
            error={error}
            disabled={disabled}
            required={required}
            variant={variant}
            margin={margin}
            size={size}
            placeholder="10001"
            inputProps={{ maxLength: 10 }}
          />
        </Grid>

        {/* Country (optional) */}
        {showCountry && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Country"
              value={localValue.country || 'US'}
              onChange={handleFieldChange('country')}
              error={error}
              disabled={disabled}
              variant={variant}
              margin={margin}
              size={size}
              placeholder="United States"
            />
          </Grid>
        )}
      </Grid>

      {helperText && (
        <FormHelperText error={error} sx={{ mt: 1 }}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
}
