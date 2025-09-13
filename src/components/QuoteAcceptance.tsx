"use client";

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Paper,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Download,
  Email,
  Schedule,
  Person
} from '@mui/icons-material';

interface QuoteDetails {
  finalCost: number;
  breakdown: {
    baseCost: number;
    additionalHandling: number;
    disposal: number;
    storage: number;
    stairs: number;
    packing: number;
    unpacking: number;
    distance: number;
    subtotal: number;
    tax: number;
  };
  notes?: string;
  quotedAt: string;
  validUntil: string;
  termsAndConditions: string;
}

interface QuoteAcceptanceProps {
  inventoryId: string;
  quote: QuoteDetails;
  salesRep?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  onAccept?: () => void;
  onReject?: () => void;
}

export default function QuoteAcceptance({
  inventoryId,
  quote,
  salesRep,
  onAccept,
  onReject
}: QuoteAcceptanceProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [acceptanceNotes, setAcceptanceNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const isQuoteExpired = new Date() > new Date(quote.validUntil);

  const handleAccept = async () => {
    if (!termsAccepted) {
      setError('Please accept the terms and conditions to proceed');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/inventories/${inventoryId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'accepted',
          notes: acceptanceNotes 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept quote');
      }

      setSuccess('Quote accepted successfully! We will contact you soon to schedule your move.');
      setShowAcceptDialog(false);
      
      if (onAccept) {
        onAccept();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept quote');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejecting the quote');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/inventories/${inventoryId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'rejected',
          notes: rejectionReason 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject quote');
      }

      setSuccess('Quote rejected. We will contact you to discuss alternatives.');
      setShowRejectDialog(false);
      
      if (onReject) {
        onReject();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject quote');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getBreakdownItems = () => {
    const items = [];
    
    if (quote.breakdown.baseCost > 0) {
      items.push({ label: 'Base Moving Cost', amount: quote.breakdown.baseCost });
    }
    if (quote.breakdown.additionalHandling > 0) {
      items.push({ label: 'Additional Handling', amount: quote.breakdown.additionalHandling });
    }
    if (quote.breakdown.disposal > 0) {
      items.push({ label: 'Disposal Services', amount: quote.breakdown.disposal });
    }
    if (quote.breakdown.storage > 0) {
      items.push({ label: 'Storage Services', amount: quote.breakdown.storage });
    }
    if (quote.breakdown.stairs > 0) {
      items.push({ label: 'Stair Access', amount: quote.breakdown.stairs });
    }
    if (quote.breakdown.packing > 0) {
      items.push({ label: 'Packing Services', amount: quote.breakdown.packing });
    }
    if (quote.breakdown.unpacking > 0) {
      items.push({ label: 'Unpacking Services', amount: quote.breakdown.unpacking });
    }
    if (quote.breakdown.distance > 0) {
      items.push({ label: 'Distance Charge', amount: quote.breakdown.distance });
    }
    
    return items;
  };

  return (
    <Box>
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

      {isQuoteExpired && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Quote Expired</AlertTitle>
          This quote has expired. Please contact your sales representative for a new quote.
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2">
              Your Moving Quote
            </Typography>
            <Chip
              icon={<Schedule />}
              label={`Valid until ${new Date(quote.validUntil).toLocaleDateString()}`}
              color={isQuoteExpired ? 'error' : 'primary'}
              variant="outlined"
            />
          </Box>

          {/* Quote Summary */}
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h2" color="primary.contrastText" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(quote.finalCost)}
              </Typography>
              <Typography variant="h6" color="primary.contrastText">
                Total Moving Cost
              </Typography>
            </Box>
          </Paper>

          {/* Quote Breakdown */}
          <Typography variant="h6" gutterBottom>
            Cost Breakdown
          </Typography>
          <List>
            {getBreakdownItems().map((item, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemText primary={item.label} />
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {formatCurrency(item.amount)}
                </Typography>
              </ListItem>
            ))}
            <Divider />
            <ListItem sx={{ px: 0 }}>
              <ListItemText primary="Subtotal" />
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {formatCurrency(quote.breakdown.subtotal)}
              </Typography>
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemText primary="Tax" />
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {formatCurrency(quote.breakdown.tax)}
              </Typography>
            </ListItem>
            <Divider />
            <ListItem sx={{ px: 0, bgcolor: 'primary.light', borderRadius: 1 }}>
              <ListItemText 
                primary="Total" 
                primaryTypographyProps={{ sx: { fontWeight: 'bold', fontSize: '1.1rem' } }}
              />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(quote.finalCost)}
              </Typography>
            </ListItem>
          </List>

          {/* Sales Rep Information */}
          {salesRep && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Your Sales Representative
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person color="action" />
                <Typography variant="body1">
                  {salesRep.firstName} {salesRep.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ({salesRep.email})
                </Typography>
              </Box>
            </Box>
          )}

          {/* Notes */}
          {quote.notes && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Additional Notes
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2">
                  {quote.notes}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Terms and Conditions */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Terms and Conditions
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
              <Typography variant="body2">
                {quote.termsAndConditions}
              </Typography>
            </Paper>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={<CheckCircle />}
              onClick={() => setShowAcceptDialog(true)}
              disabled={loading || isQuoteExpired}
              sx={{ minWidth: 150 }}
            >
              Accept Quote
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              size="large"
              startIcon={<Cancel />}
              onClick={() => setShowRejectDialog(true)}
              disabled={loading || isQuoteExpired}
              sx={{ minWidth: 150 }}
            >
              Request Changes
            </Button>

            <Button
              variant="outlined"
              startIcon={<Download />}
              disabled={loading}
            >
              Download PDF
            </Button>

            <Button
              variant="outlined"
              startIcon={<Email />}
              disabled={loading}
            >
              Email Quote
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Accept Quote Dialog */}
      <Dialog open={showAcceptDialog} onClose={() => setShowAcceptDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Accept Moving Quote
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            By accepting this quote, you agree to the terms and conditions and authorize us to proceed with your move.
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Additional Notes (Optional)"
            value={acceptanceNotes}
            onChange={(e) => setAcceptanceNotes(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="Any special instructions or notes for your move..."
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                color="primary"
              />
            }
            label="I accept the terms and conditions and authorize this moving service"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAcceptDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleAccept}
            disabled={loading || !termsAccepted}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {loading ? 'Accepting...' : 'Accept Quote'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Quote Dialog */}
      <Dialog open={showRejectDialog} onClose={() => setShowRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Request Changes to Quote
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Please let us know what changes you&apos;d like to make to your quote. We&apos;ll work with you to provide a revised estimate.
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Reason for Changes"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
            placeholder="Please describe what changes you'd like to make to the quote..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRejectDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={loading || !rejectionReason.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <Cancel />}
          >
            {loading ? 'Submitting...' : 'Request Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
