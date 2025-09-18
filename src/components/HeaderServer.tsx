import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton
} from '@mui/material';
import { 
  Menu as MenuIcon
} from '@mui/icons-material';

interface HeaderServerProps {
  activeTab: 'analyze' | 'inventories';
}

export default async function HeaderServer({ activeTab: _ }: HeaderServerProps) { // eslint-disable-line @typescript-eslint/no-unused-vars

  return (
    <AppBar position="static" elevation={0} sx={{ backgroundColor: 'background.paper' }}>
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ flexGrow: 1, color: 'text.primary' }}
        >
          Barreleyes
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
