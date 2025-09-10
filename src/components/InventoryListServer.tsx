import React from 'react';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Chip, 
  Box,
  Alert
} from '@mui/material';
import { prisma } from '@/lib/db';

interface InventoryData {
  id: string;
  title: string;
  note: string | null;
  totalValue: number;
  createdAt: Date;
  items: Array<{
    id: string;
    name: string;
    category: string;
    condition: string;
    estimatedValue: number;
    notes: string | null;
    room: string;
  }>;
}

export default async function InventoryListServer() {
  let inventories: InventoryData[] = [];
  let error: string | null = null;

  try {
    inventories = await prisma.inventory.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true },
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
                    ${inventory.totalValue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {inventory.items.length} item{inventory.items.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {Object.entries(
                    inventory.items.reduce((acc, item) => {
                      acc[item.room] = (acc[item.room] || 0) + 1;
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
