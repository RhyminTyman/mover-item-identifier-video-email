"use client";

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Stack,
  Alert,
  CircularProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Business,
  LocationOn,
  Phone,
  Email,
  Language,
  Edit,
  Save,
  Cancel,
  People
} from '@mui/icons-material';

interface Company {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  website?: string;
  baseCostPerHour: number;
  costPerMile: number;
  costPerCubicFoot: number;
  costPerPound: number;
  stairCostPerFlight: number;
  packingCostPerBox: number;
  unpackingCostPerBox: number;
  disposalCost: number;
  storageCostPerDay: number;
  rushServiceMultiplier: number;
  taxRate: number;
  users: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isActive: boolean;
  }>;
}

export default function CompanyInfo() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Company>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/company-admin/company');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch company');
      }
      
      const data = await response.json();
      setCompany(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch company');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  const handleEditCompany = () => {
    if (company) {
      setEditForm({
        name: company.name,
        address: company.address,
        city: company.city,
        state: company.state,
        zipCode: company.zipCode,
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
        baseCostPerHour: company.baseCostPerHour,
        costPerMile: company.costPerMile,
        costPerCubicFoot: company.costPerCubicFoot,
        costPerPound: company.costPerPound,
        stairCostPerFlight: company.stairCostPerFlight,
        packingCostPerBox: company.packingCostPerBox,
        unpackingCostPerBox: company.unpackingCostPerBox,
        disposalCost: company.disposalCost,
        storageCostPerDay: company.storageCostPerDay,
        rushServiceMultiplier: company.rushServiceMultiplier,
        taxRate: company.taxRate
      });
      setEditDialogOpen(true);
    }
  };

  const handleSaveCompany = async () => {
    try {
      setActionLoading('save');
      const response = await fetch('/api/company-admin/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update company');
      }

      setSnackbarMessage('Company updated successfully!');
      setSnackbarOpen(true);
      setEditDialogOpen(false);
      fetchCompany(); // Refresh the data
    } catch (err) {
      setSnackbarMessage(err instanceof Error ? err.message : 'Failed to update company');
      setSnackbarOpen(true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFormChange = (field: string, value: string | number) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
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

  if (!company) {
    return (
      <Alert severity="warning">
        No company information found.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Company Information
        </Typography>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={handleEditCompany}
        >
          Edit Company
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Company Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <Business sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h5" component="h2">
                    {company.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Company Details
                  </Typography>
                </Box>
              </Box>

              <Stack spacing={2}>
                <Box display="flex" alignItems="center">
                  <LocationOn sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                  <Typography>
                    {company.address}, {company.city}, {company.state} {company.zipCode}
                  </Typography>
                </Box>
                
                {company.phone && (
                  <Box display="flex" alignItems="center">
                    <Phone sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                    <Typography>{company.phone}</Typography>
                  </Box>
                )}
                
                {company.email && (
                  <Box display="flex" alignItems="center">
                    <Email sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                    <Typography>{company.email}</Typography>
                  </Box>
                )}
                
                {company.website && (
                  <Box display="flex" alignItems="center">
                    <Language sx={{ fontSize: 20, mr: 2, color: 'text.secondary' }} />
                    <Typography>{company.website}</Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Pricing Settings */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pricing Settings
              </Typography>
              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Base Rate:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(company.baseCostPerHour)}/hr
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Per Mile:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(company.costPerMile)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Per Cubic Ft:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(company.costPerCubicFoot)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Tax Rate:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {company.taxRate}%
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Company Users */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <People sx={{ fontSize: 24, mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Company Users ({company.users.length})
                </Typography>
              </Box>
              <Grid container spacing={2}>
                {company.users.map((user) => (
                  <Grid item xs={12} sm={6} md={4} key={user.id}>
                    <Box 
                      sx={{ 
                        p: 2, 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1,
                        backgroundColor: user.isActive ? 'background.paper' : 'grey.100'
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight="bold">
                        {user.firstName} {user.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                      <Typography variant="caption" color={user.isActive ? 'success.main' : 'error.main'}>
                        {user.role} • {user.isActive ? 'Active' : 'Inactive'}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Company Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Company Information</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company Name"
                value={editForm.name || ''}
                onChange={(e) => handleFormChange('name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={editForm.address || ''}
                onChange={(e) => handleFormChange('address', e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="City"
                value={editForm.city || ''}
                onChange={(e) => handleFormChange('city', e.target.value)}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="State"
                value={editForm.state || ''}
                onChange={(e) => handleFormChange('state', e.target.value)}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Zip Code"
                value={editForm.zipCode || ''}
                onChange={(e) => handleFormChange('zipCode', e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Phone"
                value={editForm.phone || ''}
                onChange={(e) => handleFormChange('phone', e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editForm.email || ''}
                onChange={(e) => handleFormChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Website"
                value={editForm.website || ''}
                onChange={(e) => handleFormChange('website', e.target.value)}
              />
            </Grid>

            {/* Pricing Settings */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Pricing Settings
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Base Cost Per Hour"
                type="number"
                value={editForm.baseCostPerHour || ''}
                onChange={(e) => handleFormChange('baseCostPerHour', parseFloat(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Cost Per Mile"
                type="number"
                value={editForm.costPerMile || ''}
                onChange={(e) => handleFormChange('costPerMile', parseFloat(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Cost Per Cubic Foot"
                type="number"
                value={editForm.costPerCubicFoot || ''}
                onChange={(e) => handleFormChange('costPerCubicFoot', parseFloat(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Tax Rate (%)"
                type="number"
                value={editForm.taxRate || ''}
                onChange={(e) => handleFormChange('taxRate', parseFloat(e.target.value) || 0)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveCompany}
            variant="contained"
            startIcon={<Save />}
            disabled={actionLoading === 'save'}
          >
            {actionLoading === 'save' ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}
