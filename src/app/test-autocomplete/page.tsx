"use client";

import React, { useState } from 'react';
import { Box, Typography, Paper, Container } from '@mui/material';
import AddressForm from '@/components/AddressForm';

interface AddressData {
  street1: string;
  street2?: string;
  city: string;
  stateId: string;
  zipCode: string;
  country?: string;
}

export default function TestAutocompletePage() {
  const [address, setAddress] = useState<AddressData>({
    street1: '',
    street2: '',
    city: '',
    stateId: '',
    zipCode: '',
    country: 'US',
  });

  const handleAddressChange = (newAddress: AddressData) => {
    setAddress(newAddress);
    console.log('Address changed:', newAddress);
  };

  const handleAddressSelect = (newAddress: AddressData) => {
    setAddress(newAddress);
    console.log('Address selected:', newAddress);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Address Autocomplete Test
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Address Form
        </Typography>
        <AddressForm
          value={address}
          onChange={handleAddressChange}
          onSelect={handleAddressSelect}
          label="Test Address"
          required
        />
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Current Address Data
        </Typography>
        <Box component="pre" sx={{ 
          backgroundColor: 'grey.100', 
          p: 2, 
          borderRadius: 1,
          overflow: 'auto',
          fontSize: '0.875rem'
        }}>
          {JSON.stringify(address, null, 2)}
        </Box>
      </Paper>
    </Container>
  );
}
