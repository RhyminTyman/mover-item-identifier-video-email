"use client";

import { useState, useEffect } from "react";
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Alert,
  CircularProgress,
  Chip
} from "@mui/material";
import { useUser } from "@clerk/nextjs";

export default function DebugPanel() {
  const { user, isLoaded } = useUser();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDebugChecks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const checks = {
        user: {
          isLoaded,
          isSignedIn: !!user,
          userId: user?.id,
          email: user?.emailAddresses?.[0]?.emailAddress,
          firstName: user?.firstName,
          lastName: user?.lastName,
        },
        api: {
          users: null,
          userRole: null,
          database: null,
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          hasClerkKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        }
      };

      // Test API endpoints
      try {
        const usersResponse = await fetch('/api/admin/users');
        checks.api.users = {
          status: usersResponse.status,
          ok: usersResponse.ok,
          error: usersResponse.ok ? null : await usersResponse.text()
        };
      } catch (err) {
        checks.api.users = { error: err instanceof Error ? err.message : 'Unknown error' };
      }

      try {
        const roleResponse = await fetch('/api/user/role');
        checks.api.userRole = {
          status: roleResponse.status,
          ok: roleResponse.ok,
          data: roleResponse.ok ? await roleResponse.json() : await roleResponse.text()
        };
      } catch (err) {
        checks.api.userRole = { error: err instanceof Error ? err.message : 'Unknown error' };
      }

      try {
        const dbResponse = await fetch('/api/debug/db');
        checks.api.database = {
          status: dbResponse.status,
          ok: dbResponse.ok,
          data: dbResponse.ok ? await dbResponse.json() : await dbResponse.text()
        };
      } catch (err) {
        checks.api.database = { error: err instanceof Error ? err.message : 'Unknown error' };
      }

      setDebugInfo(checks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDebugChecks();
  }, []);

  if (!isLoaded) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Debug Information</Typography>
          <Button 
            variant="outlined" 
            onClick={runDebugChecks}
            disabled={loading}
            size="small"
          >
            {loading ? <CircularProgress size={20} /> : 'Refresh'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {debugInfo && (
          <Box>
            {/* User Info */}
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>User Information</Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                <Chip 
                  label={`Loaded: ${debugInfo.user.isLoaded}`} 
                  color={debugInfo.user.isLoaded ? 'success' : 'error'} 
                />
                <Chip 
                  label={`Signed In: ${debugInfo.user.isSignedIn}`} 
                  color={debugInfo.user.isSignedIn ? 'success' : 'error'} 
                />
                <Chip 
                  label={`User ID: ${debugInfo.user.userId || 'None'}`} 
                  color={debugInfo.user.userId ? 'success' : 'error'} 
                />
              </Box>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Email: {debugInfo.user.email || 'None'}<br/>
                Name: {debugInfo.user.firstName} {debugInfo.user.lastName}
              </Typography>
            </Box>

            {/* API Status */}
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>API Status</Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                <Chip 
                  label={`Users API: ${debugInfo.api.users?.ok ? 'OK' : 'Error'}`} 
                  color={debugInfo.api.users?.ok ? 'success' : 'error'} 
                />
                <Chip 
                  label={`Role API: ${debugInfo.api.userRole?.ok ? 'OK' : 'Error'}`} 
                  color={debugInfo.api.userRole?.ok ? 'success' : 'error'} 
                />
                <Chip 
                  label={`Database: ${debugInfo.api.database?.ok ? 'OK' : 'Error'}`} 
                  color={debugInfo.api.database?.ok ? 'success' : 'error'} 
                />
              </Box>
            </Box>

            {/* Environment */}
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>Environment</Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                <Chip 
                  label={`NODE_ENV: ${debugInfo.environment.nodeEnv}`} 
                  color="info" 
                />
                <Chip 
                  label={`Database URL: ${debugInfo.environment.hasDatabaseUrl ? 'Set' : 'Missing'}`} 
                  color={debugInfo.environment.hasDatabaseUrl ? 'success' : 'error'} 
                />
                <Chip 
                  label={`Clerk Key: ${debugInfo.environment.hasClerkKey ? 'Set' : 'Missing'}`} 
                  color={debugInfo.environment.hasClerkKey ? 'success' : 'error'} 
                />
              </Box>
            </Box>

            {/* Detailed API Responses */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>API Response Details</Typography>
              <pre style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '10px', 
                borderRadius: '4px', 
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '300px'
              }}>
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
