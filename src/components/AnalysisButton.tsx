"use client";

import React, { useState } from 'react';
import { Button, CircularProgress, Box, Typography } from '@mui/material';
import { PlayArrow, VideoFile, Image } from '@mui/icons-material';
import { analyzeFilesWithImages } from '@/app/actions/analysis-actions';
import { LocalFile } from '@/app/actions/state-actions';
import { convertFileToBase64WithCompression, extractVideoFrames } from '@/lib/image-compression';

interface AnalysisButtonProps {
  files: LocalFile[];
  disabled: boolean;
  isAnalyzing: boolean;
}

export default function AnalysisButton({ files, disabled, isAnalyzing }: AnalysisButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  const convertFileToBase64 = async (file: LocalFile): Promise<string | null> => {
    console.log(`convertFileToBase64 called for: ${file.name}, kind: ${file.kind}, type: ${file.type}`);
    
    if (!file.preview) {
      console.warn(`No preview URL for ${file.name}`);
      return null;
    }

    try {
      console.log(`Fetching preview for ${file.name}...`);
      const response = await fetch(file.preview);
      const blob = await response.blob();
      console.log(`Fetched blob for ${file.name}, size: ${blob.size}, type: ${blob.type}`);
      
      // For now, let's just convert everything to base64 without complex processing
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          console.log(`Base64 conversion result for ${file.name}:`, result ? 'Success' : 'Failed');
          resolve(result);
        };
        reader.onerror = () => {
          console.error(`FileReader error for ${file.name}`);
          reject(new Error('Failed to convert file to base64'));
        };
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
    setProcessingStatus('Preparing files...');
    
    try {
      // Count file types for better status messages
      const imageFiles = files.filter(f => f.kind === 'image');
      const videoFiles = files.filter(f => f.kind === 'video');
      
      // Convert all files to base64 (both images and videos)
      const base64Files: Array<{ name: string; dataUrl: string; type: 'image' | 'video'; roomName?: string | null }> = [];
      let totalSize = 0;
      const MAX_TOTAL_SIZE_MB = 40; // 40MB total limit
      
      setProcessingStatus(`Processing ${files.length} file${files.length !== 1 ? 's' : ''}...`);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingStatus(`Converting ${file.name} (${i + 1}/${files.length})...`);
        
        try {
          console.log(`Processing file: ${file.name}, type: ${file.type}, kind: ${file.kind}`);
          
          // Add timeout for each file conversion to prevent hanging
          const conversionPromise = convertFileToBase64(file);
          const timeoutPromise = new Promise<string | null>((_, reject) => 
            setTimeout(() => reject(new Error(`Conversion timeout for ${file.name}`)), 10000)
          );
          
          const base64 = await Promise.race([conversionPromise, timeoutPromise]);
          console.log(`Conversion result for ${file.name}:`, base64 ? 'Success' : 'Failed');
          
          if (base64) {
            // Process both images and videos
            if (file.kind === 'image' && base64.startsWith('data:image/')) {
              // Calculate size of base64 data (base64 is ~33% larger than binary)
              const sizeMB = (base64.length * 0.75) / (1024 * 1024);
              totalSize += sizeMB;
              
              if (totalSize > MAX_TOTAL_SIZE_MB) {
                throw new Error(`Total file size (${totalSize.toFixed(1)}MB) exceeds the ${MAX_TOTAL_SIZE_MB}MB limit. Please reduce the number of files or their sizes.`);
              }
              
              base64Files.push({
                name: file.name,
                dataUrl: base64,
                type: 'image' as const,
                roomName: file.roomName || null
              });
              console.log(`Successfully added image ${file.name} to analysis queue`);
            } else if (file.kind === 'video') {
              // Process video by extracting frames
              console.log(`Processing video ${file.name}...`);
              try {
                const response = await fetch(file.preview);
                const blob = await response.blob();
                const videoFile = new File([blob], file.name, { type: file.type });
                
                // Extract frames from video
                const frames = await extractVideoFrames(videoFile, 2, 1); // Extract 2 frames
                console.log(`Extracted ${frames.length} frames from video ${file.name}`);
                
                if (frames.length > 0) {
                  // Add each frame as a separate image
                  for (let i = 0; i < frames.length; i++) {
                    const frame = frames[i];
                    const sizeMB = (frame.length * 0.75) / (1024 * 1024);
                    totalSize += sizeMB;
                    
                    if (totalSize > MAX_TOTAL_SIZE_MB) {
                      throw new Error(`Total file size (${totalSize.toFixed(1)}MB) exceeds the ${MAX_TOTAL_SIZE_MB}MB limit. Please reduce the number of files or their sizes.`);
                    }
                    
                    base64Files.push({
                      name: `${file.name} (Frame ${i + 1})`,
                      dataUrl: frame,
                      type: 'image' as const,
                      roomName: file.roomName || null
                    });
                  }
                  console.log(`Successfully added ${frames.length} frames from video ${file.name} to analysis queue`);
                } else {
                  console.warn(`No frames extracted from video ${file.name}`);
                }
              } catch (videoError) {
                console.error(`Error processing video ${file.name}:`, videoError);
                // Continue with other files
              }
            } else {
              console.warn(`Skipping ${file.name}: Invalid MIME type in data URL - starts with: ${base64.substring(0, 20)}`);
            }
          } else {
            console.warn(`No data extracted from ${file.name}`);
          }
        } catch (fileError) {
          console.error(`Error processing ${file.name}:`, fileError);
          // Continue with other files instead of failing completely
          continue;
        }
      }

      if (base64Files.length === 0) {
        const imageCount = files.filter(f => f.kind === 'image').length;
        const videoCount = files.filter(f => f.kind === 'video').length;
        
        if (videoCount > 0) {
          throw new Error(`Video processing completed with ${videoCount} video file(s). Some videos may have been processed as placeholders due to format compatibility issues. For best results, please convert MOV files to MP4 format before uploading.`);
        } else {
          throw new Error(`No valid files found for analysis. Found ${imageCount} image(s) and ${videoCount} video(s). Please check the console for processing errors.`);
        }
      }

      setProcessingStatus(`Analyzing ${base64Files.length} file${base64Files.length !== 1 ? 's' : ''} with AI...`);

      // Call the server action with base64 files
      await analyzeFilesWithImages(base64Files);
      
    } catch (error) {
      console.error('Analysis error:', error);
      setProcessingStatus('Analysis failed');
      // The error will be handled by the server action
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const getFileTypeCounts = () => {
    const imageCount = files.filter(f => f.kind === 'image').length;
    const videoCount = files.filter(f => f.kind === 'video').length;
    return { imageCount, videoCount };
  };

  const { imageCount, videoCount } = getFileTypeCounts();
  const totalFiles = imageCount + videoCount;

  const getButtonText = () => {
    if (isAnalyzing || isProcessing) {
      return processingStatus || 'Processing...';
    }
    
    if (totalFiles === 0) {
      return 'Analyze Files';
    }
    
    let text = `Analyze ${totalFiles} File${totalFiles !== 1 ? 's' : ''}`;
    if (imageCount > 0 && videoCount > 0) {
      text += ` (${imageCount} photo${imageCount !== 1 ? 's' : ''}, ${videoCount} video${videoCount !== 1 ? 's' : ''})`;
    } else if (imageCount > 0) {
      text += ` (${imageCount} photo${imageCount !== 1 ? 's' : ''})`;
    } else if (videoCount > 0) {
      text += ` (${videoCount} video${videoCount !== 1 ? 's' : ''})`;
    }
    
    return text;
  };

  const getButtonIcon = () => {
    if (isAnalyzing || isProcessing) {
      return <CircularProgress size={20} color="inherit" />;
    }
    
    if (imageCount > 0 && videoCount > 0) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Image fontSize="small" />
          <VideoFile fontSize="small" />
        </Box>
      );
    } else if (imageCount > 0) {
      return <Image />;
    } else if (videoCount > 0) {
      return <VideoFile />;
    }
    
    return <PlayArrow />;
  };

  return (
    <Button
      variant="contained"
      startIcon={getButtonIcon()}
      onClick={handleAnalyze}
      disabled={disabled || isProcessing}
      size="large"
      sx={{ minWidth: 200 }}
    >
      {getButtonText()}
    </Button>
  );
}
