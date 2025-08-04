import React from 'react';
import { Box, CircularProgress, Typography, Fade } from '@mui/material';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

const SocketLoading = ({ children }) => {
  const { isConnected, isConnectingState } = useSocket();
  const { user } = useAuth();
  const location = useLocation();

  // Don't show loading screen on login/register pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  // Only show loading if user is authenticated and not on auth pages
  if (user && !isAuthPage && (isConnectingState || !isConnected)) {
    return (
      <Fade in={true} timeout={500}>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'background.default',
            zIndex: 9999,
            gap: 3
          }}
        >
          <CircularProgress 
            size={60} 
            sx={{ 
              color: '#5865F2',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              }
            }} 
          />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'text.primary', mb: 1, fontWeight: 600 }}>
              {isConnectingState ? 'Connecting to NexusChat...' : 'Establishing connection...'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Setting up real-time features
            </Typography>
          </Box>
        </Box>
      </Fade>
    );
  }

  // Show the actual app content when connected or on auth pages
  return children;
};

export default SocketLoading; 