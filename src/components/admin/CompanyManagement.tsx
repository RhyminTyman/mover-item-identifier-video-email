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
  Divider
} from '@mui/material';
import {
  Business,
  LocationOn,
  Phone,
  Email,
  Language,
  Refresh
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
  const [snackbarMessage] = useState('');
  const [actionLoading] = useState<string | null>(null);

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
                  <Box display="flex" alignItems="center" mb={2}>
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

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}
