"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Alert, Box, Button, Chip, Grid, ImageList, ImageListItem, Stack, TextField, Typography, LinearProgress, Tabs, Tab
} from "@mui/material";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import WorkflowStatus from "@/components/WorkflowStatus";
import SalesRepAssignment from "@/components/SalesRepAssignment";
import QuoteAcceptance from "@/components/QuoteAcceptance";

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
    setSaving(true);
    try {
      const r = await fetch(`/api/inventories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, note }),
      });
      if (!r.ok) throw new Error("Save failed");
      const j = await r.json();
      setData(j);
      setMessage("Saved");
      setTimeout(() => setMessage(null), 1500);
    } catch (e: unknown) {
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
        <Button onClick={save} disabled={saving} variant="contained">{saving ? "Saving…" : "Save"}</Button>
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
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Items & Photos" />
          <Tab label="Pricing Calculator" />
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
                    <video 
                      src={p.url} 
                      controls 
                      style={{ width: "100%", borderRadius: 8 }} 
                    />
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
                <Box sx={{ border: "1px solid", borderColor: "divider", p: 2, borderRadius: 2 }}>
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

      {/* Tab 2: Pricing Calculator */}
      {activeTab === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Pricing Calculator
          </Typography>
          <Alert severity="info">
            The pricing calculator will be available here. This will help calculate moving costs based on items and move parameters.
          </Alert>
        </Box>
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
    </Stack>
  );
}
