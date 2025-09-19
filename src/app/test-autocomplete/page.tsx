"use client";

import React, { useState } from 'react';
import { Box, Typography, Paper, Container, Grid } from '@mui/material';
import ItemAutocomplete from '@/components/ItemAutocomplete';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { ItemSuggestion } from '@/hooks/useItemAutocomplete';
import { AddressSuggestion } from '@/lib/address-autocomplete';
import { SimpleAddressSuggestion } from '@/lib/simple-address-autocomplete';

export default function TestAutocompletePage() {
  const [selectedItem, setSelectedItem] = useState<ItemSuggestion | null>(null);
  const [itemName, setItemName] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | SimpleAddressSuggestion | null>(null);
  const [address, setAddress] = useState('');

  const handleItemSelect = (suggestion: ItemSuggestion) => {
    setSelectedItem(suggestion);
    console.log('Item selected:', suggestion);
  };

  const handleItemChange = (value: string) => {
    setItemName(value);
    console.log('Item name changed:', value);
  };

  const handleAddressSelect = (suggestion: AddressSuggestion | SimpleAddressSuggestion) => {
    setSelectedAddress(suggestion);
    console.log('Address selected:', suggestion);
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    console.log('Address changed:', value);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Autocomplete Test Page
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Item Autocomplete
            </Typography>
            <ItemAutocomplete
              value={itemName}
              onChange={handleItemChange}
              onSelect={handleItemSelect}
              label="Item Name"
              placeholder="Type 'bed' to test..."
            />
            
            {selectedItem && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Item:
                </Typography>
                <Typography variant="body2">
                  <strong>Name:</strong> {selectedItem.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Cubic Feet:</strong> {selectedItem.cubicFeet} CF
                </Typography>
                {selectedItem.handlingCharge && (
                  <Typography variant="body2">
                    <strong>Handling Charge:</strong> ${selectedItem.handlingCharge}
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Address Autocomplete
            </Typography>
            <AddressAutocomplete
              value={address}
              onChange={handleAddressChange}
              onSelect={handleAddressSelect}
              label="Address"
              placeholder="Type an address to test..."
            />
            
            {selectedAddress && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Address:
                </Typography>
                <Typography variant="body2">
                  {selectedAddress.formatted_address}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Debug Info
        </Typography>
        <Box component="pre" sx={{ 
          backgroundColor: 'grey.100', 
          p: 2, 
          borderRadius: 1,
          overflow: 'auto',
          fontSize: '0.875rem'
        }}>
          {JSON.stringify({
            itemName,
            selectedItem,
            address,
            selectedAddress,
            timestamp: new Date().toISOString()
          }, null, 2)}
        </Box>
      </Paper>
    </Container>
  );
}