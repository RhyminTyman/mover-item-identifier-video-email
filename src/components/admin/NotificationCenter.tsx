"use client";

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Badge,
  Divider,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Notifications,
  Info,
  Warning,
  Error as ErrorIcon,
  CheckCircle,
  MarkEmailRead,
  Refresh,
  Delete
} from '@mui/icons-material';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual API endpoint
      // const response = await fetch('/api/admin/notifications');
      // const data = await response.json();
      // setNotifications(data.notifications);
      
      // Mock data for now
      setNotifications([
        {
          id: '1',
          title: 'New User Registration',
          message: 'John Doe (john@example.com) has registered',
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
          metadata: { userId: '123' }
        },
        {
          id: '2',
          title: 'High-Value Quote Request',
          message: 'Jane Smith requested a quote for $8,500.00',
          type: 'success',
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          metadata: { quoteId: '456', amount: 8500 }
        }
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    // TODO: Implement API call
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllAsRead = async () => {
    // TODO: Implement API call
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDelete = async (notificationId: string) => {
    // TODO: Implement API call
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info color="info" />;
      case 'warning': return <Warning color="warning" />;
      case 'error': return <ErrorIcon color="error" />;
      case 'success': return <CheckCircle color="success" />;
      default: return <Info />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'success': return 'success';
      default: return 'default';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
            <Typography variant="h6">
              Notifications
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              size="small"
              startIcon={<MarkEmailRead />}
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark All Read
            </Button>
            <IconButton onClick={fetchNotifications} size="small">
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        {notifications.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Notifications sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You're all caught up!
            </Typography>
          </Box>
        ) : (
          <List>
            {notifications.map((notification, index) => (
              <Box key={notification.id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    backgroundColor: notification.read ? 'transparent' : 'action.hover',
                    borderRadius: 1,
                    mb: 1
                  }}
                  secondaryAction={
                    <Box display="flex" gap={1}>
                      {!notification.read && (
                        <IconButton
                          edge="end"
                          onClick={() => handleMarkAsRead(notification.id)}
                          size="small"
                        >
                          <MarkEmailRead />
                        </IconButton>
                      )}
                      <IconButton
                        edge="end"
                        onClick={() => handleDelete(notification.id)}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemIcon>
                    {getIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2">
                          {notification.title}
                        </Typography>
                        <Chip
                          label={notification.type}
                          size="small"
                          color={getTypeColor(notification.type) as any}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notification.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

