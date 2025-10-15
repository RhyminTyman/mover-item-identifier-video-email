'use client';

import { useEffect } from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Error as ErrorIcon, Refresh, Home } from '@mui/icons-material';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Application error:', error);
    }

    // TODO: Log to error tracking service (Sentry)
    // logErrorToService(error);
  }, [error]);

  return (
    <Container maxWidth="md">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        textAlign="center"
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            maxWidth: 600,
            width: '100%'
          }}
        >
          <ErrorIcon
            sx={{
              fontSize: 80,
              color: 'error.main',
              mb: 2
            }}
          />
          
          <Typography variant="h4" component="h1" gutterBottom>
            Oops! Something went wrong
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            We're sorry, but something unexpected happened. Our team has been notified and is working on it.
          </Typography>

          {process.env.NODE_ENV === 'development' && error.message && (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 3,
                backgroundColor: 'grey.50',
                textAlign: 'left',
                overflow: 'auto'
              }}
            >
              <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {error.message}
              </Typography>
            </Paper>
          )}

          {error.digest && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
              Error ID: {error.digest}
            </Typography>
          )}

          <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={reset}
            >
              Try Again
            </Button>
            
            <Button
              variant="outlined"
              component={Link}
              href="/"
              startIcon={<Home />}
            >
              Go Home
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
            If this problem persists, please contact support
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

