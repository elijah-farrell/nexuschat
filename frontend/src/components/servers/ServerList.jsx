import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Add as AddIcon,
  Public as PublicIcon,
  Message as MessageIcon,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useServers } from '../../contexts/ServerContext';

const ServerList = () => {
  const navigate = useNavigate();
  const { servers, loading, error, createServer } = useServers();
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [serverName, setServerName] = useState('');
  const [serverDescription, setServerDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateServer = async () => {
    if (!serverName.trim()) return;

    setCreating(true);
    const result = await createServer({
      name: serverName.trim(),
      description: serverDescription.trim(),
    });

    if (result.success) {
      setOpenCreateDialog(false);
      setServerName('');
      setServerDescription('');
      navigate(`/server/${result.server.id}`);
    } else {
      console.error('Failed to create server:', result.error);
    }
    setCreating(false);
  };

  const handleServerClick = (server) => {
    if (server.channels && server.channels.length > 0) {
      navigate(`/server/${server.id}/${server.channels[0].id}`);
    } else {
      navigate(`/server/${server.id}`);
    }
  };

  const getServerInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getServerColor = (server) => {
    const colors = [
      '#5865F2', '#57F287', '#FEE75C', '#EB459E', '#ED4245',
      '#9B59B6', '#3498DB', '#E67E22', '#1ABC9C', '#34495E'
    ];
    const index = server.name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto', textAlign: 'center' }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 8 }}>
        Servers Coming Soon!
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
        We're working hard to bring you server functionality. You'll be able to create and join servers, manage channels, and collaborate with communities.
      </Typography>
    </Box>
  );
};

export default ServerList; 