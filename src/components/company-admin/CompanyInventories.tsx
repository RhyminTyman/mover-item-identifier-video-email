"use client";

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Avatar
} from '@mui/material';
import {
  Refresh,
  Visibility,
  Edit,
  Send,
  Phone,
  Email,
  Business,
  Person,
  CalendarToday,
  AttachMoney,
  CheckCircle,
  Pending,
  Cancel
} from '@mui/icons-material';

interface Inventory {
  id: string;
  title: string;
  note: string;
  status: string;
  createdAt: string;
  moveDate?: string;
  totalCost?: number;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  items: Array<{
    id: string;
    shortName: string;
    description: string;
    count: number;
  }>;
  assignedSalesRep?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function CompanyInventories() {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    baseCost: 0,
    additionalHandling: 0,
    disposalCost: 0,
    storageCost: 0,
    stairsCost: 0,
    packingCost: 0,
    unpackingCost: 0,
    distanceCost: 0,
    taxAmount: 0,
    totalCost: 0,
    notes: ''
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchInventories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/company-admin/inventories');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch inventories');
      }
      
      const data = await response.json();
      setInventories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventories();
  }, []);

  const handleViewDetails = (inventory: Inventory) => {
    setSelectedInventory(inventory);
    setDetailDialogOpen(true);
  };

  const handleCreateQuote = (inventory: Inventory) => {
    setSelectedInventory(inventory);
    // Pre-populate with estimated costs
    setQuoteForm({
      baseCost: inventory.items.length * 50, // $50 per item base
      additionalHandling: 0,
      disposalCost: 0,
      storageCost: 0,
      stairsCost: 0,
      packingCost: 0,
      unpackingCost: 0,
      distanceCost: 0,
      taxAmount: 0,
      totalCost: inventory.items.length * 50,
      notes: ''
    });
    setQuoteDialogOpen(true);
  };

  const handleSendQuote = async () => {
    if (!selectedInventory) return;

    try {
      setActionLoading('send-quote');
      const response = await fetch('/api/company-admin/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryId: selectedInventory.id,
          quote: quoteForm
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send quote');
      }

      setQuoteDialogOpen(false);
      fetchInventories(); // Refresh the list
    } catch (err) {
      console.error('Error sending quote:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'warning';
      case 'quoted': return 'info';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <Pending />;
      case 'quoted': return <AttachMoney />;
      case 'accepted': return <CheckCircle />;
      case 'rejected': return <Cancel />;
      default: return <Pending />;
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
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Quote Requests
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchInventories}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {inventories.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Quote Requests
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Quote requests from customers will appear here.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Move Date</TableCell>
                <TableCell>Quote</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventories.map((inventory) => (
                <TableRow key={inventory.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                        {inventory.user?.firstName[0]}{inventory.user?.lastName[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {inventory.user?.firstName} {inventory.user?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {inventory.user?.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {inventory.title}
                    </Typography>
                    {inventory.note && (
                      <Typography variant="caption" color="text.secondary">
                        {inventory.note.substring(0, 50)}...
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {inventory.items.length} items
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={inventory.status}
                      color={getStatusColor(inventory.status) as any}
                      size="small"
                      icon={getStatusIcon(inventory.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(inventory.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {inventory.moveDate ? new Date(inventory.moveDate).toLocaleDateString() : 'Not set'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {inventory.totalCost ? formatCurrency(inventory.totalCost) : 'Pending'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(inventory)}
                      title="View Details"
                    >
                      <Visibility />
                    </IconButton>
                    {inventory.status === 'submitted' && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleCreateQuote(inventory)}
                        title="Create Quote"
                      >
                        <Edit />
                      </IconButton>
                    )}
                    {inventory.status === 'quoted' && (
                      <IconButton
                        size="small"
                        color="success"
                        title="Send Quote"
                      >
                        <Send />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Inventory Details Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Inventory Details</DialogTitle>
        <DialogContent>
          {selectedInventory && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" gutterBottom>Customer Information</Typography>
                  <Stack spacing={1}>
                    <Box display="flex" alignItems="center">
                      <Person sx={{ mr: 1, fontSize: 20 }} />
                      <Typography>{selectedInventory.user?.firstName} {selectedInventory.user?.lastName}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center">
                      <Email sx={{ mr: 1, fontSize: 20 }} />
                      <Typography>{selectedInventory.user?.email}</Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" gutterBottom>Move Information</Typography>
                  <Stack spacing={1}>
                    <Box display="flex" alignItems="center">
                      <CalendarToday sx={{ mr: 1, fontSize: 20 }} />
                      <Typography>
                        {selectedInventory.moveDate ? new Date(selectedInventory.moveDate).toLocaleDateString() : 'Not set'}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center">
                      <AttachMoney sx={{ mr: 1, fontSize: 20 }} />
                      <Typography>
                        {selectedInventory.totalCost ? formatCurrency(selectedInventory.totalCost) : 'No quote yet'}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>Items ({selectedInventory.items.length})</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedInventory.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {item.shortName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.count}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          {selectedInventory?.status === 'submitted' && (
            <Button
              variant="contained"
              onClick={() => {
                setDetailDialogOpen(false);
                handleCreateQuote(selectedInventory);
              }}
            >
              Create Quote
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Quote Creation Dialog */}
      <Dialog open={quoteDialogOpen} onClose={() => setQuoteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Quote</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Base Cost"
                type="number"
                value={quoteForm.baseCost}
                onChange={(e) => setQuoteForm({...quoteForm, baseCost: parseFloat(e.target.value) || 0})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Additional Handling"
                type="number"
                value={quoteForm.additionalHandling}
                onChange={(e) => setQuoteForm({...quoteForm, additionalHandling: parseFloat(e.target.value) || 0})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Disposal Cost"
                type="number"
                value={quoteForm.disposalCost}
                onChange={(e) => setQuoteForm({...quoteForm, disposalCost: parseFloat(e.target.value) || 0})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Storage Cost"
                type="number"
                value={quoteForm.storageCost}
                onChange={(e) => setQuoteForm({...quoteForm, storageCost: parseFloat(e.target.value) || 0})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Stairs Cost"
                type="number"
                value={quoteForm.stairsCost}
                onChange={(e) => setQuoteForm({...quoteForm, stairsCost: parseFloat(e.target.value) || 0})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Packing Cost"
                type="number"
                value={quoteForm.packingCost}
                onChange={(e) => setQuoteForm({...quoteForm, packingCost: parseFloat(e.target.value) || 0})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Unpacking Cost"
                type="number"
                value={quoteForm.unpackingCost}
                onChange={(e) => setQuoteForm({...quoteForm, unpackingCost: parseFloat(e.target.value) || 0})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Distance Cost"
                type="number"
                value={quoteForm.distanceCost}
                onChange={(e) => setQuoteForm({...quoteForm, distanceCost: parseFloat(e.target.value) || 0})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Tax Amount"
                type="number"
                value={quoteForm.taxAmount}
                onChange={(e) => setQuoteForm({...quoteForm, taxAmount: parseFloat(e.target.value) || 0})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Total Cost"
                type="number"
                value={quoteForm.totalCost}
                onChange={(e) => setQuoteForm({...quoteForm, totalCost: parseFloat(e.target.value) || 0})}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={quoteForm.notes}
                onChange={(e) => setQuoteForm({...quoteForm, notes: e.target.value})}
                placeholder="Additional notes for the customer..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuoteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSendQuote}
            disabled={actionLoading === 'send-quote'}
            startIcon={actionLoading === 'send-quote' ? <CircularProgress size={16} /> : <Send />}
          >
            {actionLoading === 'send-quote' ? 'Sending...' : 'Send Quote'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
