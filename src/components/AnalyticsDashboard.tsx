"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  Timeline,
  Refresh,
} from '@mui/icons-material';

interface AnalyticsSummary {
  totalSessions: number;
  totalImages: number;
  totalItems: number;
  totalEdits: number;
  totalFeedback: number;
  averageAccuracy: number | null;
  itemsWithErrors: number;
  significantErrors: number;
  averageProcessingTime: number | null;
  averageItemsPerSession: number;
  averageEditsPerSession: number;
  mostCommonRooms: string[];
  mostCommonItemTypes: string[];
}

interface ItemTrends {
  [itemType: string]: {
    totalItems: number;
    averageAccuracy: number;
    significantErrors: number;
    accuracyByRoom: Record<string, number[]>;
  };
}

export default function AnalyticsDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<ItemTrends>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch summary
      const summaryResponse = await fetch(`/api/analytics?action=summary&days=${days}`);
      const summaryData = await summaryResponse.json();
      
      if (!summaryData.success) {
        throw new Error(summaryData.error || 'Failed to fetch summary');
      }
      
      setSummary(summaryData.data);

      // Fetch trends
      const trendsResponse = await fetch(`/api/analytics?action=trends&days=${days}`);
      const trendsData = await trendsResponse.json();
      
      if (!trendsData.success) {
        throw new Error(trendsData.error || 'Failed to fetch trends');
      }
      
      setTrends(trendsData.data);
      
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const handleRefresh = () => {
    fetchAnalytics();
  };

  const handleUpdateDaily = async () => {
    try {
      const response = await fetch('/api/analytics?action=update-daily');
      const data = await response.json();
      
      if (data.success) {
        // Refresh data after updating
        fetchAnalytics();
      } else {
        setError(data.error || 'Failed to update daily metrics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update daily metrics');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading analytics...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="h6">Error Loading Analytics</Typography>
        {error}
        <Button onClick={handleRefresh} sx={{ mt: 1 }}>
          Try Again
        </Button>
      </Alert>
    );
  }

  if (!summary) {
    return (
      <Alert severity="info">
        No analytics data available for the selected period.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Analytics Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={days}
              label="Period"
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <MenuItem value={7}>Last 7 days</MenuItem>
              <MenuItem value={30}>Last 30 days</MenuItem>
              <MenuItem value={90}>Last 90 days</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Timeline />}
            onClick={handleUpdateDaily}
          >
            Update Daily
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Assessment color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Sessions</Typography>
              </Box>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {summary.totalSessions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Items</Typography>
              </Box>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {summary.totalItems}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6">Accuracy</Typography>
              </Box>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {summary.averageAccuracy ? `${summary.averageAccuracy.toFixed(1)}%` : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingDown color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Edits</Typography>
              </Box>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {summary.totalEdits}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Average Processing Time
                  </Typography>
                  <Typography variant="h6">
                    {summary.averageProcessingTime ? `${(summary.averageProcessingTime / 1000).toFixed(1)}s` : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Items per Session
                  </Typography>
                  <Typography variant="h6">
                    {summary.averageItemsPerSession.toFixed(1)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Edits per Session
                  </Typography>
                  <Typography variant="h6">
                    {summary.averageEditsPerSession.toFixed(1)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Error Analysis
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Items with Errors
                  </Typography>
                  <Typography variant="h6">
                    {summary.itemsWithErrors} ({summary.totalItems > 0 ? ((summary.itemsWithErrors / summary.totalItems) * 100).toFixed(1) : 0}%)
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Significant Errors (&gt;10%)
                  </Typography>
                  <Typography variant="h6">
                    {summary.significantErrors}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Feedback Sessions
                  </Typography>
                  <Typography variant="h6">
                    {summary.totalFeedback}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Most Common Items */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Most Common Rooms
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {summary.mostCommonRooms.map((room, index) => (
                  <Chip
                    key={room}
                    label={room}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Most Common Item Types
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {summary.mostCommonItemTypes.map((type, index) => (
                  <Chip
                    key={type}
                    label={type}
                    color="secondary"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Item Accuracy Trends */}
      {Object.keys(trends).length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Item Accuracy Trends
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item Type</TableCell>
                    <TableCell align="right">Total Items</TableCell>
                    <TableCell align="right">Avg Accuracy</TableCell>
                    <TableCell align="right">Significant Errors</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(trends)
                    .sort(([,a], [,b]) => b.totalItems - a.totalItems)
                    .slice(0, 10)
                    .map(([itemType, data]) => (
                    <TableRow key={itemType}>
                      <TableCell>{itemType}</TableCell>
                      <TableCell align="right">{data.totalItems}</TableCell>
                      <TableCell align="right">
                        {data.averageAccuracy.toFixed(1)}%
                      </TableCell>
                      <TableCell align="right">{data.significantErrors}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
