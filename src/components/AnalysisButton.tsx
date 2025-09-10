"use client";

import React, { useState } from 'react';
import { Button } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { analyzeFilesWithImages } from '@/app/actions/analysis-actions';
import { LocalFile } from '@/app/actions/state-actions';

interface AnalysisButtonProps {
  files: LocalFile[];
  disabled: boolean;
  isAnalyzing: boolean;
}

export default function AnalysisButton({ files, disabled, isAnalyzing }: AnalysisButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const convertFileToBase64 = async (file: LocalFile): Promise<string | null> => {
    if (!file.preview || file.kind !== 'image') {
      return null;
    }

    try {
      const response = await fetch(file.preview);
      const blob = await response.blob();
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error(`Error converting ${file.name} to base64:`, error);
      return null;
    }
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    
    try {
      // Convert all image files to base64
      const base64Images: Array<{ name: string; dataUrl: string }> = [];
      
      for (const file of files) {
        const base64 = await convertFileToBase64(file);
        if (base64) {
          base64Images.push({
            name: file.name,
            dataUrl: base64
          });
        }
      }

      if (base64Images.length === 0) {
        throw new Error('No valid images found for analysis');
      }

      // Call the server action with base64 images
      await analyzeFilesWithImages(base64Images);
      
    } catch (error) {
      console.error('Analysis error:', error);
      // The error will be handled by the server action
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      variant="contained"
      startIcon={<PlayArrow />}
      onClick={handleAnalyze}
      disabled={disabled || isProcessing}
      size="large"
    >
      {isAnalyzing || isProcessing ? 'Analyzing...' : 'Analyze Files'}
    </Button>
  );
}
