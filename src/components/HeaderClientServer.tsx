"use client";

import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Box
} from '@mui/material';
import { 
  LightMode, 
  DarkMode, 
  Menu as MenuIcon, 
  Close, 
  CameraAlt, 
  List,
  Login,
  Logout,
  Dashboard,
  AccountCircle
} from '@mui/icons-material';
import { setActiveTab } from '@/app/actions/state-actions';
import { useTheme } from '@/app/theme/ThemeRegistry';
import { useUser, useClerk } from '@clerk/nextjs';
import Link from 'next/link';

interface HeaderClientServerProps {
  activeTab: 'analyze' | 'inventories';
}

export default function HeaderClientServer({ activeTab }: HeaderClientServerProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);
  const { mode: theme, toggleTheme } = useTheme();
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTabChange = async (tab: 'analyze' | 'inventories') => {
    await setActiveTab(tab);
    handleMenuClose();
  };

  const handleThemeToggle = () => {
    toggleTheme();
    handleMenuClose();
  };

  const handleSignOut = () => {
    signOut();
    handleMenuClose();
  };

  return (
    <AppBar position="static" elevation={0} sx={{ backgroundColor: 'background.paper' }}>
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ flexGrow: 1, color: 'text.primary' }}
        >
          Smart Move Inventory
        </Typography>

        {/* Authentication Buttons */}
        {isSignedIn ? (
          <Button
            component={Link}
            href="/dashboard"
            startIcon={<Dashboard />}
            sx={{ mr: 2, color: 'text.primary' }}
          >
            Dashboard
          </Button>
        ) : (
          <Button
            component={Link}
            href="/sign-in"
            startIcon={<Login />}
            sx={{ mr: 2, color: 'text.primary' }}
          >
            Sign In
          </Button>
        )}

        {/* Hamburger Menu Button */}
        <IconButton
          edge="end"
          color="inherit"
          aria-label="Menu"
          onClick={handleMenuClick}
          sx={{ color: 'text.secondary' }}
        >
          {isMenuOpen ? <Close /> : <MenuIcon />}
        </IconButton>

        {/* Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={isMenuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: { 
              minWidth: 220,
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column'
            }
          }}
        >
          {/* Main Navigation Items */}
          <MenuItem
            onClick={() => handleTabChange('analyze')}
            selected={activeTab === 'analyze'}
            sx={{ py: 1.5 }}
          >
            <ListItemIcon>
              <CameraAlt />
            </ListItemIcon>
            <ListItemText
              primary="Analyze Photos"
              secondary="Upload images to identify items"
            />
          </MenuItem>

          <MenuItem
            onClick={() => handleTabChange('inventories')}
            selected={activeTab === 'inventories'}
            sx={{ py: 1.5 }}
          >
            <ListItemIcon>
              <List />
            </ListItemIcon>
            <ListItemText
              primary="Saved Inventories"
              secondary="View your saved item lists"
            />
          </MenuItem>

          <Divider sx={{ my: 1 }} />

          {/* Settings */}
          <MenuItem
            onClick={handleThemeToggle}
            sx={{ py: 1.5 }}
          >
            <ListItemIcon>
              {theme === 'light' ? <DarkMode /> : <LightMode />}
            </ListItemIcon>
            <ListItemText
              primary={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              secondary="Change appearance"
            />
          </MenuItem>

          {isSignedIn && (
            <MenuItem
              component={Link}
              href="/account"
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                <AccountCircle />
              </ListItemIcon>
              <ListItemText
                primary="Account"
                secondary="Manage your profile and settings"
              />
            </MenuItem>
          )}

          {/* Spacer to push logout to bottom */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Logout Button at Bottom */}
          {isSignedIn && (
            <Divider sx={{ my: 1 }} />
          )}
          {isSignedIn && (
            <MenuItem
              onClick={handleSignOut}
              sx={{ 
                py: 1.5,
                backgroundColor: 'error.light',
                color: 'error.contrastText',
                '&:hover': {
                  backgroundColor: 'error.main',
                }
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>
                <Logout />
              </ListItemIcon>
              <ListItemText
                primary="Sign Out"
                secondary={`Signed in as ${user?.firstName}`}
                primaryTypographyProps={{ color: 'inherit' }}
                secondaryTypographyProps={{ color: 'inherit', sx: { opacity: 0.8 } }}
              />
            </MenuItem>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
