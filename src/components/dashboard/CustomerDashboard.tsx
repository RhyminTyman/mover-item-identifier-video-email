"use client";

import { useUser } from "@clerk/nextjs";
import { Container, Typography, Box, Card, CardContent, Button, Grid } from "@mui/material";
import { Add, Inventory, Analytics } from "@mui/icons-material";
import Link from "next/link";

export function CustomerDashboard() {
  const { user } = useUser();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your move inventory and track your belongings
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Add sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6">Create New Inventory</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Start a new inventory by uploading photos and videos of your belongings
              </Typography>
              <Button 
                variant="contained" 
                component={Link} 
                href="/"
                fullWidth
              >
                Start New Inventory
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Inventory sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6">My Inventories</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                View and manage your existing inventories
              </Typography>
              <Button 
                variant="outlined" 
                component={Link} 
                href="/inventories"
                fullWidth
              >
                View Inventories
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Analytics sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6">Recent Activity</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                No recent activity. Start by creating your first inventory!
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
