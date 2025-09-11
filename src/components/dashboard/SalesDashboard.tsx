"use client";

import { useUser } from "@clerk/nextjs";
import { Container, Typography, Box, Card, CardContent, Button, Grid, Chip } from "@mui/material";
import { Add, Inventory, Analytics, People, TrendingUp } from "@mui/icons-material";
import Link from "next/link";

export function SalesDashboard() {
  const { user } = useUser();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sales Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, {user?.firstName}! Manage customer inventories and track sales metrics
        </Typography>
        <Chip label="Sales Team" color="primary" sx={{ mt: 1 }} />
      </Box>

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
                href="/dashboard"
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
                View and manage all customer inventories
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
                <Typography variant="h6">Analytics</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                View sales analytics and performance metrics
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
                <Typography variant="h6">Customer Management</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Manage customer accounts and their inventories
              </Typography>
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
                Track your sales performance and goals
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
