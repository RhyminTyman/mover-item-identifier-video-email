"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import AddressValidationDialog from './AddressValidationDialog';

interface CustomerAddressValidationProps {
  userRole: string;
  onAddressSaved?: () => void;
}

export default function CustomerAddressValidation({ 
  userRole, 
  onAddressSaved 
}: CustomerAddressValidationProps) {
  const { user } = useUser();
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [hasAddress, setHasAddress] = useState<boolean | null>(null);

  useEffect(() => {
    // Only show address validation for customers
    if (userRole === 'customer' && user) {
      // Check if user has address in their metadata
      const userAddress = user.unsafeMetadata?.address as string;
      if (!userAddress || userAddress.trim() === '') {
        setShowAddressDialog(true);
        setHasAddress(false);
      } else {
        setHasAddress(true);
      }
    }
  }, [userRole, user]);

  const handleAddressSave = async (address: string) => {
    try {
      if (user) {
        // Update user's public metadata with address
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            address: address
          }
        });
        
        setHasAddress(true);
        setShowAddressDialog(false);
        
        if (onAddressSaved) {
          onAddressSaved();
        }
      }
    } catch (error) {
      console.error('Failed to save address:', error);
      // You might want to show an error message to the user
    }
  };

  const handleDialogClose = () => {
    // Don't allow closing without address for customers
    if (userRole === 'customer' && !hasAddress) {
      return;
    }
    setShowAddressDialog(false);
  };

  // Don't render anything if not a customer or if address is already saved
  if (userRole !== 'customer' || hasAddress === true) {
    return null;
  }

  return (
    <AddressValidationDialog
      open={showAddressDialog}
      onClose={handleDialogClose}
      onSave={handleAddressSave}
      title="Welcome! Please Add Your Address"
      description="To provide you with accurate moving estimates, we need your address information. This will help us calculate distances and provide better pricing."
    />
  );
}
