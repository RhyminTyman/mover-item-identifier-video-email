"use client";

/* eslint-disable jsx-a11y/alt-text */
import React, { useRef, useCallback, useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  IconButton, 
  FormControl, 
  Select, 
  MenuItem,
  Chip,
  Tooltip,
  Stack,
  Divider,
  Autocomplete,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  Button
} from '@mui/material';
import { 
  CloudUpload, 
  Close, 
  VideoFile, 
  Image, 
  Room, 
  Storage,
  AccessTime,
  CheckCircle,
  Error
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { addFiles, removeFile, updateFileRoom, updateFileTags } from '@/app/actions/state-actions';
import { LocalFile } from '@/app/actions/state-actions';

const COMMON_ROOMS = [
  "Living Room", "Kitchen", "Dining Room",
  "Primary Bedroom", "Bedroom 2", "Bedroom 3",
  "Bathroom", "Office", "Nursery", "Garage",
  "Basement", "Attic", "Hallway", "Closet"
];

const COMMON_TAGS = [
  "Furniture", "Appliances", "Electronics", "Decor",
  "Storage", "Clothing", "Books", "Kitchen Items",
  "Bedroom Items", "Bathroom Items", "Office Items",
  "Fragile", "Heavy", "Valuable", "Antique",
  "New", "Used", "Needs Assembly", "Disassembled"
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
  const [showSizeWarning, setShowSizeWarning] = useState(false);
  const [oversizedFiles, setOversizedFiles] = useState<File[]>([]);

  const handleFileSelect = useCallback(async (selectedFiles: FileList) => {
    const MAX_FILE_SIZE_MB = 50;
    const oversized: File[] = [];
    
    // Check for oversized files
    Array.from(selectedFiles).forEach(file => {
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        oversized.push(file);
      }
    });
    
    // Show warning if there are oversized files
    if (oversized.length > 0) {
      setOversizedFiles(oversized);
      setShowSizeWarning(true);
    }
    
    const newFiles: Omit<LocalFile, 'id'>[] = Array.from(selectedFiles).map(file => {
      const isVideo = file.type.startsWith('video/');
      return {
        name: file.name,
        size: file.size,
        type: file.type,
        preview: URL.createObjectURL(file),
        roomName: null,
        kind: isVideo ? 'video' : 'image',
        tags: []
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

  const handleTagsChange = useCallback(async (fileId: string, tags: string[]) => {
    await updateFileTags(fileId, tags);
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Uploaded Files ({files.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip 
                icon={<Image />} 
                label={`${files.filter(f => f.kind === 'image').length} Images`} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
              <Chip 
                icon={<VideoFile />} 
                label={`${files.filter(f => f.kind === 'video').length} Videos`} 
                size="small" 
                color="secondary" 
                variant="outlined" 
              />
              <Chip 
                icon={<Storage />} 
                label={`${files.reduce((sum, f) => sum + (f.tags?.length || 0), 0)} Tags`} 
                size="small" 
                color="info" 
                variant="outlined" 
              />
            </Box>
          </Box>
          
          <Grid container spacing={2}>
            {files.map((file) => (
              <Grid item xs={12} sm={6} lg={4} xl={3} key={file.id}>
                <Card 
                  sx={{ 
                    position: 'relative', 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                    }
                  }}
                >
                  {/* Header with Remove Button */}
                  <Box sx={{ 
                    position: 'relative', 
                    height: 120, 
                    overflow: 'hidden',
                    backgroundColor: 'grey.50'
                  }}>
                    {/* Remove Button */}
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveFile(file.id)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        zIndex: 2,
                        '&:hover': {
                          backgroundColor: 'rgba(255,0,0,0.8)',
                        },
                      }}
                      aria-label="Remove file"
                    >
                      <Close fontSize="small" />
                    </IconButton>

                    {/* File Type Badge */}
                    <Chip
                      icon={file.kind === 'image' ? <Image /> : <VideoFile />}
                      label={file.kind === 'image' ? 'Image' : 'Video'}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        backgroundColor: file.kind === 'image' ? 'primary.main' : 'secondary.main',
                        color: 'white',
                        zIndex: 2,
                      }}
                    />

                    {/* File Preview */}
                    <Box
                      sx={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
                        <Box sx={{ textAlign: 'center' }}>
                          <VideoFile sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="caption" color="text.secondary">
                            Video File
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* File Information */}
                  <CardContent sx={{ flexGrow: 1, p: 2, '&:last-child': { pb: 2 } }}>
                    {/* File Name */}
                    <Tooltip title={file.name} placement="top">
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500,
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          lineHeight: 1.2
                        }}
                      >
                        {file.name}
                      </Typography>
                    </Tooltip>

                    {/* File Stats */}
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      <Chip
                        icon={<Storage />}
                        label={`${(file.size / 1024 / 1024).toFixed(1)} MB`}
                        size="small"
                        variant="outlined"
                        color={file.size > 50 * 1024 * 1024 ? "warning" : "default"}
                      />
                      {file.size > 50 * 1024 * 1024 && (
                        <Chip
                          label="Large File"
                          size="small"
                          variant="filled"
                          color="warning"
                          sx={{ fontWeight: 'bold' }}
                        />
                      )}
                      <Chip
                        icon={<AccessTime />}
                        label="Uploaded"
                        size="small"
                        variant="outlined"
                        color="default"
                      />
                    </Stack>

                    <Divider sx={{ my: 1 }} />

                    {/* Room Selection */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        <Room sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                        Room Assignment
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={file.roomName || ''}
                          onChange={(e) => handleRoomChange(file.id, e.target.value || null)}
                          displayEmpty
                          sx={{ 
                            '& .MuiSelect-select': { 
                              py: 1,
                              fontSize: '0.875rem'
                            }
                          }}
                        >
                          <MenuItem value="">
                            <em>Select Room</em>
                          </MenuItem>
                          {roomOptions.map((room) => (
                            <MenuItem key={room} value={room || ""}>
                              {room}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    {/* Tags Selection */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        <Storage sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                        Tags
                      </Typography>
                      <Autocomplete
                        multiple
                        freeSolo
                        options={COMMON_TAGS}
                        value={file.tags || []}
                        onChange={(event, newValue) => {
                          handleTagsChange(file.id, newValue);
                        }}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              {...getTagProps({ index })}
                              key={option}
                              label={option}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontSize: '0.75rem', height: 20 }}
                            />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Add tags..."
                            size="small"
                            sx={{
                              '& .MuiInputBase-root': {
                                py: 0.5,
                                fontSize: '0.875rem'
                              }
                            }}
                          />
                        )}
                        sx={{
                          '& .MuiAutocomplete-inputRoot': {
                            py: 0.5
                          }
                        }}
                      />
                    </Box>

                    {/* Status Summary */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {/* Room Status */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {file.roomName ? (
                          <Chip
                            icon={<CheckCircle />}
                            label={file.roomName}
                            size="small"
                            color="success"
                            variant="filled"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        ) : (
                          <Chip
                            icon={<Error />}
                            label="No Room"
                            size="small"
                            color="warning"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        )}
                        
                        {/* File Type Indicator */}
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          backgroundColor: file.kind === 'image' ? 'primary.main' : 'secondary.main' 
                        }} />
                      </Box>

                      {/* Tags Summary */}
                      {(file.tags && file.tags.length > 0) && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {file.tags.slice(0, 3).map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              color="secondary"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 18 }}
                            />
                          ))}
                          {file.tags.length > 3 && (
                            <Chip
                              label={`+${file.tags.length - 3}`}
                              size="small"
                              color="default"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 18 }}
                            />
                          )}
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* File Size Warning Dialog */}
      <Dialog open={showSizeWarning} onClose={() => setShowSizeWarning(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          ⚠️ Large File Warning
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Files Exceed Recommended Size</AlertTitle>
            The following files are larger than 50MB and may take longer to process:
          </Alert>
          
          <Box sx={{ mt: 2 }}>
            {oversizedFiles.map((file, index) => (
              <Box key={index} sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                p: 1,
                mb: 1,
                backgroundColor: 'warning.light',
                borderRadius: 1
              }}>
                <Typography variant="body2">
                  {file.name}
                </Typography>
                <Typography variant="body2" color="warning.dark" fontWeight="bold">
                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                </Typography>
              </Box>
            ))}
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            <strong>What to expect:</strong>
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>Processing may take several minutes</li>
            <li>Video frames will be compressed to optimize performance</li>
            <li>Analysis will be processed in chunks for better reliability</li>
            <li>You can continue with smaller files for faster processing</li>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSizeWarning(false)}>
            Continue Anyway
          </Button>
          <Button onClick={() => setShowSizeWarning(false)} variant="contained">
            Understood
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
