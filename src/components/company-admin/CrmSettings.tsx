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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
  Chip,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Save,
  Sync,
  CheckCircle,
  Error as ErrorIcon,
  Refresh,
  Info,
  VpnKey
} from '@mui/icons-material';

interface CrmSettings {
  id?: string;
  provider: string;
  enabled: boolean;
  apiKey: string;
  apiSecret: string;
  webhookUrl: string;
  syncEnabled: boolean;
  autoCreateLeads: boolean;
  autoUpdateStatus: boolean;
  customFields: Record<string, string>;
  lastSyncAt?: string;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'unknown';
}

const CRM_PROVIDERS = [
  { value: 'salesforce', label: 'Salesforce' },
  { value: 'hubspot', label: 'HubSpot' },
  { value: 'zoho', label: 'Zoho CRM' },
  { value: 'pipedrive', label: 'Pipedrive' },
  { value: 'freshsales', label: 'Freshsales' },
  { value: 'custom', label: 'Custom Integration' },
  { value: 'none', label: 'No CRM Integration' }
];

export default function CrmSettings() {
  const [settings, setSettings] = useState<CrmSettings>({
    provider: 'none',
    enabled: false,
    apiKey: '',
    apiSecret: '',
    webhookUrl: '',
    syncEnabled: false,
    autoCreateLeads: true,
    autoUpdateStatus: true,
    customFields: {},
    connectionStatus: 'unknown'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/company-admin/crm-settings');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch CRM settings');
      }
      
      const data = await response.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch CRM settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field: keyof CrmSettings, value: string | boolean | Record<string, string>) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/company-admin/crm-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save CRM settings');
      }

      setSnackbarMessage('CRM settings saved successfully!');
      setSnackbarOpen(true);
      fetchSettings(); // Refresh settings
    } catch (err) {
      setSnackbarMessage(err instanceof Error ? err.message : 'Failed to save CRM settings');
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const response = await fetch('/api/company-admin/crm-settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Connection test failed');
      }

      const data = await response.json();
      setSettings(prev => ({
        ...prev,
        connectionStatus: data.status
      }));

      setSnackbarMessage(data.message || 'Connection test successful!');
      setSnackbarOpen(true);
    } catch (err) {
      setSettings(prev => ({
        ...prev,
        connectionStatus: 'error'
      }));
      setSnackbarMessage(err instanceof Error ? err.message : 'Connection test failed');
      setSnackbarOpen(true);
    } finally {
      setTesting(false);
    }
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'connected': return 'success';
      case 'disconnected': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle />;
      case 'error': return <ErrorIcon />;
      default: return <Info />;
    }
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            CRM Integration Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure your CRM integration to automatically sync quote requests and customer data
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchSettings}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Box>

      {/* Connection Status */}
      {settings.provider !== 'none' && settings.enabled && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h6">Connection Status</Typography>
                <Chip
                  label={settings.connectionStatus}
                  color={getStatusColor(settings.connectionStatus)}
                  icon={getStatusIcon(settings.connectionStatus)}
                  size="small"
                />
                {settings.lastSyncAt && (
                  <Typography variant="body2" color="text.secondary">
                    Last sync: {new Date(settings.lastSyncAt).toLocaleString()}
                  </Typography>
                )}
              </Box>
              <Button
                variant="outlined"
                startIcon={testing ? <CircularProgress size={20} /> : <Sync />}
                onClick={handleTestConnection}
                disabled={testing || !settings.apiKey}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* CRM Provider Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            CRM Provider
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select CRM Provider</InputLabel>
                <Select
                  value={settings.provider}
                  onChange={(e) => handleChange('provider', e.target.value)}
                  label="Select CRM Provider"
                >
                  {CRM_PROVIDERS.map((provider) => (
                    <MenuItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enabled}
                    onChange={(e) => handleChange('enabled', e.target.checked)}
                    disabled={settings.provider === 'none'}
                  />
                }
                label="Enable CRM Integration"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* API Configuration */}
      {settings.provider !== 'none' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <VpnKey />
              <Typography variant="h6">
                API Configuration
              </Typography>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="API Key"
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.apiKey}
                  onChange={(e) => handleChange('apiKey', e.target.value)}
                  placeholder="Enter your CRM API key"
                  InputProps={{
                    endAdornment: (
                      <Tooltip title={showApiKey ? 'Hide' : 'Show'}>
                        <IconButton
                          onClick={() => setShowApiKey(!showApiKey)}
                          edge="end"
                        >
                          {showApiKey ? '🙈' : '👁️'}
                        </IconButton>
                      </Tooltip>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="API Secret"
                  type={showApiSecret ? 'text' : 'password'}
                  value={settings.apiSecret}
                  onChange={(e) => handleChange('apiSecret', e.target.value)}
                  placeholder="Enter your CRM API secret"
                  InputProps={{
                    endAdornment: (
                      <Tooltip title={showApiSecret ? 'Hide' : 'Show'}>
                        <IconButton
                          onClick={() => setShowApiSecret(!showApiSecret)}
                          edge="end"
                        >
                          {showApiSecret ? '🙈' : '👁️'}
                        </IconButton>
                      </Tooltip>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Webhook URL"
                  value={settings.webhookUrl}
                  onChange={(e) => handleChange('webhookUrl', e.target.value)}
                  placeholder="https://your-crm.com/webhooks/barreleyes"
                  helperText="Optional: URL to receive real-time updates from your CRM"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Sync Settings */}
      {settings.provider !== 'none' && settings.enabled && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Sync />
              <Typography variant="h6">
                Sync Settings
              </Typography>
            </Box>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.syncEnabled}
                    onChange={(e) => handleChange('syncEnabled', e.target.checked)}
                  />
                }
                label="Enable Automatic Sync"
              />
              <Divider />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoCreateLeads}
                    onChange={(e) => handleChange('autoCreateLeads', e.target.checked)}
                  />
                }
                label="Automatically create leads in CRM for new quote requests"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoUpdateStatus}
                    onChange={(e) => handleChange('autoUpdateStatus', e.target.checked)}
                  />
                }
                label="Automatically update quote status in CRM"
              />
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Integration Help */}
      {settings.provider !== 'none' && (
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Info color="primary" />
              <Typography variant="h6">
                Integration Guide for {CRM_PROVIDERS.find(p => p.value === settings.provider)?.label}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Follow these steps to set up your CRM integration:
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">
                1. Log in to your {CRM_PROVIDERS.find(p => p.value === settings.provider)?.label} account
              </Typography>
              <Typography variant="body2">
                2. Navigate to API settings or Developer settings
              </Typography>
              <Typography variant="body2">
                3. Generate a new API key and secret
              </Typography>
              <Typography variant="body2">
                4. Copy and paste the credentials above
              </Typography>
              <Typography variant="body2">
                5. Click &quot;Test Connection&quot; to verify the integration
              </Typography>
              <Typography variant="body2">
                6. Enable the features you want to use
              </Typography>
              <Typography variant="body2">
                7. Save your settings
              </Typography>
            </Stack>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Quote requests will automatically sync to your CRM when sync is enabled. 
                You can manage leads and opportunities directly in your CRM system.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
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
