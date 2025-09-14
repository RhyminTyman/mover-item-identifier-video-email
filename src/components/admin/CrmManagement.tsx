"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Add,
  Edit,
  Sync,
  CheckCircle,
  Error
} from '@mui/icons-material';

interface CrmIntegration {
  id: string;
  provider: string;
  name: string;
  description?: string;
  isActive: boolean;
  syncLeads: boolean;
  syncSales: boolean;
  syncSchedule: boolean;
  syncCustomers: boolean;
  lastSyncAt?: string;
  createdAt: string;
}

interface CrmLead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  status: string;
  priority: string;
  estimatedValue?: number;
  moveDate?: string;
  createdAt: string;
}

interface CrmSale {
  id: string;
  opportunityName: string;
  stage: string;
  probability?: number;
  estimatedValue?: number;
  actualValue?: number;
  expectedCloseDate?: string;
  createdAt: string;
}

interface CrmSchedule {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  type: string;
  status: string;
  location?: string;
  createdAt: string;
}

const CRM_PROVIDERS = [
  { value: 'smartmoving', label: 'SmartMoving', description: 'Popular moving company CRM with open API' },
  { value: 'moveguru', label: 'MoveGuru', description: 'Specialized CRM for moving companies' },
  { value: 'movingwaldo', label: 'MovingWaldo', description: 'Customer service focused CRM' },
  { value: 'movecrm', label: 'MoveCRM', description: 'All-in-one moving company solution' },
  { value: 'motiontools', label: 'MotionTools', description: 'Operations and dispatch focused' },
  { value: 'custom', label: 'Custom Integration', description: 'Connect to your own CRM system' }
];

// Removed unused constants LEAD_STATUSES and SALE_STAGES

