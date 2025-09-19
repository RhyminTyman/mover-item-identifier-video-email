"use client";

import { useRouter } from 'next/navigation';
import {
    Box,
    Container,
    Typography,
    Button, Stack
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
      console.log('🔍 [GET_STARTED] Starting onboarding request...');
      
      const response = await fetch('/api/user/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 [GET_STARTED] Response status:', response.status);
      console.log('🔍 [GET_STARTED] Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [GET_STARTED] Onboarding successful:', data);
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        console.error('❌ [GET_STARTED] Failed to mark user as onboarded:', errorData);
        // Still redirect to dashboard even if API call fails
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('❌ [GET_STARTED] Error marking user as onboarded:', error);
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
            <Box
              component="img"
              src="https://move-photos.s3.us-east-2.amazonaws.com/images/1758257486270-barreleyes-logo.png"
              alt="BARRELEYES Logo"
              sx={{
                height: 60,
                width: 'auto',
                mr: 2
              }}
            />
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
                  bgcolor: '#008080',
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
              backgroundColor: '#008080',
              boxShadow: '0 4px 12px rgba(0, 128, 128, 0.3)',
              '&:hover': {
                backgroundColor: '#006666',
                boxShadow: '0 6px 16px rgba(0, 128, 128, 0.4)',
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
            borderRadius: 2,
            overflow: 'hidden',
            position: 'relative'
          }}>
            <Box
              component="img"
              src="https://move-photos.s3.us-east-2.amazonaws.com/images/1758257486270-bed-bench.png"
              alt="Sample bedroom with furniture items"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
