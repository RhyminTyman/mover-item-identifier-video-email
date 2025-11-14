"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Alert, Box, Button, Chip, Grid, ImageList, ImageListItem, Stack, TextField, Typography, LinearProgress, Tabs, Tab, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import WorkflowStatus from "@/components/WorkflowStatus";
import SalesRepAssignment from "@/components/SalesRepAssignment";
import QuoteAcceptance from "@/components/QuoteAcceptance";
import PricingCalculator from "@/components/PricingCalculator";

interface InventoryItem {
  id: string;
  shortName: string;
  description: string | null;
  notes: string | null;
  lengthIn: number | null;
  widthIn: number | null;
  heightIn: number | null;
  tags: string[] | null;
  roomName: string | null;
  count?: number;
}

interface InventoryData {
  id: string;
  title: string;
  note: string | null;
  createdAt: string;
  status: string;
  assignedSalesRepId?: string;
  assignedSalesRep?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedAt?: string;
  verifiedAt?: string;
  quotedAt?: string;
  acceptedAt?: string;
  totalCost?: number;
  items: InventoryItem[];
  photos: Array<{ id: string; url: string; alt?: string | null }>;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function InventoryDetail({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useUser();
  const [id, setId] = useState<string | null>(null);
  const [data, setData] = useState<InventoryData | null>(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailNote, setEmailNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Debug logging for pricing calculator
  useEffect(() => {
    console.log('Pricing calculator state - activeTab:', activeTab, 'saving:', saving);
  }, [activeTab, saving]);

  const handleTabChange = async (newValue: number) => {
    console.log('Tab change called, newValue:', newValue, 'current activeTab:', activeTab);
    // If switching to pricing calculator (tab 1), ensure inventory is saved first
    if (newValue === 1) {
      try {
        console.log('Switching to pricing calculator, saving first...');
        setSaving(true);
        await save();
        setMessage("Inventory saved before opening pricing calculator");
        setTimeout(() => setMessage(null), 2000);
        setSaving(false); // Set saving to false before switching tabs
        // Switch to the tab after saving is complete
        console.log('Switching to tab:', newValue);
        setActiveTab(newValue);
      } catch (error) {
        console.error('Failed to save inventory before pricing calculator:', error);
        setError('Failed to save inventory. Please try again.');
        setTimeout(() => setError(null), 3000);
        setSaving(false);
        return; // Don't switch tabs if save failed
      }
    } else {
      // For other tabs, just switch directly
      console.log('Switching to tab:', newValue);
      setActiveTab(newValue);
    }
  };
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [quote, setQuote] = useState<{
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
  } | null>(null);

  // Resolve params
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  const load = useCallback(async () => {
    if (!id) return;
    const r = await fetch(`/api/inventories/${id}`);
    if (!r.ok) {
      setError("Failed to load inventory");
      return;
    }
    const j = await r.json();
    setData(j);
    setTitle(j.title);
    setNote(j.note);
  }, [id]);

  useEffect(() => { load(); }, [id, load]);

  // Load quote data when status is quoted
  const loadQuote = useCallback(async () => {
    if (!id || data?.status !== 'quoted') return;
    try {
      const response = await fetch(`/api/inventories/${id}/quote`);
      if (response.ok) {
        const quoteData = await response.json();
        setQuote(quoteData.quote);
      }
    } catch (error) {
      console.error('Failed to load quote:', error);
    }
  }, [id, data?.status]);

  useEffect(() => { loadQuote(); }, [loadQuote]);

  if (!id) {
    return <LinearProgress />;
  }

  async function save() {
    console.log('Save function called, id:', id, 'title:', title, 'note:', note);
    setSaving(true);
    try {
      const r = await fetch(`/api/inventories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, note }),
      });
      console.log('Save response:', r.status, r.ok);
      if (!r.ok) throw new Error("Save failed");
      const j = await r.json();
      setData(j);
      setMessage("Saved");
      setTimeout(() => setMessage(null), 1500);
    } catch (e: unknown) {
      console.error('Save error:', e);
      const error = e as Error;
      setError(error?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function updateItem(id: string, patch: Record<string, unknown>) {
    const r = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!r.ok) return alert("Failed to update item");
    const updated = await r.json();
    setData((prev: InventoryData | null) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((it: InventoryItem) => (it.id === id ? updated : it)),
      };
    });
  }

  async function deleteItem(itemId: string) {
    const r = await fetch(`/api/items/${itemId}`, {
      method: "DELETE",
    });
    if (!r.ok) {
      setError("Failed to delete item");
      return;
    }
    setData((prev: InventoryData | null) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter((it: InventoryItem) => it.id !== itemId),
      };
    });
    setMessage("Item deleted successfully");
    setTimeout(() => setMessage(null), 1500);
  }

  const handleDeleteClick = (itemId: string) => {
    setItemToDelete(itemId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      deleteItem(itemToDelete);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function toggleTag(itemId: string, current: string[], tag: string) {
    const set = new Set(current ?? []);
    if (set.has(tag)) {
      set.delete(tag);
    } else {
      set.add(tag);
    }
    updateItem(itemId, { tags: Array.from(set) });
  }

  function toNumOrNull(s: string) {
    const t = s.trim();
    if (t === "") return null;
    const v = Number(t);
    return Number.isFinite(v) && v >= 0 ? v : null;
  }

  async function sendEmail() {
    setEmailing(true);
    setError(null);
    setMessage(null);
    try {
      const r = await fetch(`/api/inventories/${id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: emailTo, note: emailNote }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Email failed");
      setMessage("Email sent");
      setEmailNote("");
    } catch (e: unknown) {
      const error = e as Error;
      setError(error?.message ?? "Email failed");
    } finally {
      setEmailing(false);
    }
  }

  // Handle status updates
  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/inventories/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      const updated = await response.json();
      setData(updated);
      setMessage(`Status updated to ${newStatus}`);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  // Handle assignment changes
  const handleAssignmentChange = () => {
    load(); // Reload the inventory data
  };

  if (!data) {
    return (
      <>
        <Typography variant="h4" sx={{ mb: 2 }}>Inventory</Typography>
        {error ? <Alert severity="error">{error}</Alert> : <Typography>Loading…</Typography>}
      </>
    );
  }

  // Determine user roles and permissions
  const isAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'company-admin';
  const isSalesRep = user?.publicMetadata?.role === 'sales';
  const isCustomer = user?.publicMetadata?.role === 'customer' || !user?.publicMetadata?.role;
  const isAssignedSalesRep = data?.assignedSalesRepId === user?.id;

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Inventory</Typography>

      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} size="small" sx={{ minWidth: 260 }} />
        <TextField label="Notes" value={note} onChange={(e) => setNote(e.target.value)} size="small" sx={{ minWidth: 260 }} />
        <Button onClick={() => { console.log('Save button clicked'); save(); }} disabled={saving} variant="contained">{saving ? "Saving…" : "Save"}</Button>
        <Button onClick={() => handleTabChange(1)} disabled={saving} variant="contained" color="secondary">
          {saving ? "Saving…" : "Save & Move Info"}
        </Button>
        <Button component={Link} href="/inventories" variant="outlined">Back</Button>
        <Button component={Link} href={`/api/inventories/${id}/export/csv`} variant="outlined">Export CSV</Button>
        <Button component={Link} href={`/api/inventories/${id}/export/pdf`} variant="outlined">Export PDF</Button>
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <TextField label="Email to" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} size="small" sx={{ minWidth: 260 }} />
        <TextField label="Message (optional)" value={emailNote} onChange={(e) => setEmailNote(e.target.value)} size="small" sx={{ minWidth: 360 }} />
        <Button onClick={sendEmail} disabled={!emailTo || emailing} variant="contained">Send Email</Button>
      </Stack>
      {emailing && <LinearProgress />}
      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      {/* Workflow Status Component */}
      <WorkflowStatus
        currentStatus={data.status}
        assignedSalesRep={data.assignedSalesRep}
        assignedAt={data.assignedAt}
        verifiedAt={data.verifiedAt}
        quotedAt={data.quotedAt}
        acceptedAt={data.acceptedAt}
        onStatusChange={handleStatusChange}
        isSalesRep={isSalesRep && isAssignedSalesRep}
        isCustomer={isCustomer}
      />

      {/* Sales Rep Assignment Component - Only for admins */}
      {isAdmin && (
        <SalesRepAssignment
          inventoryId={id}
          currentAssignedRep={data.assignedSalesRep}
          status={data.status}
          onAssignmentChange={handleAssignmentChange}
          isAdmin={isAdmin}
        />
      )}

      {/* Quote Acceptance Component - Only for customers when quoted */}
      {isCustomer && data.status === 'quoted' && quote && (
        <QuoteAcceptance
          inventoryId={id}
          quote={quote}
          salesRep={data.assignedSalesRep}
          onAccept={handleAssignmentChange}
          onReject={handleAssignmentChange}
        />
      )}

      {/* Tabbed Content */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, newValue) => handleTabChange(newValue)}>
          <Tab label="Items & Photos" />
          <Tab label="Move Info" />
          <Tab label="Details" />
        </Tabs>
      </Box>

      {/* Tab 1: Items and Photos */}
      {activeTab === 0 && (
        <Stack spacing={2}>
          {data.photos?.length > 0 && (
            <ImageList cols={4} gap={8}>
              {data.photos.map((p: { id: string; url: string; alt?: string | null; mimeType?: string }) => (
                <ImageListItem key={p.id}>
                  {p.mimeType?.startsWith("video/") ? (
                    <Box sx={{ width: "100%", borderRadius: 1, overflow: "hidden" }}>
                      <video 
                        src={p.url} 
                        controls 
                        style={{ width: "100%", height: "auto" }} 
                      />
                    </Box>
                  ) : (
                    <Image 
                      src={p.url} 
                      alt={p.alt || "Photo"} 
                      width={200} 
                      height={200} 
                      unoptimized
                    />
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    Photo
                  </Typography>
                </ImageListItem>
              ))}
            </ImageList>
          )}

          <Typography variant="h6">Items</Typography>
          <Grid container spacing={2}>
            {data.items.map((it: InventoryItem) => (
              <Grid item xs={12} md={6} key={it.id}>
                <Box sx={{ border: "1px solid", borderColor: "divider", p: 2, borderRadius: 2, position: 'relative' }}>
                  <IconButton
                    onClick={() => handleDeleteClick(it.id)}
                    sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                    color="error"
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Short Name" fullWidth
                        value={it.shortName}
                        onChange={(e) => updateItem(it.id, { shortName: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Notes" fullWidth
                        value={it.notes ?? ""}
                        onChange={(e) => updateItem(it.id, { notes: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Description" fullWidth multiline minRows={2}
                        value={it.description}
                        onChange={(e) => updateItem(it.id, { description: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Length (in)" fullWidth
                        value={it.lengthIn ?? ""}
                        onChange={(e) => updateItem(it.id, { lengthIn: toNumOrNull(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Width (in)" fullWidth
                        value={it.widthIn ?? ""}
                        onChange={(e) => updateItem(it.id, { widthIn: toNumOrNull(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Height (in)" fullWidth
                        value={it.heightIn ?? ""}
                        onChange={(e) => updateItem(it.id, { heightIn: toNumOrNull(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Room" fullWidth
                        value={it.roomName ?? ""}
                        onChange={(e) => updateItem(it.id, { roomName: e.target.value || null })}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Count" fullWidth
                        type="number"
                        value={it.count ?? 1}
                        onChange={(e) => updateItem(it.id, { count: parseInt(e.target.value) || 1 })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        {["fragile","glass","heavy","needs-disassembly","box-S","box-M","box-L","box-XL"].map((tg) => {
                          const active = (it.tags ?? []).includes(tg);
                          return (
                            <Chip
                              key={tg}
                              label={tg}
                              color={active ? "primary" : "default"}
                              variant={active ? "filled" : "outlined"}
                              onClick={() => {
                                const set = new Set(it.tags ?? []);
                                if (set.has(tg)) {
                                  set.delete(tg);
                                } else {
                                  set.add(tg);
                                }
                                updateItem(it.id, { tags: Array.from(set) });
                              }}
                            />
                          );
                        })}
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Stack>
      )}

      {/* Tab 2: Move Info */}
      {activeTab === 1 && saving && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Saving inventory before opening move info...
          </Typography>
        </Box>
      )}
      {activeTab === 1 && !saving && (
        <PricingCalculator
          items={data.items.map(item => ({
            shortName: item.shortName,
            description: item.description || '',
            estimatedDimensionsInches: {
              length: item.lengthIn ?? null,
              width: item.widthIn ?? null,
              height: item.heightIn ?? null
            },
            tags: item.tags || [],
            roomName: item.roomName || null,
            count: item.count || 1
          }))}
          onSave={async (pricingData) => {
            // Save pricing data to inventory
            try {
              const response = await fetch(`/api/inventories/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  moveDate: pricingData.moveDate,
                  originAddress: pricingData.originAddress,
                  destinationAddress: pricingData.destinationAddress,
                  distance: pricingData.distance,
                  accessType: pricingData.accessType,
                  stairFlights: pricingData.stairFlights,
                  rushService: pricingData.rushService,
                  sameBuilding: pricingData.sameBuilding,
                  packingBoxes: pricingData.packingBoxes,
                  unpackingBoxes: pricingData.unpackingBoxes,
                  disposalNeeded: pricingData.disposalNeeded,
                  storageNeeded: pricingData.storageNeeded,
                  totalCubicFeet: pricingData.totalCubicFeet,
                  totalWeight: pricingData.totalWeight,
                  estimatedHours: pricingData.estimatedHours,
                  baseCost: pricingData.baseCost,
                  additionalHandling: pricingData.additionalHandling,
                  disposalCost: pricingData.disposalCost,
                  storageCost: pricingData.storageCost,
                  stairsCost: pricingData.stairsCost,
                  packingCost: pricingData.packingCost,
                  unpackingCost: pricingData.unpackingCost,
                  distanceCost: pricingData.distanceCost,
                  subtotal: pricingData.subtotal,
                  taxAmount: pricingData.taxAmount,
                  totalCost: pricingData.totalCost
                }),
              });
              if (response.ok) {
                setMessage("Pricing data saved successfully");
                setTimeout(() => setMessage(null), 3000);
                load(); // Reload inventory data
              } else {
                setError("Failed to save pricing data");
              }
            } catch {
              setError("Failed to save pricing data");
            }
          }}
        />
      )}

      {/* Tab 3: Additional Details */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Inventory Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Customer Information
                </Typography>
                {data.user ? (
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Name:</strong> {data.user.firstName} {data.user.lastName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {data.user.email}
                    </Typography>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No customer information available
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Inventory Summary
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Status:</strong> {data.status}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Items:</strong> {data.items.length}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Photos:</strong> {data.photos.length}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Created:</strong> {new Date(data.createdAt).toLocaleDateString()}
                  </Typography>
                  {data.totalCost && (
                    <Typography variant="body2">
                      <strong>Total Cost:</strong> ${data.totalCost.toFixed(2)}
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Item</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this item? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
