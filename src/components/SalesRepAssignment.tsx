"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Grid,
  Avatar,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Assignment,
  PersonAdd,
  PersonRemove,
  Work,
  Schedule,
  CheckCircle
} from '@mui/icons-material';

interface SalesRep {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
  currentWorkload: number;
  company?: {
    name: string;
  };
}

interface SalesRepAssignmentProps {
  inventoryId: string;
  currentAssignedRep?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: string;
  onAssignmentChange?: () => void;
  isAdmin?: boolean;
}

export default function SalesRepAssignment({
  inventoryId,
  currentAssignedRep,
  status,
  onAssignmentChange,
  isAdmin = false
}: SalesRepAssignmentProps) {
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRepId, setSelectedRepId] = useState('');
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  const loadSalesReps = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/inventories/${inventoryId}/assign`);
      if (!response.ok) {
        throw new Error('Failed to load sales reps');
      }
      const data = await response.json();
      setSalesReps(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales reps');
    } finally {
      setLoading(false);
    }
  }, [inventoryId]);

  useEffect(() => {
    loadSalesReps();
  }, [loadSalesReps]);

  const handleAssign = async () => {
    if (!selectedRepId) return;

    setAssigning(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/inventories/${inventoryId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ salesRepId: selectedRepId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign sales rep');
      }

      setSuccess('Sales rep assigned successfully!');
      setShowAssignDialog(false);
      setSelectedRepId('');
      
      if (onAssignmentChange) {
        onAssignmentChange();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign sales rep');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async () => {
    setAssigning(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/inventories/${inventoryId}/assign`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unassign sales rep');
      }

      setSuccess('Sales rep unassigned successfully!');
      
      if (onAssignmentChange) {
        onAssignmentChange();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unassign sales rep');
    } finally {
      setAssigning(false);
    }
  };

  const getWorkloadColor = (workload: number) => {
    if (workload === 0) return 'success';
    if (workload <= 3) return 'warning';
    return 'error';
  };

  const getWorkloadLabel = (workload: number) => {
    if (workload === 0) return 'Available';
    if (workload <= 3) return 'Busy';
    return 'Overloaded';
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Sales Rep Assignment
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

        {/* Current Assignment */}
        {currentAssignedRep ? (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Currently Assigned
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {currentAssignedRep.firstName[0]}{currentAssignedRep.lastName[0]}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1">
                  {currentAssignedRep.firstName} {currentAssignedRep.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentAssignedRep.email}
                </Typography>
              </Box>
              <Chip
                icon={<CheckCircle />}
                label="Assigned"
                color="primary"
                size="small"
              />
              {status !== 'accepted' && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<PersonRemove />}
                  onClick={handleUnassign}
                  disabled={assigning}
                >
                  Unassign
                </Button>
              )}
            </Box>
          </Box>
        ) : (
          <Box sx={{ mb: 3 }}>
            <Alert severity="info">
              <AlertTitle>No Assignment</AlertTitle>
              This inventory has not been assigned to a sales representative yet.
            </Alert>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => setShowAssignDialog(true)}
                disabled={loading}
              >
                Assign Sales Rep
              </Button>
            </Box>
          </Box>
        )}

        {/* Assignment Dialog */}
        <Dialog open={showAssignDialog} onClose={() => setShowAssignDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Assign Sales Representative
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select a sales representative to assign to this inventory. Consider their current workload.
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {salesReps.map((rep, index) => (
                  <React.Fragment key={rep.id}>
                    <Box
                      onClick={() => setSelectedRepId(rep.id)}
                      sx={{
                        borderRadius: 1,
                        mb: 1,
                        cursor: 'pointer',
                        p: 1,
                        backgroundColor: selectedRepId === rep.id ? 'primary.light' : 'transparent',
                        border: selectedRepId === rep.id ? '2px solid' : '1px solid',
                        borderColor: selectedRepId === rep.id ? 'primary.main' : 'grey.300',
                        '&:hover': {
                          backgroundColor: 'primary.light',
                          opacity: 0.7
                        }
                      }}
                    >
                      <ListItem
                        sx={{
                          borderRadius: 1,
                        }}
                      >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {rep.firstName[0]}{rep.lastName[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1">
                              {rep.fullName}
                            </Typography>
                            <Chip
                              icon={<Work />}
                              label={`${rep.currentWorkload} active`}
                              color={getWorkloadColor(rep.currentWorkload)}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {rep.email}
                            </Typography>
                            {rep.company && (
                              <Typography variant="caption" color="text.secondary">
                                {rep.company.name}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      </ListItem>
                    </Box>
                    {index < salesReps.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleAssign}
              disabled={!selectedRepId || assigning}
              startIcon={assigning ? <CircularProgress size={20} /> : <Assignment />}
            >
              {assigning ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Available Sales Reps Summary */}
        {!currentAssignedRep && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Available Sales Representatives
            </Typography>
            <Grid container spacing={1}>
              {salesReps.slice(0, 3).map((rep) => (
                <Grid item xs={12} sm={6} key={rep.id}>
                  <Box sx={{ p: 1, border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {rep.fullName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Schedule fontSize="small" color="action" />
                      <Chip
                        label={getWorkloadLabel(rep.currentWorkload)}
                        color={getWorkloadColor(rep.currentWorkload)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
            {salesReps.length > 3 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                And {salesReps.length - 3} more sales representatives available
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
