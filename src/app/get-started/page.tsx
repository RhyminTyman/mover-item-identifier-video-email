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
        py: 3, 
        textAlign: 'center',
        backgroundColor: 'white'
      }}>
        <Container maxWidth="md">
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <Avatar
              sx={{
                width: 45,
                height: 45,
                mr: 1.5,
                background: 'linear-gradient(135deg, #4CAF50 0%, #2196F3 100%)',
                borderRadius: 2
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
                B
              </Typography>
            </Avatar>
            <Typography variant="h4" component="h1" sx={{ 
              fontWeight: 700, 
              color: '#333',
              letterSpacing: '0.05em'
            }}>
              BARRELEYES
            </Typography>
          </Box>

          <Typography variant="h3" component="h1" gutterBottom sx={{ 
            fontWeight: 700, 
            color: '#333',
            mb: 2,
            fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' }
          }}>
            See your inventory clearly— before you lift a finger.
          </Typography>
          
          <Typography variant="body1" sx={{ 
            color: '#666',
            maxWidth: 700,
            mx: 'auto',
            lineHeight: 1.5,
            mb: 3,
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}>
            Barreleyes uses AI vision to auto-detect items, estimate volume & weight, and generate move-ready manifests. Faster quotes, fewer surprises, happier customers.
          </Typography>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 3, backgroundColor: 'white' }}>
        <Container maxWidth="md">
          <Stack spacing={2.5}>
            {features.map((feature, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ 
                  bgcolor: '#4CAF50',
                  color: 'white',
                  borderRadius: '50%',
                  p: 1,
                  minWidth: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {feature.icon}
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ 
                    fontWeight: 600,
                    color: '#333',
                    mb: 0.5,
                    fontSize: { xs: '1rem', sm: '1.1rem' }
                  }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#666',
                    lineHeight: 1.4,
                    fontSize: { xs: '0.85rem', sm: '0.9rem' }
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
      <Box sx={{ py: 3, backgroundColor: 'white', textAlign: 'center' }}>
        <Container maxWidth="sm">
          <Button
            variant="contained"
            size="large"
            onClick={handleGetStarted}
            sx={{ 
              px: 4,
              py: 1.5,
              fontSize: { xs: '1rem', sm: '1.1rem' },
              fontWeight: 600,
              borderRadius: 2,
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
        py: 3, 
        backgroundColor: 'white',
        textAlign: 'center'
      }}>
        <Container maxWidth="lg">
          <Box sx={{
            width: '100%',
            height: { xs: 250, sm: 300, md: 350 },
            backgroundColor: '#f5f5f5',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed #ddd'
          }}>
            <Typography variant="body1" color="text.secondary">
              Sample Room Image
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
