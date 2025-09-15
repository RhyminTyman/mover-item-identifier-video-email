"use client";

import React, { useState } from 'react';
import { Button, Box, Typography, CircularProgress } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { analyzeFilesWithImages } from '@/app/actions/analysis-actions';
import { LocalFile } from '@/app/actions/state-actions';

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
      // Convert files to base64 format for analysis
      const base64Files = await Promise.all(
        files.map(async (file) => {
          // Convert blob URL to base64 data URL
          const response = await fetch(file.preview);
          const blob = await response.blob();
          
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
        })
      );
      
      await analyzeFilesWithImages(base64Files);
    } catch (error) {
      console.error('Analysis failed:', error);
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
