"use client";

import { useState } from 'react';
import { Button, Box, Typography, CircularProgress } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { analyzeFilesWithImages } from '@/app/actions/analysis-actions';
import { LocalFile } from '@/app/actions/state-actions';
import { compressImage } from '@/lib/image-compression';

interface AnalyzeButtonProps {
  files: LocalFile[];
  disabled?: boolean;
  isAnalyzing?: boolean;
}

export default function AnalyzeButton({ 
  files, 
  disabled = false, 
  isAnalyzing = false 
}: AnalyzeButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);


  const handleAnalyze = async () => {
    console.log('Analyze button clicked!', { files: files.length, disabled, isAnalyzing });
    if (files.length === 0) return;
    
    setIsProcessing(true);
    try {
      // Process both images and videos
      console.log('Processing files...');
      const base64Files = await Promise.all(
        files.map(async (file) => {
          console.log(`Processing ${file.kind}: ${file.name}`);
          const response = await fetch(file.preview);
          const blob = await response.blob();
          
          if (file.kind === 'image') {
            // Convert blob to File for compression
            const imageFile = new File([blob], file.name, { type: file.type });
            
            // Compress the image to reduce payload size
            const compressedFile = await compressImage(imageFile, {
              maxWidth: 1280,
              maxHeight: 720,
              quality: 0.7,
              maxSizeKB: 200
            });
            
            console.log(`Compressed image: ${file.name} from ${(blob.size / 1024).toFixed(1)}KB to ${(compressedFile.size / 1024).toFixed(1)}KB`);
            
            return new Promise<{ name: string; dataUrl: string; type: 'image' | 'video'; roomName?: string | null }>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  name: file.name,
                  dataUrl: reader.result as string,
                  type: file.kind as 'image' | 'video',
                  roomName: file.roomName
                });
              };
              reader.readAsDataURL(compressedFile);
            });
          } else {
            // For videos, use the original blob without compression
            return new Promise<{ name: string; dataUrl: string; type: 'image' | 'video'; roomName?: string | null }>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  name: file.name,
                  dataUrl: reader.result as string,
                  type: file.kind as 'image' | 'video',
                  roomName: file.roomName
                });
              };
              reader.readAsDataURL(blob);
            });
          }
        })
      );
      
      console.log(`Total files to analyze: ${base64Files.length} (${files.length} original files)`);
      
      if (base64Files.length === 0) {
        throw new Error('No valid files found for analysis');
      }
      
      await analyzeFilesWithImages(base64Files);
    } catch (error) {
      console.error('Analysis failed:', error);
      // Show user-friendly error message
      alert(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Button
        variant="contained"
        size="large"
        startIcon={isProcessing ? <CircularProgress size={20} /> : <PlayArrow />}
        onClick={handleAnalyze}
        disabled={disabled || isAnalyzing || isProcessing}
        sx={{ minWidth: 200, mb: 2 }}
      >
        {isProcessing ? 'Processing...' : isAnalyzing ? 'Analyzing...' : 'Analyze Files'}
      </Button>
      <Typography variant="body2" color="text.secondary">
        {files.length} file{files.length !== 1 ? 's' : ''} ready to analyze
      </Typography>
    </Box>
  );
}
