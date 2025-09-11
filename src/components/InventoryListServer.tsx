import React from 'react';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Chip, 
  Box,
  Alert,
  AlertTitle,
  Divider
} from '@mui/material';
import { prisma } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/lib/user';

interface InventoryData {
  id: string;
  title: string;
  note: string | null;
  createdAt: Date;
  userId: string | null;
  salesUserId: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  salesUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  items: Array<{
    id: string;
    shortName: string;
    description: string;
    notes: string;
    tags: string[];
    roomName: string | null;
    lengthIn: number | null;
    widthIn: number | null;
    heightIn: number | null;
    createdAt: Date;
    inventoryId: string;
  }>;
}

export default async function InventoryListServer() {
  let inventories: InventoryData[] = [];
  let error: string | null = null;
  let userRole: string = 'customer';

  try {
    // Get current user
    const clerkUser = await currentUser();
    if (!clerkUser) {
      throw new Error('User not authenticated');
    }

    // Get user from database
    const dbUser = await getUserByClerkId(clerkUser.id);
    if (!dbUser) {
      throw new Error('User not found in database');
    }

    userRole = dbUser.role;

    // Build query based on user role
    let whereClause = {};
    if (userRole === 'customer') {
      // Customers can only see their own inventories
      whereClause = { userId: dbUser.id };
    } else if (userRole === 'sales') {
      // Sales can see inventories they created or manage
      whereClause = { 
        OR: [
          { salesUserId: dbUser.id },
          { userId: dbUser.id }
        ]
      };
    }
    // Admins can see all inventories (no where clause)

    inventories = await prisma.inventory.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: { 
        items: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        salesUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
    });
  } catch (err) {
    console.error('Error loading inventories:', err);
    error = err instanceof Error ? err.message : 'Failed to load inventories';
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      </Container>
    );
  }

  if (inventories.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No inventories yet
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Upload some photos to create your first inventory
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Saved Inventories
      </Typography>
      
      <Grid container spacing={3}>
        {inventories.map((inventory) => (
          <Grid item xs={12} sm={6} md={4} key={inventory.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  {inventory.title}
                </Typography>
                
                {inventory.note && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {inventory.note}
                  </Typography>
                )}
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" color="primary">
                    {inventory.items.length} item{inventory.items.length !== 1 ? 's' : ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Items Count
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {Object.entries(
                    inventory.items.reduce((acc, item) => {
                      const room = item.roomName || 'Unassigned';
                      acc[room] = (acc[room] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([room, count]) => (
                    <Chip
                      key={room}
                      label={`${room} (${count})`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                {/* User Information */}
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Customer: {inventory.user ? `${inventory.user.firstName} ${inventory.user.lastName}` : 'Unknown'}
                  </Typography>
                  {inventory.salesUser && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Sales Rep: {inventory.salesUser.firstName} {inventory.salesUser.lastName}
                    </Typography>
                  )}
                </Box>
                
                <Typography variant="caption" color="text.secondary">
                  Created {new Date(inventory.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
