import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Chip,
} from '@mui/material';
import {
  Home as HomeIcon,
  Add as AddIcon,
  Message as MessageIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  People as PeopleIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  ContentCopy as ContentCopyIcon,
  AlternateEmail as AlternateEmailIcon,
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';
import { useServers } from '../../contexts/ServerContext';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationBadge from '../ui/NotificationBadge';
import { getProfilePictureUrl } from '../../utils/imageUtils';

const ServerSidebar = ({ 
  activeSection,
  onSectionChange,
  selectedServer,
  onServerSelect,
  onShowUserProfile,
  showDMSidebar,
  dmButtonActive
}) => {
  const { user, logout } = useAuth();
  const { servers, loading, createServer } = useServers();
  const { notifications, clearNotification } = useNotifications();
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const [serverName, setServerName] = useState('');
  const [serverDescription, setServerDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [backendStatus, setBackendStatus] = useState('unknown');
  const [copied, setCopied] = useState(false);
  // Remove local dmButtonActive state
  // Accept dmButtonActive as a prop

  const handleCopyUsername = () => {
    if (user?.username) {
      navigator.clipboard.writeText(user.username);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
      icon: <HomeIcon />,
      type: 'home',
      color: '#5865F2',
      notificationType: null
    },
    {
      id: 'friends',
      label: 'Friends',
      icon: <PeopleIcon />,
      type: 'friends',
      color: '#57F287',
      notificationType: 'friendRequests'
    },
    {
      id: 'servers',
      label: 'Servers',
      icon: <SettingsIcon />,
      type: 'servers',
      color: '#9B59B6',
      notificationType: null
    },
    {
      id: 'directs',
      label: 'Direct Messages',
      icon: <MessageIcon />,
      type: 'directs',
      color: '#FEE75C',
      notificationType: 'unreadMessages'
    }
  ];

  const handleNavigationClick = (item) => {
    onSectionChange(item.type);
    
    // Clear notification when clicking on the section
    if (item.notificationType && notifications[item.notificationType] > 0) {
      clearNotification(item.notificationType);
    }
  };

  // Remove local state and handleDMButtonClick, use onSectionChange directly
  // const handleDMButtonClick = () => {
  //   setDmButtonActive(true);
  //   if (showDMSidebar) {
  //     // If already open, close it
  //     onSectionChange('home');
  //   } else {
  //     onSectionChange('directs');
  //   }
  //   setTimeout(() => setDmButtonActive(false), 350); // Animation duration
  // };

  const handleCreateServer = async () => {
    if (!serverName.trim()) return;
    
    setCreating(true);
    try {
      await createServer({ name: serverName, description: serverDescription });
      setServerName('');
      setServerDescription('');
      setOpenCreateDialog(false);
    } catch (error) {
      console.error('Error creating server:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    setOpenLogoutDialog(true);
  };

  const confirmLogout = () => {
    setOpenLogoutDialog(false);
    logout();
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
    const colors = ['#5865F2', '#57F287', '#FEE75C', '#ED4245', '#EB459E', '#9B59B6'];
    const index = server.id % colors.length;
    return colors[index];
  };

  // Check backend status periodically
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/health`, {
          method: 'GET',
        });
        setBackendStatus(response.ok ? 'connected' : 'disconnected');
      } catch (error) {
        setBackendStatus('disconnected');
      }
    };

    // Check immediately
    checkBackendStatus();

    // Check every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        width: { xs: 60, sm: 72 },
        bgcolor: '#2F3136',
        borderRight: '1px solid #202225',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: { xs: 0.5, sm: 1 },
        gap: { xs: 0.5, sm: 1 },
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 1100,
      }}
    >
      {/* Navigation Icons */}
      {navigationItems.map((item) => (
        <Tooltip key={item.id} title={item.label} placement="right">
          <Box sx={{ position: 'relative' }}>
            <IconButton
              onClick={item.type === 'directs' ? () => onSectionChange('directs') : () => handleNavigationClick(item)}
              sx={{
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                bgcolor: activeSection === item.type ? item.color : 'transparent',
                color: item.type === 'directs' && showDMSidebar && activeSection !== 'directs' ? '#FEE75C' : (activeSection === item.type ? 'white' : '#B9BBBE'),
                borderRadius: { xs: '8px', sm: '12px' },
                transition: 'all 0.2s cubic-bezier(.4,2,.6,1)',
                boxShadow: item.type === 'directs' && dmButtonActive ? '0 0 0 6px rgba(254,231,92,0.25)' : undefined,
                transform: item.type === 'directs' && dmButtonActive ? 'scale(1.13)' : undefined,
                '&:hover': {
                  bgcolor: activeSection === item.type ? item.color : '#40444B',
                  color: 'white',
                  transform: 'scale(1.05)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: { xs: -6, sm: -8 },
                  width: 4,
                  height: activeSection === item.type ? { xs: 40, sm: 48 } : 0,
                  bgcolor: 'white',
                  borderRadius: '0 4px 4px 0',
                  transition: 'height 0.2s ease',
                },
              }}
            >
              {item.icon}
            </IconButton>
            {item.notificationType && notifications[item.notificationType] > 0 && (
              <NotificationBadge 
                count={notifications[item.notificationType]} 
                size="small"
                color={item.notificationType === 'friendRequests' ? '#ED4245' : '#5865F2'}
              />
            )}
          </Box>
        </Tooltip>
      ))}

      <Divider sx={{ width: 32, borderColor: '#40444B', my: 1 }} />

      {/* Create Server Button */}
      <Tooltip title="Create Server" placement="right">
        <IconButton
          onClick={() => onSectionChange('servers')}
          sx={{
            width: 48,
            height: 48,
            bgcolor: 'transparent',
            color: '#B9BBBE',
            borderRadius: '12px',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: '#40444B',
              color: '#57F287',
              transform: 'scale(1.05)',
            },
          }}
        >
          <AddIcon />
        </IconButton>
      </Tooltip>

      {/* User Profile Section */}
      <Box sx={{ 
        mt: 'auto', 
        mb: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        width: '100%'
      }}>
        {/* Backend Status Indicator */}
        <Tooltip 
          title={backendStatus === 'connected' ? 'Backend Connected' : 'Backend Disconnected'} 
          placement="right"
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            {backendStatus === 'connected' ? (
              <WifiIcon sx={{ fontSize: 16, color: '#57F287' }} />
            ) : (
              <WifiOffIcon sx={{ fontSize: 16, color: '#ED4245' }} />
            )}
          </Box>
        </Tooltip>

        {/* Username Chip below backend status, above profile picture */}
        {user?.username && (
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 0.25 }}>
            <span
              style={{
                color: '#B9BBBE',
                fontWeight: 400,
                fontSize: 11,
                textAlign: 'center',
                display: 'block',
                lineHeight: 1.2,
                letterSpacing: 0.2,
                margin: 0,
                padding: 0,
                width: '100%',
                userSelect: 'all',
              }}
            >
              {user.username}
            </span>
          </Box>
        )}

        <Tooltip title="User Settings" placement="right">
          <IconButton
            onClick={onShowUserProfile}
            sx={{
              width: 48,
              height: 48,
              bgcolor: 'transparent',
              color: '#B9BBBE',
              borderRadius: '12px',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: '#40444B',
                color: 'white',
                transform: 'scale(1.05)',
              },
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: '#5865F2',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                }}
                src={getProfilePictureUrl(user?.profile_picture)}
              >
                {user?.username?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: user?.status === 'online' ? '#57F287' : 
                           user?.status === 'away' ? '#FEE75C' :
                           user?.status === 'dnd' ? '#ED4245' : '#72767D',
                  border: 2,
                  borderColor: '#2F3136',
                }}
              />
            </Box>
          </IconButton>
        </Tooltip>

        {/* Settings Button */}
        <Tooltip title="Settings" placement="right">
          <IconButton
            onClick={() => onSectionChange('settings')}
            sx={{
              width: 48,
              height: 48,
              color: activeSection === 'settings' ? 'white' : '#B9BBBE',
              bgcolor: activeSection === 'settings' ? '#5865F2' : 'transparent',
              borderRadius: '12px',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: activeSection === 'settings' ? '#5865F2' : '#40444B',
                color: 'white',
                transform: 'scale(1.05)',
              },
            }}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>

        {/* Logout Button */}
        <Tooltip title="Logout" placement="right">
          <IconButton
            onClick={handleLogout}
            sx={{
              width: 48,
              height: 48,
              color: '#B9BBBE',
              borderRadius: '12px',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: '#ED4245',
                color: 'white',
                transform: 'scale(1.05)',
              },
            }}
          >
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Remove Create Server Dialog */}

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={openLogoutDialog}
        onClose={() => setOpenLogoutDialog(false)}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: 400,
            background: (theme) => theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(45, 42, 85, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: (theme) => theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: (theme) => theme.palette.mode === 'dark'
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            '& .MuiDialog-paper': {
              background: 'transparent',
            }
          }
        }}
        sx={{
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
          }
        }}
      >
        <DialogTitle 
          id="logout-dialog-title"
          sx={{
            textAlign: 'center',
            fontWeight: 700,
            fontSize: '1.5rem',
            background: 'linear-gradient(135deg, #ED4245 0%, #DC2626 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
            pt: 3,
            px: 3
          }}
        >
          Confirm Logout
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ED4245 0%, #DC2626 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 32px rgba(237, 66, 69, 0.3)',
              }}
            >
              <LogoutIcon sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Typography 
              id="logout-dialog-description"
              sx={{ 
                fontSize: '1.1rem',
                fontWeight: 500,
                color: 'text.primary',
                mb: 1
              }}
            >
              Are you sure you want to logout?
            </Typography>
            <Typography 
              sx={{ 
                fontSize: '0.9rem',
                color: 'text.secondary',
                opacity: 0.8
              }}
            >
              You'll need to sign in again to access your account.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2, justifyContent: 'center' }}>
          <Button 
            onClick={() => setOpenLogoutDialog(false)}
            variant="outlined"
            sx={{ 
              minWidth: 100,
              py: 1.5,
              px: 3,
              borderRadius: 2,
              borderColor: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.2)' 
                : 'rgba(0, 0, 0, 0.12)',
              color: 'text.primary',
              fontWeight: 600,
              '&:hover': {
                borderColor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.4)'
                  : 'rgba(0, 0, 0, 0.3)',
                backgroundColor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.04)',
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmLogout}
            variant="contained"
            sx={{ 
              minWidth: 100,
              py: 1.5,
              px: 3,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #ED4245 0%, #DC2626 100%)',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(237, 66, 69, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                boxShadow: '0 6px 20px rgba(237, 66, 69, 0.5)',
                transform: 'translateY(-1px)',
              },
              '&:active': {
                transform: 'translateY(0)',
              }
            }}
            autoFocus
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

ServerSidebar.displayName = 'ServerSidebar';

ServerSidebar.propTypes = {
  activeSection: PropTypes.string,
  onSectionChange: PropTypes.func,
  selectedServer: PropTypes.object,
  onServerSelect: PropTypes.func,
  onShowUserProfile: PropTypes.func,
  showDMSidebar: PropTypes.bool,
  dmButtonActive: PropTypes.bool,
};

export default ServerSidebar; 