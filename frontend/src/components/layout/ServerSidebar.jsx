import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  Avatar,
  Collapse,
} from '@mui/material';
import {
  Tag as TagIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useSocket } from '../../contexts/SocketContext';

const ServerSidebar = ({ 
  server, 
  selectedChannel, 
  onSelectChannel,
  onSelectDirectMessage 
}) => {
  const [expandedChannels, setExpandedChannels] = useState(true);
  const [expandedDirectMessages, setExpandedDirectMessages] = useState(true);
  const { userStatuses } = useSocket();

  // Mock data - replace with actual data
  const channels = [
    { id: 1, name: 'general', type: 'text' },
    { id: 2, name: 'announcements', type: 'text' },
    { id: 3, name: 'random', type: 'text' },
  ];

  const directMessages = [
    { id: 1, username: 'alice', status: 'online' },
    { id: 2, username: 'bob', status: 'idle' },
    { id: 3, username: 'charlie', status: 'offline' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#44b700';
      case 'idle': return '#f57c00';
      case 'offline': return '#757575';
      default: return '#757575';
    }
  };

  const getDisplayName = (user) => user.name && user.name !== user.username ? user.name : null;

  const getLiveStatus = (user) => userStatuses.get(user.id) || user.status || 'offline';

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Online';
      case 'idle': return 'Idle';
      case 'offline': return 'Offline';
      default: return 'Offline';
    }
  };

  if (!server) {
    return (
      <Box
        sx={{
          width: 240,
          bgcolor: '#2F3136',
          borderRight: '1px solid #202225',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #40444B' }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            Select a Server
          </Typography>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="#B9BBBE">
            Choose a server from the sidebar
          </Typography>
        </Box>
      </Box>
    );
  }

  // Add a fake channel for demonstration
  const devChannels = [
    ...channels,
    { id: 'dev', name: 'development', type: 'text', comingSoon: true },
  ];

  return (
    <Box
      sx={{
        width: 240,
        bgcolor: '#2F3136',
        borderRight: '1px solid #202225',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Server Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #40444B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
          {server.name}
        </Typography>
        <Tooltip title="Server Settings" placement="bottom">
          <IconButton
            size="small"
            sx={{
              color: '#B9BBBE',
              '&:hover': {
                bgcolor: '#40444B',
                color: 'white',
              },
            }}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Channels Section */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* Text Channels */}
        <Box sx={{ p: 1 }}>
          <ListItemButton
            onClick={() => setExpandedChannels(!expandedChannels)}
            sx={{
              borderRadius: 1,
              mb: 1,
              '&:hover': {
                bgcolor: '#40444B',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {expandedChannels ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemIcon>
            <ListItemText
              primary="TEXT CHANNELS"
              primaryTypographyProps={{
                variant: 'caption',
                sx: { 
                  color: '#B9BBBE', 
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                },
              }}
            />
            <Tooltip title="Create Channel" placement="bottom">
              <IconButton
                size="small"
                sx={{
                  color: '#B9BBBE',
                  '&:hover': {
                    bgcolor: '#40444B',
                    color: 'white',
                  },
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          </ListItemButton>

          <Collapse in={expandedChannels}>
            <List sx={{ p: 0 }}>
              {devChannels.map((channel) => (
                <ListItem
                  key={channel.id}
                  disablePadding
                  sx={{ mb: 0.5 }}
                >
                  <ListItemButton
                    selected={selectedChannel?.id === channel.id}
                    onClick={channel.comingSoon ? () => console.log('This feature is intended eventually.') : () => onSelectChannel(channel)}
                    sx={{
                      borderRadius: 1,
                      mx: 0.5,
                      '&:hover': {
                        bgcolor: '#40444B',
                      },
                      '&.Mui-selected': {
                        bgcolor: '#40444B',
                        '&:hover': {
                          bgcolor: '#40444B',
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <TagIcon sx={{ color: '#B9BBBE', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={`# ${channel.name}${channel.comingSoon ? ' (coming soon)' : ''}`}
                      primaryTypographyProps={{
                        variant: 'body2',
                        sx: {
                          color: selectedChannel?.id === channel.id ? 'white' : '#B9BBBE',
                          fontWeight: selectedChannel?.id === channel.id ? 500 : 400,
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </Box>

        <Divider sx={{ borderColor: '#40444B', mx: 1 }} />

        {/* Direct Messages */}
        <Box sx={{ p: 1 }}>
          <ListItemButton
            onClick={() => setExpandedDirectMessages(!expandedDirectMessages)}
            sx={{
              borderRadius: 1,
              mb: 1,
              '&:hover': {
                bgcolor: '#40444B',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {expandedDirectMessages ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemIcon>
            <ListItemText
              primary="DIRECT MESSAGES"
              primaryTypographyProps={{
                variant: 'caption',
                sx: { 
                  color: '#B9BBBE', 
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                },
              }}
            />
          </ListItemButton>

          <Collapse in={expandedDirectMessages}>
            <List sx={{ p: 0 }}>
              {directMessages.map((user) => (
                <ListItem
                  key={user.id}
                  disablePadding
                  sx={{ mb: 0.5 }}
                >
                  <ListItemButton
                    onClick={() => onSelectDirectMessage(user)}
                    sx={{
                      borderRadius: 1,
                      mx: 0.5,
                      '&:hover': {
                        bgcolor: '#40444B',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, position: 'relative' }}>
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          bgcolor: '#5865F2',
                          fontSize: '0.75rem',
                        }}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: getStatusColor(getLiveStatus(user)),
                          border: '2px solid',
                          borderColor: '#2F3136',
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="body2" sx={{ color: '#B9BBBE', fontWeight: 500 }}>
                            @{user.username}
                          </Typography>
                          {getDisplayName(user) && (
                            <Typography variant="caption" color="text.secondary">
                              {user.name}
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={getLiveStatus(user)}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </Box>
      </Box>

      {/* User Info */}
      <Box
        sx={{
          p: 1,
          borderTop: '1px solid #40444B',
          bgcolor: '#292B2F',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: '#5865F2',
              fontSize: '0.875rem',
            }}
          >
            U
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'white',
                fontWeight: 500,
                fontSize: '0.875rem',
              }}
            >
              Username
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#B9BBBE',
                fontSize: '0.75rem',
              }}
            >
              {getStatusText(getLiveStatus(user))}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ServerSidebar; 