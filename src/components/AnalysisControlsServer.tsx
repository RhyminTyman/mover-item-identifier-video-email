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
import { PlayArrow, Save, Refresh } from '@mui/icons-material';
import { analyzeFiles, saveInventory, updateTitle, updateNote, resetAnalysis } from '@/app/actions/analysis-actions';
import { LocalFile, Analysis } from '@/app/actions/state-actions';

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
  const isAnalyzing = phase !== "idle" && phase !== "complete" && phase !== "error";
  const canAnalyze = files.length > 0 && !isAnalyzing && !result;
  const canSave = result && !saving;

  const handleAnalyze = async () => {
    await analyzeFiles();
  };

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
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              size="large"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Files'}
            </Button>

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
