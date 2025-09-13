"use client";

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  CircularProgress,
  Stack,
  Alert,
  Tabs,
  Tab,
  Grid,
  Avatar
} from '@mui/material';
import {
  Edit,
  Delete,
  PersonAdd,
  AdminPanelSettings,
  Person,
  Work,
  Send,
  Block,
  CheckCircle,
  Refresh,
  People
} from '@mui/icons-material';

interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'sales' | 'admin' | 'company-admin';
  createdAt: string;
  lastSignIn?: string;
  isActive?: boolean;
}

interface InviteData {
  email: string;
  firstName: string;
  lastName: string;
  role: 'sales' | 'admin' | 'company-admin';
  message?: string;
  companyInfo?: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone?: string;
    email?: string;
    website?: string;
  };
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<InviteData>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'sales',
    message: '',
    companyInfo: {
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
      website: ''
    }
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'company-admin': return 'secondary';
      case 'sales': return 'warning';
      case 'customer': return 'success';
      default: return 'default';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <AdminPanelSettings />;
      case 'company-admin': return <AdminPanelSettings />;
      case 'sales': return <Work />;
      case 'customer': return <Person />;
      default: return <Person />;
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 [Debug] Fetching users...');
      const response = await fetch('/api/admin/users');
      console.log('🔍 [Debug] Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 [Debug] API Error:', errorText);
        throw new Error(`Failed to fetch users: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      console.log('🔍 [Debug] Users data:', data);
      setUsers(data);
    } catch (err) {
      console.error('🔍 [Debug] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    console.log('🔍 [Debug] Edit user clicked:', user);
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async (updatedUser: Partial<User>) => {
    if (!selectedUser) return;
    
    try {
      setError(null);
      setActionLoading('update');
      const response = await fetch(`/api/admin/users/${selectedUser.clerkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
      
      const updatedUserData = await response.json();
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, ...updatedUserData } : user
      ));
      setEditDialogOpen(false);
      setSnackbarMessage('User updated successfully');
      setSnackbarOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) return;
    
    try {
      setError(null);
      setActionLoading(`delete-${user.id}`);
      const response = await fetch(`/api/admin/users/${user.clerkId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      setUsers(users.filter(u => u.id !== user.id));
      setSnackbarMessage('User deleted successfully');
      setSnackbarOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendInvite = async () => {
    try {
      setError(null);
      setActionLoading('invite');
      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteData)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to send invite');
      }
      
      setInviteDialogOpen(false);
      setInviteData({ 
        email: '', 
        firstName: '', 
        lastName: '', 
        role: 'sales', 
        message: '',
        companyInfo: {
          name: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          phone: '',
          email: '',
          website: ''
        }
      });
      
      // Handle email warning
      if (responseData.emailWarning) {
        setSnackbarMessage(`✅ User and company created successfully! ⚠️ Email failed: ${responseData.emailError}. Please contact the user directly.`);
      } else {
        setSnackbarMessage('Invitation sent successfully');
      }
      setSnackbarOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      setError(null);
      setActionLoading(`toggle-${user.id}`);
      const response = await fetch(`/api/admin/users/${user.clerkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user status');
      }
      
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, isActive: !u.isActive } : u
      ));
      setSnackbarMessage(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      setSnackbarOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const activeUsers = users.filter(user => user.isActive !== false);
  const inactiveUsers = users.filter(user => user.isActive === false);

  // Show empty state if no users
  if (!loading && users.length === 0) {
    return (
      <Box>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4" component="h1">
                User Management
              </Typography>
              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={fetchUsers}
                  disabled={loading}
                >
                  Refresh
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => {
                    console.log('🔍 [Debug] Invite button clicked');
                    setInviteDialogOpen(true);
                  }}
                >
                  Invite User
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    console.log('🔍 [Debug] Test button clicked');
                    console.log('🔍 [Debug] Current users:', users);
                    console.log('🔍 [Debug] Loading state:', loading);
                    console.log('🔍 [Debug] Error state:', error);
                  }}
                >
                  Test Debug
                </Button>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Empty State */}
            <Box 
              display="flex" 
              flexDirection="column" 
              alignItems="center" 
              justifyContent="center" 
              minHeight="400px"
              textAlign="center"
            >
              <People sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom color="text.secondary">
                No Users Found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
                There are no users in the system yet. Start by inviting sales users or check if there&apos;s a database connection issue.
              </Typography>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => setInviteDialogOpen(true)}
                size="large"
              >
                Invite First User
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1">
              User Management
            </Typography>
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchUsers}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => {
                  console.log('🔍 [Debug] Invite button clicked');
                  setInviteDialogOpen(true);
                }}
              >
                Invite User
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  console.log('🔍 [Debug] Test button clicked');
                  console.log('🔍 [Debug] Current users:', users);
                  console.log('🔍 [Debug] Loading state:', loading);
                  console.log('🔍 [Debug] Error state:', error);
                }}
              >
                Test Debug
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
            <Tab label={`Active Users (${activeUsers.length})`} />
            <Tab label={`Inactive Users (${inactiveUsers.length})`} />
          </Tabs>

          <TableContainer component={Paper}>
            {(activeTab === 0 ? activeUsers : inactiveUsers).length === 0 ? (
              <Box 
                display="flex" 
                flexDirection="column" 
                alignItems="center" 
                justifyContent="center" 
                minHeight="200px"
                textAlign="center"
                p={4}
              >
                <People sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom color="text.secondary">
                  {activeTab === 0 ? 'No Active Users' : 'No Inactive Users'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activeTab === 0 
                    ? 'All users are currently inactive or there are no users yet.' 
                    : 'No users have been deactivated yet.'
                  }
                </Typography>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Last Sign In</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(activeTab === 0 ? activeUsers : inactiveUsers).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            {getRoleIcon(user.role)}
                            <Typography variant="caption" color="text.secondary">
                              {user.role}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={getRoleColor(user.role) as "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {user.lastSignIn ? new Date(user.lastSignIn).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive === false ? 'Inactive' : 'Active'}
                        color={user.isActive === false ? 'error' : 'success'}
                        size="small"
                        icon={user.isActive === false ? <Block /> : <CheckCircle />}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        onClick={() => handleEditUser(user)} 
                        size="small"
                        disabled={actionLoading !== null}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleToggleUserStatus(user)} 
                        size="small"
                        color={user.isActive === false ? 'success' : 'warning'}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === `toggle-${user.id}` ? (
                          <CircularProgress size={16} />
                        ) : user.isActive === false ? (
                          <CheckCircle />
                        ) : (
                          <Block />
                        )}
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDeleteUser(user)} 
                        size="small"
                        color="error"
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === `delete-${user.id}` ? (
                          <CircularProgress size={16} />
                        ) : (
                          <Delete />
                        )}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="First Name"
                defaultValue={selectedUser.firstName}
                fullWidth
                onChange={(e) => setSelectedUser({...selectedUser, firstName: e.target.value})}
              />
              <TextField
                label="Last Name"
                defaultValue={selectedUser.lastName}
                fullWidth
                onChange={(e) => setSelectedUser({...selectedUser, lastName: e.target.value})}
              />
              <TextField
                label="Email"
                defaultValue={selectedUser.email}
                fullWidth
                disabled
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value as 'customer' | 'sales' | 'admin' | 'company-admin'})}
                >
                  <MenuItem value="customer">Customer</MenuItem>
                  <MenuItem value="sales">Sales</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="company-admin">Company Admin</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setEditDialogOpen(false)}
            disabled={actionLoading === 'update'}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => selectedUser && handleUpdateUser(selectedUser)} 
            variant="contained"
            disabled={actionLoading === 'update'}
            startIcon={actionLoading === 'update' ? <CircularProgress size={16} /> : null}
          >
            {actionLoading === 'update' ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite New User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="First Name"
                  value={inviteData.firstName}
                  onChange={(e) => setInviteData({...inviteData, firstName: e.target.value})}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Last Name"
                  value={inviteData.lastName}
                  onChange={(e) => setInviteData({...inviteData, lastName: e.target.value})}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>
            <TextField
              label="Email"
              type="email"
              value={inviteData.email}
              onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={inviteData.role}
                onChange={(e) => setInviteData({...inviteData, role: e.target.value as 'sales' | 'admin' | 'company-admin'})}
              >
                <MenuItem value="sales">Sales</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="company-admin">Company Admin</MenuItem>
              </Select>
            </FormControl>
            
            {/* Company Information Fields - Only show for company-admin role */}
            {inviteData.role === 'company-admin' && (
              <>
                <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                  Company Information
                </Typography>
                <TextField
                  label="Company Name"
                  value={inviteData.companyInfo?.name || ''}
                  onChange={(e) => setInviteData({
                    ...inviteData, 
                    companyInfo: {...inviteData.companyInfo!, name: e.target.value}
                  })}
                  fullWidth
                  required
                />
                <TextField
                  label="Address"
                  value={inviteData.companyInfo?.address || ''}
                  onChange={(e) => setInviteData({
                    ...inviteData, 
                    companyInfo: {...inviteData.companyInfo!, address: e.target.value}
                  })}
                  fullWidth
                  required
                />
                <Grid container spacing={2}>
                  <Grid item xs={8}>
                    <TextField
                      label="City"
                      value={inviteData.companyInfo?.city || ''}
                      onChange={(e) => setInviteData({
                        ...inviteData, 
                        companyInfo: {...inviteData.companyInfo!, city: e.target.value}
                      })}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      label="State"
                      value={inviteData.companyInfo?.state || ''}
                      onChange={(e) => setInviteData({
                        ...inviteData, 
                        companyInfo: {...inviteData.companyInfo!, state: e.target.value}
                      })}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      label="ZIP"
                      value={inviteData.companyInfo?.zipCode || ''}
                      onChange={(e) => setInviteData({
                        ...inviteData, 
                        companyInfo: {...inviteData.companyInfo!, zipCode: e.target.value}
                      })}
                      fullWidth
                      required
                    />
                  </Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <TextField
                      label="Phone (Optional)"
                      value={inviteData.companyInfo?.phone || ''}
                      onChange={(e) => setInviteData({
                        ...inviteData, 
                        companyInfo: {...inviteData.companyInfo!, phone: e.target.value}
                      })}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="Email (Optional)"
                      type="email"
                      value={inviteData.companyInfo?.email || ''}
                      onChange={(e) => setInviteData({
                        ...inviteData, 
                        companyInfo: {...inviteData.companyInfo!, email: e.target.value}
                      })}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="Website (Optional)"
                      value={inviteData.companyInfo?.website || ''}
                      onChange={(e) => setInviteData({
                        ...inviteData, 
                        companyInfo: {...inviteData.companyInfo!, website: e.target.value}
                      })}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </>
            )}
            
            <TextField
              label="Personal Message (Optional)"
              multiline
              rows={3}
              value={inviteData.message}
              onChange={(e) => setInviteData({...inviteData, message: e.target.value})}
              fullWidth
              placeholder="Add a personal message to the invitation..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setInviteDialogOpen(false)}
            disabled={actionLoading === 'invite'}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSendInvite} 
            variant="contained"
            startIcon={actionLoading === 'invite' ? <CircularProgress size={16} /> : <Send />}
            disabled={
              !inviteData.email || 
              !inviteData.firstName || 
              !inviteData.lastName || 
              actionLoading === 'invite' ||
              (inviteData.role === 'company-admin' && (
                !inviteData.companyInfo?.name ||
                !inviteData.companyInfo?.address ||
                !inviteData.companyInfo?.city ||
                !inviteData.companyInfo?.state ||
                !inviteData.companyInfo?.zipCode
              ))
            }
          >
            {actionLoading === 'invite' ? 'Sending...' : 'Send Invitation'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}