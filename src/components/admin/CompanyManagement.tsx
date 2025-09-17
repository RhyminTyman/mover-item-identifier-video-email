"use client";

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Snackbar,
  CircularProgress,
  Stack,
  Alert,
  Grid,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Business,
  LocationOn,
  Phone,
  Email,
  Language,
  Refresh,
  Edit,
  Save,
  Cancel
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
  createdAt: string;
  updatedAt: string;
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
  _count: {
    users: number;
    inventories: number;
  };
}

export default function CompanyManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editForm, setEditForm] = useState<Partial<Company>>({});
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/companies');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch companies');
      }
      
      const data = await response.json();
      setCompanies(data.companies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleRefresh = () => {
    fetchCompanies();
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
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
    setDialogOpen(true);
  };

  const handleSaveCompany = async () => {
    if (!editingCompany) return;

    try {
      setActionLoading('save');
      const response = await fetch(`/api/admin/companies/${editingCompany.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update company');
      }

      setSnackbarMessage('Company updated successfully!');
      setSnackbarOpen(true);
      setDialogOpen(false);
      fetchCompanies(); // Refresh the list
    } catch (err) {
      setSnackbarMessage(err instanceof Error ? err.message : 'Failed to update company');
      setSnackbarOpen(true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelEdit = () => {
    setDialogOpen(false);
    setEditingCompany(null);
    setEditForm({});
  };

  const handleFormChange = (field: string, value: string | number) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'company-admin': return 'secondary';
      case 'sales': return 'warning';
      case 'customer': return 'info';
      default: return 'default';
    }
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
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={handleRefresh} startIcon={<Refresh />}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Company Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={actionLoading === 'refresh'}
        >
          Refresh
        </Button>
      </Box>

      {companies.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Companies Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Companies will appear here when company admins are invited.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {companies.map((company) => (
            <Grid item xs={12} md={6} lg={4} key={company.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        <Business />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" component="h2">
                          {company.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Created {new Date(company.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    <Tooltip title="Edit Company">
                      <IconButton
                        onClick={() => handleEditCompany(company)}
                        color="primary"
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Stack spacing={1} mb={2}>
                    <Box display="flex" alignItems="center">
                      <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {company.address}, {company.city}, {company.state} {company.zipCode}
                      </Typography>
                    </Box>
                    
                    {company.phone && (
                      <Box display="flex" alignItems="center">
                        <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">{company.phone}</Typography>
                      </Box>
                    )}
                    
                    {company.email && (
                      <Box display="flex" alignItems="center">
                        <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">{company.email}</Typography>
                      </Box>
                    )}
                    
                    {company.website && (
                      <Box display="flex" alignItems="center">
                        <Language sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">{company.website}</Typography>
                      </Box>
                    )}
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2} mb={2}>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h6" color="primary">
                          {company._count.users}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Users
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h6" color="primary">
                          {company._count.inventories}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Inventories
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle2" gutterBottom>
                    Pricing Settings
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Base Rate: {formatCurrency(company.baseCostPerHour)}/hr
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Per Mile: {formatCurrency(company.costPerMile)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Per Cubic Ft: {formatCurrency(company.costPerCubicFoot)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Tax Rate: {company.taxRate}%
                      </Typography>
                    </Grid>
                  </Grid>

                  {company.users.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Company Users
                      </Typography>
                      <Stack spacing={1}>
                        {company.users.map((user) => (
                          <Box key={user.id} display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center">
                              <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'grey.300' }}>
                                {user.firstName[0]}{user.lastName[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="body2">
                                  {user.firstName} {user.lastName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {user.email}
                                </Typography>
                              </Box>
                            </Box>
                            <Chip
                              label={user.role}
                              size="small"
                              color={getRoleColor(user.role) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                              variant={user.isActive ? "filled" : "outlined"}
                            />
                          </Box>
                        ))}
                      </Stack>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Edit Company Dialog */}
      <Dialog open={dialogOpen} onClose={handleCancelEdit} maxWidth="md" fullWidth>
        <DialogTitle>
          Edit Company: {editingCompany?.name}
        </DialogTitle>
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
                label="Cost Per Pound"
                type="number"
                value={editForm.costPerPound || ''}
                onChange={(e) => handleFormChange('costPerPound', parseFloat(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Stair Cost Per Flight"
                type="number"
                value={editForm.stairCostPerFlight || ''}
                onChange={(e) => handleFormChange('stairCostPerFlight', parseFloat(e.target.value) || 0)}
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
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Packing Cost Per Box"
                type="number"
                value={editForm.packingCostPerBox || ''}
                onChange={(e) => handleFormChange('packingCostPerBox', parseFloat(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Unpacking Cost Per Box"
                type="number"
                value={editForm.unpackingCostPerBox || ''}
                onChange={(e) => handleFormChange('unpackingCostPerBox', parseFloat(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Disposal Cost"
                type="number"
                value={editForm.disposalCost || ''}
                onChange={(e) => handleFormChange('disposalCost', parseFloat(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Storage Cost Per Day"
                type="number"
                value={editForm.storageCostPerDay || ''}
                onChange={(e) => handleFormChange('storageCostPerDay', parseFloat(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rush Service Multiplier"
                type="number"
                value={editForm.rushServiceMultiplier || ''}
                onChange={(e) => handleFormChange('rushServiceMultiplier', parseFloat(e.target.value) || 0)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit} startIcon={<Cancel />}>
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