export default function CrmManagement() {
  const [integrations, setIntegrations] = useState<CrmIntegration[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [sales, setSales] = useState<CrmSale[]>([]);
  const [schedules, setSchedules] = useState<CrmSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Form states
  const [formData, setFormData] = useState({
    provider: '',
    name: '',
    description: '',
    apiEndpoint: '',
    apiKey: '',
    apiSecret: '',
    webhookUrl: '',
    syncLeads: true,
    syncSales: true,
    syncSchedule: true,
    syncCustomers: true
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [integrationsRes, leadsRes, salesRes, schedulesRes] = await Promise.all([
        fetch('/api/admin/crm/integrations'),
        fetch('/api/admin/crm/leads'),
        fetch('/api/admin/crm/sales'),
        fetch('/api/admin/crm/schedules')
      ]);

      if (integrationsRes.ok) {
        const integrationsData = await integrationsRes.json();
        setIntegrations(integrationsData);
      }

      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeads(leadsData);
      }

      if (salesRes.ok) {
        const salesData = await salesRes.json();
        setSales(salesData);
      }

      if (schedulesRes.ok) {
        const schedulesData = await schedulesRes.json();
        setSchedules(schedulesData);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load CRM data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddIntegration = async () => {
    try {
      const response = await fetch('/api/admin/crm/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create CRM integration');
      }

      setSuccess('CRM integration created successfully!');
      setShowAddDialog(false);
      setFormData({
        provider: '',
        name: '',
        description: '',
        apiEndpoint: '',
        apiKey: '',
        apiSecret: '',
        webhookUrl: '',
        syncLeads: true,
        syncSales: true,
        syncSchedule: true,
        syncCustomers: true
      });
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create integration');
    }
  };

  const handleSyncIntegration = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/admin/crm/integrations/${integrationId}/sync`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to sync CRM integration');
      }

      setSuccess('CRM data synced successfully!');
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sync integration');
    }
  };

  const handleToggleIntegration = async (integrationId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/crm/integrations/${integrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (!response.ok) {
        throw new Error('Failed to update integration');
      }

      setSuccess(`Integration ${isActive ? 'activated' : 'deactivated'} successfully!`);
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update integration');
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: { [key: string]: 'success' | 'warning' | 'error' | 'info' | 'default' } = {
      'new': 'info',
      'contacted': 'info',
      'qualified': 'warning',
      'unqualified': 'error',
      'converted': 'success',
      'prospecting': 'info',
      'qualification': 'info',
      'proposal': 'warning',
      'negotiation': 'warning',
      'closed-won': 'success',
      'closed-lost': 'error',
      'scheduled': 'info',
      'completed': 'success',
      'cancelled': 'error',
      'rescheduled': 'warning'
    };
    return statusMap[status] || 'default';
  };

  const getPriorityColor = (priority: string) => {
    const priorityMap: { [key: string]: 'success' | 'warning' | 'error' } = {
      'low': 'success',
      'medium': 'warning',
      'high': 'error'
    };
    return priorityMap[priority] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        CRM Integration Management
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <AlertTitle>Success</AlertTitle>
          {success}
        </Alert>
      )}

      {/* CRM Integrations */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              CRM Integrations
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowAddDialog(true)}
            >
              Add Integration
            </Button>
          </Box>

          {integrations.length === 0 ? (
            <Alert severity="info">
              No CRM integrations configured. Add your first integration to start syncing leads, sales, and schedules.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {integrations.map((integration) => (
                <Grid item xs={12} md={6} key={integration.id}>
                  <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography variant="h6">{integration.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {CRM_PROVIDERS.find(p => p.value === integration.provider)?.label}
                        </Typography>
                      </Box>
                      <Chip
                        label={integration.isActive ? 'Active' : 'Inactive'}
                        color={integration.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                    
                    {integration.description && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {integration.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      {integration.syncLeads && <Chip label="Leads" size="small" />}
                      {integration.syncSales && <Chip label="Sales" size="small" />}
                      {integration.syncSchedule && <Chip label="Schedule" size="small" />}
                      {integration.syncCustomers && <Chip label="Customers" size="small" />}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        startIcon={<Sync />}
                        onClick={() => handleSyncIntegration(integration.id)}
                        disabled={!integration.isActive}
                      >
                        Sync
                      </Button>
                      <Button
                        size="small"
                        startIcon={integration.isActive ? <Error /> : <CheckCircle />}
                        onClick={() => handleToggleIntegration(integration.id, !integration.isActive)}
                      >
                        {integration.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => {
                          // Edit functionality would be implemented here
                          console.log('Edit integration:', integration.id);
                        }}
                      >
                        Edit
                      </Button>
                    </Box>

                    {integration.lastSyncAt && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Last sync: {new Date(integration.lastSyncAt).toLocaleString()}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* CRM Data Tabs */}
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab label={`Leads (${leads.length})`} />
              <Tab label={`Sales (${sales.length})`} />
              <Tab label={`Schedule (${schedules.length})`} />
            </Tabs>
          </Box>

          {/* Leads Tab */}
          {activeTab === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Move Date</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        {lead.firstName} {lead.lastName}
                      </TableCell>
                      <TableCell>
                        <Box>
                          {lead.email && <Typography variant="body2">{lead.email}</Typography>}
                          {lead.phone && <Typography variant="body2">{lead.phone}</Typography>}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={lead.status}
                          color={getStatusColor(lead.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={lead.priority}
                          color={getPriorityColor(lead.priority)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {lead.estimatedValue && `$${lead.estimatedValue.toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        {lead.moveDate && new Date(lead.moveDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Sales Tab */}
          {activeTab === 1 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Opportunity</TableCell>
                    <TableCell>Stage</TableCell>
                    <TableCell>Probability</TableCell>
                    <TableCell>Estimated Value</TableCell>
                    <TableCell>Actual Value</TableCell>
                    <TableCell>Close Date</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{sale.opportunityName}</TableCell>
                      <TableCell>
                        <Chip
                          label={sale.stage}
                          color={getStatusColor(sale.stage)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {sale.probability && `${sale.probability}%`}
                      </TableCell>
                      <TableCell>
                        {sale.estimatedValue && `$${sale.estimatedValue.toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        {sale.actualValue && `$${sale.actualValue.toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        {sale.expectedCloseDate && new Date(sale.expectedCloseDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Schedule Tab */}
          {activeTab === 2 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Start Time</TableCell>
                    <TableCell>End Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>{schedule.title}</TableCell>
                      <TableCell>{schedule.type}</TableCell>
                      <TableCell>
                        {new Date(schedule.startTime).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {schedule.endTime && new Date(schedule.endTime).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={schedule.status}
                          color={getStatusColor(schedule.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{schedule.location}</TableCell>
                      <TableCell>
                        {new Date(schedule.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add Integration Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add CRM Integration</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>CRM Provider</InputLabel>
                <Select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  label="CRM Provider"
                >
                  {CRM_PROVIDERS.map((provider) => (
                    <MenuItem key={provider.value} value={provider.value}>
                      <Box>
                        <Typography variant="body1">{provider.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {provider.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Integration Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="API Endpoint"
                value={formData.apiEndpoint}
                onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                placeholder="https://api.example.com"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Webhook URL"
                value={formData.webhookUrl}
                onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                placeholder="https://your-domain.com/api/webhooks/crm"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="API Key"
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="API Secret"
                type="password"
                value={formData.apiSecret}
                onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Sync Settings
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.syncLeads}
                    onChange={(e) => setFormData({ ...formData, syncLeads: e.target.checked })}
                  />
                }
                label="Sync Leads"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.syncSales}
                    onChange={(e) => setFormData({ ...formData, syncSales: e.target.checked })}
                  />
                }
                label="Sync Sales"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.syncSchedule}
                    onChange={(e) => setFormData({ ...formData, syncSchedule: e.target.checked })}
                  />
                }
                label="Sync Schedule"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.syncCustomers}
                    onChange={(e) => setFormData({ ...formData, syncCustomers: e.target.checked })}
                  />
                }
                label="Sync Customers"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddIntegration}>
            Create Integration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
