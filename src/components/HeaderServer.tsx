import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  LightMode, 
  DarkMode, 
  Menu as MenuIcon, 
  Close, 
  CameraAlt, 
  List 
} from '@mui/icons-material';
import { setActiveTab, toggleTheme, getAppState } from '@/app/actions/state-actions';

interface HeaderServerProps {
  activeTab: 'analyze' | 'inventories';
}

export default async function HeaderServer({ activeTab }: HeaderServerProps) {
  const state = await getAppState();

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

        {/* Hamburger Menu Button */}
        <form action={async () => {
          'use server';
          // This will be handled by client component
        }}>
          <IconButton
            edge="end"
            color="inherit"
            aria-label="Menu"
            sx={{ color: 'text.secondary' }}
          >
            <MenuIcon />
          </IconButton>
        </form>
      </Toolbar>
    </AppBar>
  );
}
