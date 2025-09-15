"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  TextField,
  IconButton,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
  Alert
} from '@mui/material';
import {
  Edit,
  Delete,
  Save,
  Close,
  Add,
  Remove
} from '@mui/icons-material';
import { Analysis } from '@/types';
import { AnalysisItem } from '@/app/actions/state-actions';

interface ItemEditModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (editedItems: AnalysisItem[]) => void;
  initialItems: AnalysisItem[];
  title?: string;
}

export default function ItemEditModal({ 
  open, 
  onClose, 
  onSave, 
  initialItems, 
  title = "Edit Items" 
}: ItemEditModalProps) {
  const [items, setItems] = useState<AnalysisItem[]>(initialItems);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleItemChange = (index: number, field: keyof AnalysisItem, value: any) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    const newItem: AnalysisItem = {
      shortName: '',
      description: '',
      estimatedDimensionsInches: {
        length: null,
        width: null,
        height: null
      },
      notes: '',
      tags: [],
      roomName: null,
      confidence: 0.8
    };
    setItems(prev => [...prev, newItem]);
    setEditingIndex(items.length);
  };

  const handleSave = () => {
    // Validate items
    const hasEmptyItems = items.some(item => !item.shortName.trim());
    if (hasEmptyItems) {
      setError('All items must have a name');
      return;
    }

    onSave(items);
    onClose();
  };

  const formatDimensions = (item: AnalysisItem) => {
    const { length, width, height } = item.estimatedDimensionsInches;
    const dims = [length, width, height].filter(d => d !== null);
    return dims.length > 0 ? `${dims.join(' × ')} in` : 'Unknown';
  };

  const addTag = (index: number, tag: string) => {
    if (tag.trim() && !items[index].tags.includes(tag.trim())) {
      handleItemChange(index, 'tags', [...items[index].tags, tag.trim()]);
    }
  };

  const removeTag = (index: number, tagToRemove: string) => {
    handleItemChange(index, 'tags', items[index].tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">{title}</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleAddItem}
            sx={{ mb: 2 }}
          >
            Add New Item
          </Button>
          <Typography variant="body2" color="text.secondary">
            {items.length} item{items.length !== 1 ? 's' : ''} total
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {items.map((item, index) => (
            <Grid item xs={12} key={index}>
              <Card 
                variant={editingIndex === index ? "outlined" : "elevation"}
                sx={{ 
                  border: editingIndex === index ? 2 : 1,
                  borderColor: editingIndex === index ? 'primary.main' : 'grey.300'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6">
                      Item {index + 1}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                        color={editingIndex === index ? "primary" : "default"}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveItem(index)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Stack>
                  </Box>

                  {editingIndex === index ? (
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Item Name"
                          value={item.shortName}
                          onChange={(e) => handleItemChange(index, 'shortName', e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Room</InputLabel>
                          <Select
                            value={item.roomName || ''}
                            onChange={(e) => handleItemChange(index, 'roomName', e.target.value || null)}
                            label="Room"
                          >
                            <MenuItem value="">None</MenuItem>
                            <MenuItem value="Living Room">Living Room</MenuItem>
                            <MenuItem value="Kitchen">Kitchen</MenuItem>
                            <MenuItem value="Dining Room">Dining Room</MenuItem>
                            <MenuItem value="Primary Bedroom">Primary Bedroom</MenuItem>
                            <MenuItem value="Bedroom 2">Bedroom 2</MenuItem>
                            <MenuItem value="Bedroom 3">Bedroom 3</MenuItem>
                            <MenuItem value="Bathroom">Bathroom</MenuItem>
                            <MenuItem value="Office">Office</MenuItem>
                            <MenuItem value="Garage">Garage</MenuItem>
                            <MenuItem value="Basement">Basement</MenuItem>
                            <MenuItem value="Attic">Attic</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Description"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          multiline
                          rows={2}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          label="Length (in)"
                          type="number"
                          value={item.estimatedDimensionsInches.length || ''}
                          onChange={(e) => handleItemChange(index, 'estimatedDimensionsInches', {
                            ...item.estimatedDimensionsInches,
                            length: e.target.value ? parseFloat(e.target.value) : null
                          })}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          label="Width (in)"
                          type="number"
                          value={item.estimatedDimensionsInches.width || ''}
                          onChange={(e) => handleItemChange(index, 'estimatedDimensionsInches', {
                            ...item.estimatedDimensionsInches,
                            width: e.target.value ? parseFloat(e.target.value) : null
                          })}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          label="Height (in)"
                          type="number"
                          value={item.estimatedDimensionsInches.height || ''}
                          onChange={(e) => handleItemChange(index, 'estimatedDimensionsInches', {
                            ...item.estimatedDimensionsInches,
                            height: e.target.value ? parseFloat(e.target.value) : null
                          })}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Tags
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                            {item.tags.map((tag, tagIndex) => (
                              <Chip
                                key={tagIndex}
                                label={tag}
                                size="small"
                                onDelete={() => removeTag(index, tag)}
                                color="primary"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                          <TextField
                            fullWidth
                            placeholder="Add a tag and press Enter"
                            size="small"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const target = e.currentTarget as HTMLInputElement;
                                addTag(index, target.value);
                                target.value = '';
                              }
                            }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  ) : (
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        {item.shortName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {item.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Room: {item.roomName || 'Not specified'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Size: {formatDimensions(item)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Confidence: {Math.round(item.confidence * 100)}%
                        </Typography>
                      </Box>
                      {item.tags.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {item.tags.map((tag, tagIndex) => (
                            <Chip
                              key={tagIndex}
                              label={tag}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {items.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No items to display. Add an item to get started.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          startIcon={<Save />}
          disabled={items.length === 0}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
