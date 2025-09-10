"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Alert, Box, Button, Chip, Grid, ImageList, ImageListItem, Stack, TextField, Typography, LinearProgress
} from "@mui/material";
import Link from "next/link";

export default function InventoryDetail({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailNote, setEmailNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
    } catch (e: any) {
      setError(e?.message ?? "Save failed");
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
    setData((prev: any) => ({
      ...prev,
      items: prev.items.map((it: any) => (it.id === id ? updated : it)),
    }));
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
    } catch (e: any) {
      setError(e?.message ?? "Email failed");
    } finally {
      setEmailing(false);
    }
  }

  if (!data) {
    return (
      <>
        <Typography variant="h4" sx={{ mb: 2 }}>Inventory</Typography>
        {error ? <Alert severity="error">{error}</Alert> : <Typography>Loading…</Typography>}
      </>
    );
  }

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

      {data.photos?.length > 0 && (
        <ImageList cols={4} gap={8}>
          {data.photos.map((p: any) => (
            <ImageListItem key={p.id}>
              {p.mimeType?.startsWith("video/") ? (
                <video src={p.url} controls style={{ width: "100%", borderRadius: 8 }} />
              ) : (
                <img src={p.url} alt={p.filename} loading="lazy" style={{ borderRadius: 8 }} />
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                {p.roomName || "Unassigned room"}
              </Typography>
            </ImageListItem>
          ))}
        </ImageList>
      )}

      <Typography variant="h6">Items</Typography>
      <Grid container spacing={2}>
        {data.items.map((it: any) => (
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
  );
}
