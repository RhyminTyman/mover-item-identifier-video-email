"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  Box,
  Container,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  NavigateNext,
  NavigateBefore,
  Check,
  CameraAlt,
  Business,
  Person
} from '@mui/icons-material';

const steps = ['Welcome', 'Your Role', 'Complete Setup'];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [role, setRole] = useState<string>('customer');
  const [companyName, setCompanyName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Check if user has already completed onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isLoaded || !user) return;

      try {
        const response = await fetch('/api/user/onboarding-status');
        if (response.ok) {
          const data = await response.json();
          if (data.onboarded) {
            router.push('/dashboard');
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboarding();
  }, [isLoaded, user, router]);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleComplete();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          companyName: role === 'company-admin' ? companyName : undefined,
          phoneNumber
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete onboarding');
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box textAlign="center" py={4}>
            <CameraAlt sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
            <Typography variant="h4" gutterBottom>
              Welcome to Barreleyes! 👋
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              The smart way to manage your moving inventory and get accurate quotes.
            </Typography>
            <Box sx={{ mt: 4, textAlign: 'left', maxWidth: 500, mx: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                What you can do:
              </Typography>
              <Typography variant="body2" paragraph>
                📸 <strong>Upload Photos & Videos</strong> - Capture your belongings with ease
              </Typography>
              <Typography variant="body2" paragraph>
                🤖 <strong>AI-Powered Analysis</strong> - Get instant item identification and estimates
              </Typography>
              <Typography variant="body2" paragraph>
                💰 <strong>Get Quotes</strong> - Receive accurate pricing from moving companies
              </Typography>
              <Typography variant="body2" paragraph>
                📊 <strong>Track Everything</strong> - Manage your inventory and quotes in one place
              </Typography>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box py={4}>
            <Typography variant="h5" gutterBottom textAlign="center" sx={{ mb: 4 }}>
              How will you be using Barreleyes?
            </Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>I am a...</InputLabel>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                label="I am a..."
              >
                <MenuItem value="customer">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Person />
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        Customer
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        I&apos;m planning a move and need quotes
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
                <MenuItem value="company-admin">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Business />
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        Moving Company Admin
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        I manage a moving company and want to receive quote requests
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            {role === 'company-admin' && (
              <TextField
                fullWidth
                label="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter your company name"
                helperText="We'll create a company profile for you"
                sx={{ mb: 3 }}
              />
            )}

            <Alert severity="info">
              You can change your role and settings later in your account settings.
            </Alert>
          </Box>
        );

      case 2:
        return (
          <Box py={4}>
            <Typography variant="h5" gutterBottom textAlign="center" sx={{ mb: 4 }}>
              Complete Your Profile
            </Typography>
            
            <TextField
              fullWidth
              label="Phone Number (Optional)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(123) 456-7890"
              helperText="We'll only use this for important updates about your moves or quotes"
              sx={{ mb: 3 }}
            />

            <Paper variant="outlined" sx={{ p: 3, backgroundColor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>
                Quick Start Guide:
              </Typography>
              {role === 'customer' ? (
                <>
                  <Typography variant="body2" paragraph>
                    1. Go to <strong>Analyze Photos</strong> to upload images of your belongings
                  </Typography>
                  <Typography variant="body2" paragraph>
                    2. Review the AI-identified items and add any missing ones
                  </Typography>
                  <Typography variant="body2" paragraph>
                    3. Submit your inventory to moving companies to get quotes
                  </Typography>
                  <Typography variant="body2" paragraph>
                    4. Compare quotes and choose the best option for your move
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="body2" paragraph>
                    1. Configure your <strong>Company Settings</strong> and pricing
                  </Typography>
                  <Typography variant="body2" paragraph>
                    2. Set up your <strong>CRM Integration</strong> (optional)
                  </Typography>
                  <Typography variant="body2" paragraph>
                    3. Review incoming <strong>Quote Requests</strong> from customers
                  </Typography>
                  <Typography variant="body2" paragraph>
                    4. Create and send quotes to win more customers
                  </Typography>
                </>
              )}
            </Paper>

            {error && (
              <Alert severity="error" sx={{ mt: 3 }}>
                {error}
              </Alert>
            )}
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  if (!isLoaded) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 400 }}>
          {getStepContent(activeStep)}
        </Box>

        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<NavigateBefore />}
          >
            Back
          </Button>

          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={activeStep === steps.length - 1 ? <Check /> : <NavigateNext />}
            disabled={loading || (activeStep === 1 && role === 'company-admin' && !companyName)}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : activeStep === steps.length - 1 ? (
              'Complete Setup'
            ) : (
              'Next'
            )}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

