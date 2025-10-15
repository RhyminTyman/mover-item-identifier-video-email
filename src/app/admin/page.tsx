"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Paper,
  Typography,
  CircularProgress
} from '@mui/material';
import UserManagement from '@/components/admin/UserManagement';
import CompanyManagement from '@/components/admin/CompanyManagement';
import { useUser } from '@clerk/nextjs';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isSignedIn } = useUser();
  const router = useRouter();

  // Fetch user role and check if admin
  useEffect(() => {
    const loadUserRole = async () => {
      if (!isSignedIn) {
        router.push('/sign-in');
        return;
      }

      if (user) {
        try {
          const response = await fetch('/api/user/role');
          if (response.ok) {
            const data = await response.json();
            setUserRole(data.role);
            
            // Redirect if not admin
            if (data.role !== 'admin') {
              router.push('/dashboard');
            }
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          router.push('/dashboard');
        } finally {
          setLoading(false);
        }
      }
    };
    loadUserRole();
  }, [user, isSignedIn, router]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (userRole !== 'admin') {
    return null; // Router will redirect
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 3 }}>
        Admin Panel
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="User Management" />
          <Tab label="Company Management" />
        </Tabs>
      </Paper>

      <Box>
        {activeTab === 0 && <UserManagement />}
        {activeTab === 1 && <CompanyManagement />}
      </Box>
    </Container>
  );
}

