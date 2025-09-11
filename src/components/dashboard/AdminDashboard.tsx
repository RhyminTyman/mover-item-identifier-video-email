"use client";

import { useUser } from "@clerk/nextjs";
import { Container, Typography, Box, Card, CardContent, Button, Grid, Chip, Alert } from "@mui/material";
import { 
  Add, 
  Inventory, 
  Analytics, 
  People, 
  Settings, 
  Security,
  TrendingUp,
  AdminPanelSettings
} from "@mui/icons-material";
import Link from "next/link";

export function AdminDashboard() {
  const { user } = useUser();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, {user?.firstName}! Full system administration and management
        </Typography>
        <Chip label="Administrator" color="error" sx={{ mt: 1 }} />
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        You have full administrative access to the system. Use these tools responsibly.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Add sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6">Create Inventory</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create a new inventory for any user
              </Typography>
              <Button 
                variant="contained" 
                component={Link} 
                href="/"
                fullWidth
              >
                New Inventory
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Inventory sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6">All Inventories</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                View and manage all system inventories
              </Typography>
              <Button 
                variant="outlined" 
                component={Link} 
                href="/inventories"
                fullWidth
              >
                View All
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Analytics sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6">System Analytics</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                View comprehensive system analytics
              </Typography>
              <Button 
                variant="outlined" 
                component={Link} 
                href="/analytics"
                fullWidth
              >
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <People sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6">User Management</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Manage all users, roles, and permissions
              </Typography>
              <Button 
                variant="outlined" 
                component={Link} 
                href="/admin/users"
                fullWidth
              >
                Manage Users
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Settings sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6">System Settings</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure system settings and preferences
              </Typography>
              <Button 
                variant="outlined" 
                component={Link} 
                href="/admin/settings"
                fullWidth
              >
                System Settings
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Security sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6">Security & Logs</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Monitor security events and system logs
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <AdminPanelSettings sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6">Admin Tools</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Advanced administrative tools and utilities
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
