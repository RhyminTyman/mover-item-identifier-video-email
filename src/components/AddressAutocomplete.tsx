"use client";

import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  LocationOn,
} from '@mui/icons-material';
import { useAddressAutocomplete, AddressSuggestion } from '@/lib/address-autocomplete';
import { useSimpleAddressAutocomplete, SimpleAddressSuggestion } from '@/lib/simple-address-autocomplete';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: AddressSuggestion | SimpleAddressSuggestion) => void;
  label?: string;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
  margin?: 'none' | 'dense' | 'normal';
  size?: 'small' | 'medium';
  showLocationIcon?: boolean;
  className?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  label = 'Address',
  placeholder = 'Enter address...',
  error = false,
  helperText,
  disabled = false,
  required = false,
  fullWidth = true,
  variant = 'outlined',
  margin = 'normal',
  size = 'medium',
  showLocationIcon = true,
  className,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  
  const { suggestions: googleSuggestions, loading: googleLoading, getSuggestions: getGoogleSuggestions, clearSuggestions: clearGoogleSuggestions } = useAddressAutocomplete();
  const { suggestions: simpleSuggestions, loading: simpleLoading, getSuggestions: getSimpleSuggestions, clearSuggestions: clearSimpleSuggestions } = useSimpleAddressAutocomplete();
  
  // Use Google suggestions if available, otherwise use simple suggestions
  const suggestions = googleSuggestions.length > 0 ? googleSuggestions : simpleSuggestions;
  const loading = googleLoading || simpleLoading;

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle input change with debouncing
  useEffect(() => {
    console.log('🔍 AddressAutocomplete useEffect triggered with inputValue:', inputValue);
    const timeoutId = setTimeout(() => {
      if (inputValue && inputValue.length >= 3) {
        console.log('🔍 AddressAutocomplete: Getting suggestions for:', inputValue);
        console.log('🔍 AddressAutocomplete: Calling getGoogleSuggestions and getSimpleSuggestions');
        // Try Google suggestions first, then fallback to simple suggestions
        getGoogleSuggestions(inputValue);
        getSimpleSuggestions(inputValue);
      } else {
        console.log('🔍 AddressAutocomplete: Clearing suggestions, input too short');
        clearGoogleSuggestions();
        clearSimpleSuggestions();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, getGoogleSuggestions, getSimpleSuggestions, clearGoogleSuggestions, clearSimpleSuggestions]);

  const handleInputChange = (event: React.SyntheticEvent, newInputValue: string) => {
    setInputValue(newInputValue);
    onChange(newInputValue);
  };

  const handleChange = (event: React.SyntheticEvent, newValue: string | AddressSuggestion | SimpleAddressSuggestion | null) => {
    if (newValue && typeof newValue === 'object') {
      setInputValue(newValue.formatted_address);
      onChange(newValue.formatted_address);
      
      if (onSelect) {
        onSelect(newValue);
      }
    } else {
      setInputValue('');
      onChange('');
    }
  };

  const getOptionLabel = (option: AddressSuggestion | SimpleAddressSuggestion | string) => {
    if (typeof option === 'string') {
      return option;
    }
    return option.formatted_address;
  };

  const isOptionEqualToValue = (option: AddressSuggestion | SimpleAddressSuggestion, value: AddressSuggestion | SimpleAddressSuggestion) => {
    return option.place_id === value.place_id;
  };

  const renderOption = (props: React.HTMLAttributes<HTMLLIElement>, option: AddressSuggestion | SimpleAddressSuggestion) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    const { key, ...otherProps } = props as any;
    return (
      <Box component="li" {...otherProps}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <LocationOn sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
          <Typography variant="body2" noWrap>
            {option.formatted_address}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Autocomplete
      className={className}
      freeSolo
      options={suggestions}
      value={value}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={handleChange}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}
      renderOption={renderOption}
      loading={loading}
      disabled={disabled}
      fullWidth={fullWidth}
      size={size}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          required={required}
          variant={variant}
          margin={margin}
          InputProps={{
            ...params.InputProps,
            startAdornment: showLocationIcon ? (
              <InputAdornment position="start">
                <LocationOn color="action" />
              </InputAdornment>
            ) : params.InputProps.startAdornment,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      noOptionsText={inputValue.length >= 3 ? "No addresses found" : "Type at least 3 characters to search"}
      loadingText="Searching addresses..."
    />
  );
}
