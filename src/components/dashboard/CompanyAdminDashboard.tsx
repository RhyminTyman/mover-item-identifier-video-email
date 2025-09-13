"use client";

import { useUser } from "@clerk/nextjs";
import { Container, Typography, Box, Card, CardContent, Button, Grid, Chip, Alert } from "@mui/material";
import { 
  Add, 
  Inventory, 
  Analytics, 
  People, 
  Business,
  AttachMoney,
  TrendingUp
} from "@mui/icons-material";
import Link from "next/link";

export function CompanyAdminDashboard() {
  const { user } = useUser();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Company Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, {user?.firstName}! Manage your company, sales team, and pricing
        </Typography>
        <Chip label="Company Administrator" color="primary" sx={{ mt: 1 }} />
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        You have full administrative access to your company. Manage sales users, set pricing, and view all company inventories.
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
                Create a new inventory for a customer
              </Typography>
              <Button 
                variant="contained" 
                component={Link} 
                href="/dashboard?tab=analyze"
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
                <Typography variant="h6">Company Inventories</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                View and manage all company inventories
              </Typography>
              <Button 
                variant="outlined" 
                component={Link} 
                href="/dashboard?tab=inventories"
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
                <Typography variant="h6">Company Analytics</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                View company performance and sales metrics
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
                <Typography variant="h6">Sales Team Management</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Manage sales users and their permissions
              </Typography>
              <Button 
                variant="outlined" 
                component={Link} 
                href="/company/sales-team"
                fullWidth
              >
                Manage Sales Team
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <AttachMoney sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6">Pricing Settings</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure company pricing and rates
              </Typography>
              <Button 
                variant="outlined" 
                component={Link} 
                href="/company/pricing"
                fullWidth
              >
                Set Pricing
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Business sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6">Company Information</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Update company details and contact information
              </Typography>
              <Button 
                variant="outlined" 
                component={Link} 
                href="/company/settings"
                fullWidth
              >
                Company Settings
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <TrendingUp sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6">Sales Performance</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Track sales team performance and goals
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
