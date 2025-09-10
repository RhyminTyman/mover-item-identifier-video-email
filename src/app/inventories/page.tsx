"use client";

import useSWR from "swr";
import { Alert, Card, CardActionArea, CardContent, Grid, Typography } from "@mui/material";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function InventoriesPage() {
  const { data, error, isLoading } = useSWR("/api/inventories", fetcher);

  return (
    <>
      <Typography variant="h4" sx={{ mb: 2 }}>Saved Inventories</Typography>
      {isLoading && <Typography>Loading…</Typography>}
      {error && <Alert severity="error">Failed to load inventories.</Alert>}

      <Grid container spacing={2}>
        {Array.isArray(data) && data.map((inv: { id: string; title: string; note: string | null; createdAt: string; items: Array<{ shortName: string }>; photos: Array<{ id: string }> }) => (
          <Grid item xs={12} md={6} key={inv.id}>
            <Card variant="outlined">
              <CardActionArea component={Link} href={`/inventories/${inv.id}`}>
                <CardContent>
                  <Typography variant="h6">{inv.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(inv.createdAt).toLocaleString()}
                  </Typography>
                  {inv.note && (
                    <Typography variant="body2" sx={{ mt: 1 }}>{inv.note}</Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                    {inv.items.length} items • {inv.photos.length} photos
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
