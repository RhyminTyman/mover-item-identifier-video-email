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
} from "@mui/material";
import { useUser } from "@clerk/nextjs";

export function AccountManagement() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
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
  });

  // Update form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        emailAddress: user.emailAddresses[0]?.emailAddress || "",
        phoneNumber: user.phoneNumbers[0]?.phoneNumber || "",
      });
    }
  }, [user]);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
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

      </Grid>

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
