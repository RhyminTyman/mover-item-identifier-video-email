"use client";

import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Chip,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { Inventory as InventoryIcon } from '@mui/icons-material';
import { useItemAutocomplete, ItemSuggestion } from '@/hooks/useItemAutocomplete';

interface ItemAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: ItemSuggestion) => void;
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
  showInventoryIcon?: boolean;
  className?: string;
}

export default function ItemAutocomplete({
  value,
  onChange,
  onSelect,
  label = 'Item Name',
  placeholder = 'Type to search for items...',
  error = false,
  helperText,
  disabled = false,
  required = false,
  fullWidth = true,
  variant = 'outlined',
  margin = 'normal',
  size = 'medium',
  showInventoryIcon = true,
  className,
}: ItemAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const { suggestions, loading, getSuggestions, clearSuggestions } = useItemAutocomplete();

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle input change with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputValue && inputValue.length >= 2) {
        console.log('🔍 ItemAutocomplete: Getting suggestions for:', inputValue);
        getSuggestions(inputValue);
      } else {
        clearSuggestions();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, getSuggestions, clearSuggestions]);

  const handleInputChange = (event: React.SyntheticEvent, newInputValue: string) => {
    setInputValue(newInputValue);
    onChange(newInputValue);
  };

  const handleChange = (event: React.SyntheticEvent, newValue: string | ItemSuggestion | null) => {
    if (newValue && typeof newValue === 'object') {
      console.log('Item selected:', newValue);
      setInputValue(newValue.name);
      onChange(newValue.name);
      
      if (onSelect) {
        onSelect(newValue);
      }
    } else {
      setInputValue('');
      onChange('');
    }
  };

  const getOptionLabel = (option: ItemSuggestion | string) => {
    if (typeof option === 'string') {
      return option;
    }
    return option.name;
  };

  const isOptionEqualToValue = (option: ItemSuggestion, value: ItemSuggestion) => {
    return option.id === value.id;
  };

  const renderOption = (props: React.HTMLAttributes<HTMLLIElement>, option: ItemSuggestion) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    const { key, ...otherProps } = props as any;
    return (
      <Box component="li" {...otherProps}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <InventoryIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              {option.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Chip
                label={`${option.cubicFeet} CF`}
                size="small"
                color="primary"
                variant="outlined"
              />
              {option.handlingCharge && (
                <Chip
                  label={`$${option.handlingCharge}`}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
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
            startAdornment: showInventoryIcon ? (
              <InputAdornment position="start">
                <InventoryIcon color="action" />
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
      noOptionsText={inputValue.length >= 2 ? "No items found" : "Type at least 2 characters to search"}
      loadingText="Searching items..."
    />
  );
}
