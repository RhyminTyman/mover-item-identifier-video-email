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
  CircularProgress,
  Alert
} from '@mui/material';
import CompanyInfo from '@/components/company-admin/CompanyInfo';
import CompanyInventories from '@/components/company-admin/CompanyInventories';
import CrmSettings from '@/components/company-admin/CrmSettings';
import { useUser } from '@clerk/nextjs';

export default function CompanyAdminPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isSignedIn } = useUser();
  const router = useRouter();

  // Fetch user role and check if company admin
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
            
            // Redirect if not company admin
            if (data.role !== 'company-admin') {
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

  if (userRole !== 'company-admin') {
    return null; // Router will redirect
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 3 }}>
        Company Admin Dashboard
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Company Information" />
          <Tab label="Quote Requests" />
          <Tab label="CRM Settings" />
        </Tabs>
      </Paper>

      <Box>
        {activeTab === 0 && <CompanyInfo />}
        {activeTab === 1 && <CompanyInventories />}
        {activeTab === 2 && <CrmSettings />}
      </Box>
    </Container>
  );
}
