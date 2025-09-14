"use client";

import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  AlertTitle,
  Grid,
  Avatar,
  Divider
} from '@mui/material';
import {
  Assignment,
  Person,
  CheckCircle,
  AttachMoney,
  Done,
  Schedule
} from '@mui/icons-material';

interface WorkflowStatusProps {
  currentStatus: string;
  assignedSalesRep?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedAt?: string;
  verifiedAt?: string;
  quotedAt?: string;
  acceptedAt?: string;
  onStatusChange?: (newStatus: string) => void;
  isSalesRep?: boolean;
  isCustomer?: boolean;
}

interface StatusStep {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType;
  color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

const statusSteps: StatusStep[] = [
  {
    id: 'submitted',
    label: 'Submitted',
    description: 'Customer has submitted their inventory for review',
    icon: Assignment,
    color: 'info'
  },
  {
    id: 'assigned',
    label: 'Assigned',
    description: 'Inventory has been assigned to a sales representative',
    icon: Person,
    color: 'primary'
  },
  {
    id: 'verified',
    label: 'Verified',
    description: 'Sales rep has verified items and dimensions on-site',
    icon: CheckCircle,
    color: 'success'
  },
  {
    id: 'quoted',
    label: 'Quoted',
    description: 'Final quote has been provided to customer',
    icon: AttachMoney,
    color: 'warning'
  },
  {
    id: 'accepted',
    label: 'Accepted',
    description: 'Customer has accepted the final quote',
    icon: Done,
    color: 'success'
  }
];

export default function WorkflowStatus({
  currentStatus,
  assignedSalesRep,
  assignedAt,
  verifiedAt,
  quotedAt,
  acceptedAt,
  onStatusChange,
  isSalesRep = false,
  isCustomer = false
}: WorkflowStatusProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(step => step.id === currentStatus);
  };

  const getStepStatus = (stepId: string, stepIndex: number) => {
    const currentIndex = getCurrentStepIndex();
    
    if (stepIndex < currentIndex) {
      return 'completed';
    } else if (stepIndex === currentIndex) {
      return 'active';
    } else {
      return 'pending';
    }
  };

  const getTimestamp = (status: string) => {
    switch (status) {
      case 'assigned':
        return assignedAt;
      case 'verified':
        return verifiedAt;
      case 'quoted':
        return quotedAt;
      case 'accepted':
        return acceptedAt;
      default:
        return null;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!onStatusChange) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await onStatusChange(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const canAdvanceStatus = (stepId: string) => {
    if (!isSalesRep) return false;
    
    const currentIndex = getCurrentStepIndex();
    const stepIndex = statusSteps.findIndex(step => step.id === stepId);
    
    // Can only advance to the next step
    return stepIndex === currentIndex + 1;
  };

  const getStatusChip = (status: string) => {
    const step = statusSteps.find(s => s.id === status);
    if (!step) return null;

    const Icon = step.icon;
    return (
      <Chip
        icon={<Icon />}
        label={step.label}
        color={step.color}
        variant={status === currentStatus ? 'filled' : 'outlined'}
        size="small"
      />
    );
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Workflow Status
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}

        {/* Current Status Summary */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Typography variant="subtitle2" color="text.secondary">
                Current Status
              </Typography>
              {getStatusChip(currentStatus)}
            </Grid>
            
            {assignedSalesRep && (
              <>
                <Grid item>
                  <Divider orientation="vertical" flexItem />
                </Grid>
                <Grid item>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Assigned Sales Rep
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      {assignedSalesRep.firstName[0]}{assignedSalesRep.lastName[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">
                        {assignedSalesRep.firstName} {assignedSalesRep.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {assignedSalesRep.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </>
            )}
          </Grid>
        </Box>

        {/* Workflow Steps */}
        <Stepper activeStep={getCurrentStepIndex()} orientation="vertical">
          {statusSteps.map((step, index) => {
            const stepStatus = getStepStatus(step.id, index);
            const timestamp = getTimestamp(step.id);
            const Icon = step.icon;
            const canAdvance = canAdvanceStatus(step.id);

            return (
              <Step key={step.id} completed={stepStatus === 'completed'}>
                <StepLabel
                  icon={
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: stepStatus === 'completed'
                          ? 'success.main'
                          : stepStatus === 'active'
                          ? 'primary.main'
                          : 'grey.300',
                        color: stepStatus === 'completed' || stepStatus === 'active' ? 'white' : 'grey.500',
                      }}
                    >
                      <Icon />
                    </Box>
                  }
                >
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: stepStatus === 'active' ? 'bold' : 'normal' }}>
                      {step.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                    {timestamp && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <Schedule fontSize="small" />
                        {new Date(timestamp).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                </StepLabel>
                
                <StepContent>
                  {canAdvance && (
                    <Box sx={{ mb: 2 }}>
                      <Button
                        variant="contained"
                        onClick={() => handleStatusChange(step.id)}
                        disabled={loading}
                        startIcon={<Icon />}
                        size="small"
                      >
                        Mark as {step.label}
                      </Button>
                    </Box>
                  )}
                  
                  {isCustomer && step.id === 'quoted' && currentStatus === 'quoted' && (
                    <Box sx={{ mb: 2 }}>
                      <Alert severity="info">
                        <AlertTitle>Quote Ready</AlertTitle>
                        Your final quote has been prepared. Please review and accept or request changes.
                      </Alert>
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => handleStatusChange('accepted')}
                          disabled={loading}
                        >
                          Accept Quote
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleStatusChange('rejected')}
                          disabled={loading}
                        >
                          Request Changes
                        </Button>
                      </Box>
                    </Box>
                  )}
                </StepContent>
              </Step>
            );
          })}
        </Stepper>

        {/* Additional Actions */}
        {isSalesRep && currentStatus === 'assigned' && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2" color="info.contrastText">
              <strong>Next Steps:</strong> Schedule a site visit to verify the inventory items and dimensions. 
              Use the edit functionality to correct any AI-estimated dimensions.
            </Typography>
          </Box>
        )}

        {isCustomer && currentStatus === 'submitted' && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
            <Typography variant="body2" color="success.contrastText">
              <strong>Thank you!</strong> Your inventory has been submitted successfully. 
              A sales representative will contact you within 24 hours to schedule a site visit.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
