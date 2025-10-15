"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from "@mui/material";
import { Download, DeleteForever, Warning } from '@mui/icons-material';
import { useUser } from "@clerk/nextjs";
import AddressForm from "../AddressForm";

export function AccountManagement() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    emailAddress: "",
    phoneNumber: "",
    address: {
      street1: "",
      street2: "",
      city: "",
      stateId: "",
      zipCode: "",
      country: "US",
    },
  });

  // Update form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        emailAddress: user.emailAddresses[0]?.emailAddress || "",
        phoneNumber: user.phoneNumbers[0]?.phoneNumber || "",
        address: {
          street1: "",
          street2: "",
          city: "",
          stateId: "",
          zipCode: "",
          country: "US",
        },
      });
    }
  }, [user]);

  // Load user's address from database
  useEffect(() => {
    const loadAddress = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/addresses');
        if (response.ok) {
          const addresses = await response.json();
          if (addresses.length > 0) {
            const primaryAddress = addresses[0]; // Use the most recent address
            setFormData(prev => ({
              ...prev,
              address: {
                street1: primaryAddress.street1,
                street2: primaryAddress.street2 || "",
                city: primaryAddress.city,
                stateId: primaryAddress.stateId,
                zipCode: primaryAddress.zipCode,
                country: primaryAddress.country || "US",
              },
            }));
          }
        }
      } catch (error) {
        console.error('Error loading address:', error);
      }
    };

    loadAddress();
  }, [user]);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleAddressChange = (address: {
    street1: string;
    street2?: string;
    city: string;
    stateId: string;
    zipCode: string;
    country?: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      address: {
        street1: address.street1,
        street2: address.street2 || "",
        city: address.city,
        stateId: address.stateId,
        zipCode: address.zipCode,
        country: address.country || "US",
      }
    }));
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Update user profile
      await user.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      // Save address to database
      const addressResponse = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData.address),
      });

      if (!addressResponse.ok) {
        throw new Error('Failed to save address');
      }

      setSnackbar({
        open: true,
        message: "Profile updated successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      setSnackbar({
        open: true,
        message: "Failed to update profile. Please try again.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    try {
      // Redirect to Clerk's password change page
      window.location.href = "/user-profile";
    } catch (error) {
      console.error("Error changing password:", error);
      setSnackbar({
        open: true,
        message: "Failed to open password change page.",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/export-data');
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `barreleyes-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: "Data exported successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      setSnackbar({
        open: true,
        message: "Failed to export data. Please try again.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== user?.emailAddresses[0]?.emailAddress) {
      setSnackbar({
        open: true,
        message: "Email confirmation does not match.",
        severity: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmEmail: deleteConfirmEmail,
          reason: 'User requested deletion'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }

      // Redirect to sign-out
      window.location.href = '/sign-in';
    } catch (error) {
      console.error("Error deleting account:", error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : "Failed to delete account.",
        severity: "error",
      });
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Account Management
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your account settings, profile information, and security preferences.
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profile Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Update your personal information and contact details.
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={formData.firstName}
                    onChange={handleInputChange("firstName")}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={formData.lastName}
                    onChange={handleInputChange("lastName")}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    value={formData.emailAddress}
                    disabled
                    helperText="Email address cannot be changed here. Contact support if needed."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={formData.phoneNumber}
                    disabled
                    helperText="Phone number cannot be changed here. Contact support if needed."
                  />
                </Grid>
                <Grid item xs={12}>
                  <AddressForm
                    value={formData.address}
                    onChange={handleAddressChange}
                    label="Address"
                    helperText="This address will be used for moving estimates and calculations"
                    disabled={loading}
                    required
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? "Updating..." : "Update Profile"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Security Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manage your password and security preferences.
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" gutterBottom>
                  Password
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Change your password to keep your account secure.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleChangePassword}
                  disabled={loading}
                >
                  Change Password
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="body1" gutterBottom>
                  Two-Factor Authentication
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Add an extra layer of security to your account.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => window.location.href = "/user-profile"}
                  disabled={loading}
                >
                  Manage 2FA
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Data & Privacy */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Data & Privacy
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Export or delete your personal data (GDPR compliance).
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" gutterBottom>
                  Export Your Data
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Download all your data in JSON format, including inventories, items, and photos.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleExportData}
                  disabled={loading}
                >
                  Export My Data
                </Button>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box>
                <Typography variant="body1" gutterBottom color="error">
                  Danger Zone
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Permanently delete your account and all associated data. This action cannot be undone.
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteForever />}
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={loading}
                >
                  Delete Account
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* Delete Account Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          Delete Account
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            This will permanently delete your account and all associated data, including:
          </DialogContentText>
          <DialogContentText component="ul" sx={{ pl: 4, mb: 3 }}>
            <li>All inventories and items</li>
            <li>All uploaded photos and videos</li>
            <li>All quote requests</li>
            <li>Your profile information</li>
          </DialogContentText>
          <Alert severity="error" sx={{ mb: 3 }}>
            <strong>This action cannot be undone!</strong>
          </Alert>
          <TextField
            fullWidth
            label="Confirm your email to delete"
            value={deleteConfirmEmail}
            onChange={(e) => setDeleteConfirmEmail(e.target.value)}
            placeholder={user?.emailAddresses[0]?.emailAddress}
            helperText={`Type "${user?.emailAddresses[0]?.emailAddress}" to confirm`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeleteDialogOpen(false);
            setDeleteConfirmEmail('');
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            disabled={loading || deleteConfirmEmail !== user?.emailAddresses[0]?.emailAddress}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteForever />}
          >
            {loading ? 'Deleting...' : 'Delete My Account'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
