"use client";

import { useState, useEffect } from 'react';
import { Snackbar, Alert, Box, Typography, LinearProgress } from '@mui/material';
import { Psychology, TrendingUp } from '@mui/icons-material';

interface MLFeedbackNotificationProps {
  editsCount: number;
  accuracyScore?: number;
  onClose?: () => void;
}

export default function MLFeedbackNotification({
  editsCount,
  accuracyScore,
  onClose
}: MLFeedbackNotificationProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (editsCount > 0) {
      setOpen(true);
    }
  }, [editsCount]);

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  if (editsCount === 0) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={8000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert 
        onClose={handleClose}
        severity="info"
        icon={<Psychology />}
        sx={{ minWidth: 350 }}
      >
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography variant="subtitle2" fontWeight="bold">
              🤖 AI Learning in Progress
            </Typography>
            {accuracyScore !== undefined && (
              <TrendingUp fontSize="small" color="success" />
            )}
          </Box>
          
          <Typography variant="body2" sx={{ mb: 1 }}>
            Thank you! Your {editsCount} edit{editsCount > 1 ? 's' : ''} will help improve our AI.
          </Typography>

          {accuracyScore !== undefined && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Current Accuracy
                </Typography>
                <Typography variant="caption" fontWeight="bold">
                  {accuracyScore.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={accuracyScore} 
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          )}

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            💡 Your feedback makes our AI smarter for everyone!
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
}

