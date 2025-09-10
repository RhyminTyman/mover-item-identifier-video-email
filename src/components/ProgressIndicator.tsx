import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  AlertTitle,
  Stepper,
  Step,
  StepLabel,
  StepIcon,
  Stack,
} from '@mui/material';
import {
  CloudUpload,
  Psychology,
  CheckCircle,
  Error,
} from '@mui/icons-material';

interface ProgressIndicatorProps {
  phase: string;
  progress: number;
  error: string | null;
}

const steps = [
  { id: 'uploading', label: 'Uploading Files', icon: CloudUpload },
  { id: 'analyzing', label: 'Analyzing Images', icon: Psychology },
  { id: 'complete', label: 'Complete', icon: CheckCircle },
];

export default function ProgressIndicator({ phase, progress, error }: ProgressIndicatorProps) {
  const getCurrentStepIndex = () => {
    switch (phase) {
      case 'uploading':
        return 0;
      case 'analyzing':
        return 1;
      case 'complete':
        return 2;
      default:
        return -1;
    }
  };

  const currentStepIndex = getCurrentStepIndex();
  const activeStep = Math.max(0, currentStepIndex);

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>Analysis Failed</AlertTitle>
        {error}
      </Alert>
    );
  }

  if (phase === 'idle') {
    return null;
  }

  const getStatusMessage = () => {
    switch (phase) {
      case 'uploading':
        return 'Uploading your files to the cloud...';
      case 'analyzing':
        return 'AI is analyzing your images to identify items...';
      case 'complete':
        return 'Analysis complete! Review the results below.';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          {/* Progress Bar */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(progress)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Steps */}
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;

              return (
                <Step key={step.id} completed={isCompleted}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isCompleted
                            ? 'success.main'
                            : isActive
                            ? 'primary.main'
                            : 'grey.300',
                          color: isCompleted || isActive ? 'white' : 'grey.500',
                          transition: 'all 0.3s',
                        }}
                      >
                        <Icon sx={{ fontSize: 20 }} />
                      </Box>
                    )}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: isActive || isCompleted ? 'text.primary' : 'text.secondary',
                        fontWeight: isActive ? 'medium' : 'normal',
                      }}
                    >
                      {step.label}
                    </Typography>
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>

          {/* Current Status */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {getStatusMessage()}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}