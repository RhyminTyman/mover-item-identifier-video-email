"use client";

import React, { useState } from 'react';
import { Button, Box, Typography, CircularProgress } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { analyzeFilesWithImages } from '@/app/actions/analysis-actions';
import { LocalFile } from '@/app/actions/state-actions';
import { videoFrameService } from '@/lib/videoFrameService';

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

  // Server-side video frame extraction using the video frame service
  const extractVideoFrames = async (videoFile: File, roomName: string | null): Promise<{ name: string; dataUrl: string; type: 'image'; roomName: string | null }[]> => {
    try {
      console.log(`Extracting frames from video: ${videoFile.name} using server-side service`);
      
      const result = await videoFrameService.extractFrames(videoFile, {
        intervalSeconds: 2, // Extract frames every 2 seconds
        format: 'jpg',
        quality: 0.8
      });
      
      console.log(`Server extracted ${result.frames.length} frames from video: ${videoFile.name}`);
      
      // Convert the base64 frames to the expected format
      return result.frames.map((frameDataUrl, index) => ({
        name: `${videoFile.name}_frame_${index + 1}`,
        dataUrl: frameDataUrl,
        type: 'image' as const,
        roomName
      }));
    } catch (error) {
      console.error('Failed to extract video frames:', error);
      throw new Error(`Video frame extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAnalyze = async () => {
    console.log('Analyze button clicked!', { files: files.length, disabled, isAnalyzing });
    if (files.length === 0) return;
    
    setIsProcessing(true);
    try {
      // Process files - extract frames from videos using server-side service, convert images to base64
      const base64Files = await Promise.all(
        files.map(async (file) => {
          if (file.kind === 'video') {
            // For videos, extract frames using server-side video frame service
            console.log(`Processing video: ${file.name}`);
            
            // Convert blob URL back to File object for video processing
            const response = await fetch(file.preview);
            const videoBlob = await response.blob();
            const videoFile = new File([videoBlob], file.name, { type: file.type });
            
            // Extract frames from video using server-side service
            const frames = await extractVideoFrames(videoFile, file.roomName);
            
            console.log(`Server extracted ${frames.length} frames from video: ${file.name}`);
            return frames;
          } else {
            // For images, convert to base64 data URL
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
          }
        })
      );
      
      // Flatten the array since video processing returns multiple frames
      const flattenedFiles = base64Files.flat();
      
      console.log(`Total files to analyze: ${flattenedFiles.length} (${files.length} original files)`);
      
      if (flattenedFiles.length === 0) {
        throw new Error('No valid files found for analysis');
      }
      
      await analyzeFilesWithImages(flattenedFiles);
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
