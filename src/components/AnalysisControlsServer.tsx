"use client";

import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Stack, 
  TextField,
  Box
} from '@mui/material';
import { Save, Refresh } from '@mui/icons-material';
import { saveInventory } from '@/app/actions/analysis-actions';
import { updateTitle, updateNote, resetAnalysis, getAppState } from '@/app/actions/state-actions';
import { LocalFile, Analysis } from '@/app/actions/state-actions';
import { CustomerSelector } from './CustomerSelector';
import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

interface AnalysisControlsServerProps {
  files: LocalFile[];
  result: Analysis | null;
  title: string;
  note: string;
  saving: boolean;
  phase: string;
}

export default function AnalysisControlsServer({ 
  files, 
  result, 
  title, 
  note, 
  saving, 
  phase 
}: AnalysisControlsServerProps) {
  const { user } = useUser();
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('customer');
  
  const isAnalyzing = phase !== "idle" && phase !== "complete" && phase !== "error";
  const canAnalyze = files.length > 0 && !isAnalyzing && !result;
  const canSave = result && !saving;
  const isSalesUser = userRole === 'sales' || userRole === 'admin';

  useEffect(() => {
    const loadState = async () => {
      const state = await getAppState();
      setCurrentCustomerId(state.customerId);
    };
    loadState();
  }, []);

  useEffect(() => {
    const loadUserRole = async () => {
      if (user) {
        try {
          const response = await fetch('/api/user/role');
          if (response.ok) {
            const data = await response.json();
            setUserRole(data.role);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
    };
    loadUserRole();
  }, [user]);


  const handleSave = async () => {
    await saveInventory();
  };

  const handleReset = async () => {
    await resetAnalysis();
  };

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await updateTitle(e.target.value);
  };

  const handleNoteChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await updateNote(e.target.value);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Analysis Controls
        </Typography>
        
        <Stack spacing={3}>
          {/* Customer Selector for Sales Users */}
          {isSalesUser && (
            <CustomerSelector currentCustomerId={currentCustomerId} />
          )}

          {/* Title and Note Inputs */}
          <Box>
            <TextField
              fullWidth
              label="Inventory Title"
              value={title}
              onChange={handleTitleChange}
              disabled={isAnalyzing || saving}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Notes (Optional)"
              value={note}
              onChange={handleNoteChange}
              multiline
              rows={2}
              disabled={isAnalyzing || saving}
            />
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {result && (
              <Button
                variant="contained"
                color="success"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={!canSave}
                size="large"
              >
                {saving ? 'Saving...' : 'Save Inventory'}
              </Button>
            )}

            {(result || files.length > 0) && (
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleReset}
                disabled={isAnalyzing || saving}
                size="large"
              >
                Start Over
              </Button>
            )}
          </Stack>

          {/* Status Messages */}
          {files.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Upload some files to get started
            </Typography>
          )}

          {files.length > 0 && !result && !isAnalyzing && (
            <Typography variant="body2" color="text.secondary">
              Ready to analyze {files.length} file{files.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
