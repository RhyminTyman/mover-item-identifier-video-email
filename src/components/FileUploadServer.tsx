"use client";

import React, { useRef, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  IconButton, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Chip
} from '@mui/material';
import { CloudUpload, Close, Image, VideoFile } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { addFiles, removeFile, updateFileRoom, getAppState } from '@/app/actions/state-actions';
import { LocalFile } from '@/app/actions/state-actions';

const COMMON_ROOMS = [
  "Living Room", "Kitchen", "Dining Room",
  "Primary Bedroom", "Bedroom 2", "Bedroom 3",
  "Bathroom", "Office", "Nursery", "Garage",
  "Basement", "Attic", "Hallway", "Closet"
];

const UploadArea = styled(Card)(({ theme }) => ({
  border: `2px dashed ${theme.palette.grey[300]}`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light + '10',
  },
}));

const HiddenInput = styled('input')({
  display: 'none',
});

interface FileUploadServerProps {
  files: LocalFile[];
}

export default function FileUploadServer({ files }: FileUploadServerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (selectedFiles: FileList) => {
    const newFiles: Omit<LocalFile, 'id'>[] = Array.from(selectedFiles).map(file => {
      const isVideo = file.type.startsWith('video/');
      return {
        name: file.name,
        size: file.size,
        type: file.type,
        preview: URL.createObjectURL(file),
        roomName: null,
        kind: isVideo ? 'video' : 'image'
      };
    });
    
    await addFiles(newFiles);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleRemoveFile = useCallback(async (fileId: string) => {
    await removeFile(fileId);
  }, []);

  const handleRoomChange = useCallback(async (fileId: string, roomName: string | null) => {
    await updateFileRoom(fileId, roomName);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  }, [handleFileSelect]);

  const roomOptions = Array.from(new Set([
    ...COMMON_ROOMS,
    ...files.map(f => f.roomName).filter(Boolean)
  ]));

  return (
    <Box sx={{ p: 2 }}>
      {/* Upload Area */}
      <UploadArea
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <CardContent>
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Drop files here or click to upload
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supports images and videos up to 10MB each
          </Typography>
          <HiddenInput
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileInputChange}
          />
        </CardContent>
      </UploadArea>

      {/* File List */}
      {files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Uploaded Files ({files.length})
          </Typography>
          <Grid container spacing={2}>
            {files.map((file, index) => (
              <Grid item xs={12} sm={6} md={4} key={file.id}>
                <Card sx={{ position: 'relative', height: 200 }}>
                  {/* Remove Button */}
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveFile(file.id)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      zIndex: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.7)',
                      },
                    }}
                    aria-label="Remove file"
                  >
                    <Close />
                  </IconButton>

                  {/* File Preview */}
                  <Box
                    sx={{
                      height: 120,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'grey.100',
                      overflow: 'hidden',
                    }}
                  >
                    {file.kind === 'image' ? (
                      <Box
                        component="img"
                        src={file.preview}
                        alt={file.name}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <VideoFile sx={{ fontSize: 48, color: 'text.secondary' }} />
                    )}
                  </Box>

                  {/* File Info */}
                  <Box sx={{ p: 1 }}>
                    <Typography variant="body2" noWrap title={file.name}>
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </Typography>

                    {/* Room Selection */}
                    <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                      <InputLabel>Room</InputLabel>
                      <Select
                        value={file.roomName || ''}
                        onChange={(e) => handleRoomChange(file.id, e.target.value || null)}
                        label="Room"
                        aria-label="Select room"
                      >
                        <MenuItem value="">
                          <em>Select Room</em>
                        </MenuItem>
                        {roomOptions.map((room) => (
                          <MenuItem key={room} value={room}>
                            {room}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Room Chip */}
                    {file.roomName && (
                      <Chip
                        label={file.roomName}
                        size="small"
                        sx={{ mt: 1 }}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}
