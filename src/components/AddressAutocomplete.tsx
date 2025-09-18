"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Box,
  Typography,
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
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
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
    const timeoutId = setTimeout(() => {
      if (inputValue !== value) {
        // Try Google suggestions first, then fallback to simple suggestions
        getGoogleSuggestions(inputValue);
        getSimpleSuggestions(inputValue);
        setIsOpen(inputValue.length >= 3);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, value, getGoogleSuggestions, getSimpleSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        listRef.current &&
        !listRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        clearGoogleSuggestions();
        clearSimpleSuggestions();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clearGoogleSuggestions, clearSimpleSuggestions]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion | SimpleAddressSuggestion) => {
    setInputValue(suggestion.formatted_address);
    onChange(suggestion.formatted_address);
    setIsOpen(false);
    clearGoogleSuggestions();
    clearSimpleSuggestions();
    
    if (onSelect) {
      onSelect(suggestion);
    }
  };

  const handleInputFocus = () => {
    if (inputValue.length >= 3) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow suggestion clicks
    setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      clearGoogleSuggestions();
      clearSimpleSuggestions();
    }
  };

  return (
    <Box className={className} position="relative">
      <TextField
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        label={label}
        placeholder={placeholder}
        error={error}
        helperText={helperText}
        disabled={disabled}
        required={required}
        fullWidth={fullWidth}
        variant={variant}
        margin={margin}
        size={size}
        InputProps={{
          startAdornment: showLocationIcon ? (
            <InputAdornment position="start">
              <LocationOn color="action" />
            </InputAdornment>
          ) : undefined,
          endAdornment: loading ? (
            <InputAdornment position="end">
              <CircularProgress size={20} />
            </InputAdornment>
          ) : undefined,
        }}
      />
      
      {isOpen && suggestions.length > 0 && (
        <Paper
          ref={listRef}
          elevation={3}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: 300,
            overflow: 'auto',
            mt: 0.5,
          }}
        >
          <List dense>
            {suggestions.map((suggestion, index) => (
              <ListItem
                key={suggestion.place_id || index}
                component="div"
                onClick={() => handleSuggestionClick(suggestion)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                <ListItemText
                  primary={suggestion.formatted_address}
                  primaryTypographyProps={{
                    variant: 'body2',
                    noWrap: true,
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
      
      {isOpen && !loading && suggestions.length === 0 && inputValue.length >= 3 && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            mt: 0.5,
            p: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary" textAlign="center">
            No addresses found
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
