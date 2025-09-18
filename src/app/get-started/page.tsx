"use client";

import { useRouter } from 'next/navigation';
import {
    Box,
    Container,
    Typography,
    Button, Stack, Avatar
} from '@mui/material';
import {
    PhotoCamera,
    Speed,
    Security
} from '@mui/icons-material';

const features = [
  {
    icon: <PhotoCamera />,
    title: "Instant item recognition",
    description: "Upload a short video or photos—get a structured inventory in seconds."
  },
  {
    icon: <Speed />,
    title: "Accurate volume & weight",
    description: "AI estimates cubic footage and weight to power transparent pricing."
  },
  {
    icon: <Security />,
    title: "Seamless exports",
    description: "Push results to your CRM or download as PDF/CSV for your ops team"
  }
];

export default function GetStartedPage() {
  const router = useRouter();

  const handleGetStarted = async () => {
    // Mark user as onboarded and redirect to dashboard
    try {
      const response = await fetch('/api/user/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        console.error('Failed to mark user as onboarded');
        // Still redirect to dashboard even if API call fails
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error marking user as onboarded:', error);
      // Still redirect to dashboard even if API call fails
      router.push('/dashboard');
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header with Logo */}
      <Box sx={{ 
        py: 6, 
        textAlign: 'center',
        backgroundColor: 'white'
      }}>
        <Container maxWidth="md">
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
            <Avatar
              sx={{
                width: 60,
                height: 60,
                mr: 2,
                background: 'linear-gradient(135deg, #4CAF50 0%, #2196F3 100%)',
                borderRadius: 3
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                B
              </Typography>
            </Avatar>
            <Typography variant="h3" component="h1" sx={{ 
              fontWeight: 700, 
              color: '#333',
              letterSpacing: '0.1em'
            }}>
              BARRELEYES
            </Typography>
          </Box>

          <Typography variant="h2" component="h1" gutterBottom sx={{ 
            fontWeight: 700, 
            color: '#333',
            mb: 3,
            fontSize: { xs: '2.5rem', md: '3.5rem' }
          }}>
            See your inventory clearly— before you lift a finger.
          </Typography>
          
          <Typography variant="h6" sx={{ 
            color: '#666',
            maxWidth: 800,
            mx: 'auto',
            lineHeight: 1.6,
            mb: 6
          }}>
            Barreleyes uses AI vision to auto-detect items, estimate volume & weight, and generate move-ready manifests. Faster quotes, fewer surprises, happier customers.
          </Typography>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 6, backgroundColor: 'white' }}>
        <Container maxWidth="md">
          <Stack spacing={4}>
            {features.map((feature, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                <Box sx={{ 
                  bgcolor: '#4CAF50',
                  color: 'white',
                  borderRadius: '50%',
                  p: 1.5,
                  minWidth: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {feature.icon}
                </Box>
                <Box>
                  <Typography variant="h5" gutterBottom sx={{ 
                    fontWeight: 600,
                    color: '#333',
                    mb: 1
                  }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: '#666',
                    lineHeight: 1.6
                  }}>
                    {feature.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 6, backgroundColor: 'white', textAlign: 'center' }}>
        <Container maxWidth="sm">
          <Button
            variant="contained"
            size="large"
            onClick={handleGetStarted}
            sx={{ 
              px: 6,
              py: 2,
              fontSize: '1.2rem',
              fontWeight: 600,
              borderRadius: 3,
              backgroundColor: '#1976d2',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                backgroundColor: '#1565c0',
                boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
              }
            }}
          >
            Get started
          </Button>
        </Container>
      </Box>

      {/* Bottom Image Placeholder */}
      <Box sx={{ 
        py: 6, 
        backgroundColor: 'white',
        textAlign: 'center'
      }}>
        <Container maxWidth="lg">
          <Box sx={{
            width: '100%',
            height: 400,
            backgroundColor: '#f5f5f5',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed #ddd'
          }}>
            <Typography variant="h6" color="text.secondary">
              Sample Room Image
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
