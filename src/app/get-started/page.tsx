"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Container,
    Typography,
    Button, Grid,
    Stack,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Paper,
    Chip,
    Divider
} from '@mui/material';
import {
    Upload,
    SmartToy,
    Assessment,
    Calculate,
    CheckCircle,
    ArrowForward,
    PhotoCamera, Speed,
    Security
} from '@mui/icons-material';

const steps = [
  {
    title: "Upload Your Items",
    description: "Take photos or videos of your belongings",
    icon: <Upload />,
    details: "Simply snap pictures or record videos of your items. Our AI will identify and catalog everything automatically."
  },
  {
    title: "AI Analysis",
    description: "Let our smart AI analyze your items",
    icon: <SmartToy />,
    details: "Our advanced AI technology will identify each item, estimate dimensions, and create detailed descriptions."
  },
  {
    title: "Review & Edit",
    description: "Review and customize your inventory",
    icon: <Assessment />,
    details: "Check the AI's work, make adjustments, and add any missing details to perfect your inventory."
  },
  {
    title: "Get Pricing",
    description: "Receive accurate moving estimates",
    icon: <Calculate />,
    details: "Get instant pricing based on your inventory with detailed cost breakdowns and professional quotes."
  }
];

const features = [
  {
    icon: <PhotoCamera />,
    title: "Photo & Video Support",
    description: "Upload photos or videos - our AI handles both formats seamlessly"
  },
  {
    icon: <Speed />,
    title: "Lightning Fast",
    description: "Get your inventory in minutes, not hours of manual work"
  },
  {
    icon: <Security />,
    title: "Secure & Private",
    description: "Your data is encrypted and never shared with third parties"
  }
];

export default function GetStartedPage() {
  const [activeStep, setActiveStep] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

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
      background: 'linear-gradient(135deg, #28c2a0 0%, #1ea085 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <Box sx={{ 
        py: 4, 
        textAlign: 'center',
        color: 'white'
      }}>
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Welcome to BARRELEYES
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.9, mb: 2 }}>
            Smart Move Inventory Management
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, maxWidth: 600, mx: 'auto' }}>
            Transform your moving experience with AI-powered inventory management. 
            Create detailed inventories in minutes, not hours.
          </Typography>
        </Container>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {/* Left Side - How It Works */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, height: '100%' }}>
                <Typography variant="h4" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                  How It Works
                </Typography>
                
                <Stepper activeStep={activeStep} orientation="vertical">
                  {steps.map((step, index) => (
                    <Step key={step.title}>
                      <StepLabel
                        StepIconComponent={() => (
                          <Box sx={{ 
                            bgcolor: activeStep >= index ? 'primary.main' : 'grey.300',
                            color: 'white',
                            borderRadius: '50%',
                            width: 40,
                            height: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {step.icon}
                          </Box>
                        )}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {step.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {step.description}
                        </Typography>
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {step.details}
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Button
                            variant="contained"
                            onClick={handleNext}
                            sx={{ mr: 1 }}
                            disabled={index === steps.length - 1}
                          >
                            {index === steps.length - 1 ? 'Complete' : 'Next'}
                          </Button>
                          <Button
                            disabled={index === 0}
                            onClick={handleBack}
                          >
                            Back
                          </Button>
                        </Box>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </Paper>
            </Grid>

            {/* Right Side - Features */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, height: '100%' }}>
                <Typography variant="h4" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                  Why Choose BARRELEYES?
                </Typography>
                
                <Stack spacing={3}>
                  {features.map((feature, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box sx={{ 
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: 2,
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
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                          {feature.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {feature.description}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>

                <Divider sx={{ my: 4 }} />

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Ready to Get Started?
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Join thousands of users who have simplified their moving process
                  </Typography>
                  
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleGetStarted}
                    endIcon={<ArrowForward />}
                    sx={{ 
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(40, 194, 160, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(40, 194, 160, 0.4)',
                      }
                    }}
                  >
                    Start Creating Your Inventory
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Bottom Stats */}
          <Box sx={{ mt: 6, textAlign: 'center' }}>
            <Grid container spacing={3} justifyContent="center">
              <Grid item>
                <Chip 
                  label="10,000+ Items Processed" 
                  color="primary" 
                  variant="outlined"
                  icon={<CheckCircle />}
                />
              </Grid>
              <Grid item>
                <Chip 
                  label="99.5% Accuracy Rate" 
                  color="primary" 
                  variant="outlined"
                  icon={<CheckCircle />}
                />
              </Grid>
              <Grid item>
                <Chip 
                  label="5-Minute Setup" 
                  color="primary" 
                  variant="outlined"
                  icon={<CheckCircle />}
                />
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
