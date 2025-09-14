"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import { setCustomerId } from "@/app/actions/state-actions";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface CustomerSelectorProps {
  currentCustomerId?: string | null;
}

export function CustomerSelector({ currentCustomerId }: CustomerSelectorProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch("/api/customers");
      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }
      const data = await response.json();
      setCustomers(data);
      
      // Set selected customer if currentCustomerId is provided
      if (currentCustomerId) {
        const customer = data.find((c: Customer) => c.id === currentCustomerId);
        if (customer) {
          setSelectedCustomer(customer);
        }
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError(err instanceof Error ? err.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [currentCustomerId]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCustomerChange = async (customer: Customer | null) => {
    setSelectedCustomer(customer);
    await setCustomerId(customer?.id || null);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <CircularProgress size={20} />
        <Typography variant="body2">Loading customers...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Select Customer
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Choose the customer for this inventory. Leave empty to create for yourself.
      </Typography>
      
      <Autocomplete
        options={customers}
        value={selectedCustomer}
        onChange={(_, newValue) => handleCustomerChange(newValue)}
        getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Customer"
            placeholder="Search for a customer..."
            variant="outlined"
          />
        )}
        renderOption={(props, option) => {
          const { key, ...otherProps } = props;
          return (
            <Box component="li" key={key} {...otherProps}>
            <Box>
              <Typography variant="body1">
                {option.firstName} {option.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {option.email}
              </Typography>
            </Box>
          </Box>
          );
        }}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option.id}
              label={`${option.firstName} ${option.lastName}`}
              variant="outlined"
            />
          ))
        }
        clearOnEscape
        clearText="Clear selection"
        noOptionsText="No customers found"
      />
      
      {selectedCustomer && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Creating inventory for: <strong>{selectedCustomer.firstName} {selectedCustomer.lastName}</strong>
          </Typography>
        </Box>
      )}
    </Box>
  );
}
