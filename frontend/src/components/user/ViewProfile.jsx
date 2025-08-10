import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Avatar,
  Typography,
  Box,
  Chip,
  IconButton,
  Divider,
  useTheme,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Circle as CircleIcon,
  Info as InfoIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { getProfilePictureUrl, getAvatarInitial } from '../../utils/imageUtils';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';

const ViewProfile = ({ open, onClose, userId, onGoToDM }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const { userStatuses } = useSocket();
  const { user: currentUser, token } = useAuth();
  const [dmLoading, setDMLoading] = useState(false);
  const [hasDM, setHasDM] = useState(null); // null = unknown, true/false = known
  // Remove fetchUserFriends, friends, friendsLoading, and related UI
  // Only show 'Friends since' if user.is_friend and user.friendship_date exist

  useEffect(() => {
    if (open && userId) {
      fetchUserProfile();
      // Remove fetchUserFriends();
    }
  }, [open, userId]);

  useEffect(() => {
    if (open && userId && currentUser?.id !== userId) {
      checkExistingDM();
    } else {
      setHasDM(null);
    }
  }, [open, userId, currentUser]);

  const checkExistingDM = async () => {
    if (!token || !userId) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messaging/dms`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        const found = data.dms?.some(dm => dm.type === 'dm' && (dm.user_id === Number(userId) || dm.other_user_id === Number(userId)));
        setHasDM(found);
      }
    } catch (e) {
      setHasDM(null);
    }
  };

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/profile/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Remove fetchUserFriends, friends, friendsLoading, and related UI
  // Only show 'Friends since' if user.is_friend and user.friendship_date exist

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#44b700';
      case 'offline': return '#bdbdbd';
      case 'away': return '#ff9800'; // orange/yellow for away
      case 'busy': return '#f44336';
      default: return '#bdbdbd';
    }
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getDisplayName = (user) => user.name && user.name !== user.username ? user.name : null;
  const bannerColor = user?.banner_color || '#3B82F6';
  const getLiveStatus = (user) => userStatuses.get(user.id) || user.status || 'offline';

  const handleStartDM = async () => {
    if (!userId || !token) return;
    setDMLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messaging/users/${userId}/dm`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (onGoToDM) onGoToDM(data.dm_id);
        if (onClose) onClose();
      }
    } catch (error) {
      // Optionally show error
    } finally {
      setDMLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: 'background.paper',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Box component="span">User Profile</Box>
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{ 
            color: 'text.secondary',
            '&:hover': {
              bgcolor: 'action.hover',
              color: 'text.primary'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <Typography>Loading...</Typography>
          </Box>
        ) : user ? (
          <Box>
            {/* Banner */}
            <Box 
              sx={{ 
                mt: 2,
                mb: 3,
                mx: 2,
                p: 2, 
                borderRadius: 2, 
                background: `linear-gradient(135deg, ${user?.banner_color || '#3B82F6'} 0%, ${(user?.banner_color || '#3B82F6')}dd 100%)`,
                position: 'relative',
                color: 'white'
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center">
                  <Box position="relative">
                    <Avatar
                      src={getProfilePictureUrl(user.profile_picture)}
                      sx={{ 
                        width: 80, 
                        height: 80,
                        fontSize: '2rem',
                        border: '3px solid rgba(255,255,255,0.3)'
                      }}
                    >
                      {getAvatarInitial(user.username, user.name)}
                    </Avatar>
                    <CircleIcon
                      sx={{
                        position: 'absolute',
                        bottom: 2,
                        right: 2,
                        fontSize: 20,
                        color: getStatusColor(getLiveStatus(user)),
                        bgcolor: 'background.paper',
                        borderRadius: '50%'
                      }}
                    />
                  </Box>
                  <Box ml={2}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                      @{user.username}
                    </Typography>
                    {getDisplayName(user) && (
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        {user.name}
                      </Typography>
                    )}
                    <Chip
                      label={getLiveStatus(user)}
                      size="small"
                      sx={{
                        mt: 1,
                        bgcolor: getStatusColor(getLiveStatus(user)),
                        color: 'white',
                        textTransform: 'capitalize'
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box sx={{ px: 3, pb: 2 }}>
              {/* User Details */}
              <Box>
                {user.name && (
                  <Box display="flex" alignItems="center" mb={2}>
                    <PersonIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                    <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                      Display Name: {user.name}
                    </Typography>
                  </Box>
                )}

                {user.bio && (
                  <Box display="flex" alignItems="flex-start" mb={2}>
                    <InfoIcon sx={{ mr: 1, mt: 0.5, color: theme.palette.text.secondary }} />
                    <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                      Bio: {user.bio}
                    </Typography>
                  </Box>
                )}

                {getLiveStatus(user) !== 'online' && (
                  <Box display="flex" alignItems="center">
                    <AccessTimeIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                    <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                      {`Last seen: ${formatLastSeen(user.last_seen)}`}
                    </Typography>
                  </Box>
                )}
                {/* Friends since info for friends */}
                {user.is_friend && user.friendship_date && (
                  <Box display="flex" alignItems="center" mt={2}>
                    <PeopleIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                    <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                      Friends since: {new Date(user.friendship_date).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Account Info and Message Button Row */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" mb={1}>
                    Account Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Member since: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                  </Typography>
                </Box>
                {currentUser?.id !== user?.id && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleStartDM}
                    disabled={dmLoading}
                    sx={{ ml: 2, whiteSpace: 'nowrap' }}
                  >
                    {dmLoading ? 'Loading...' : hasDM === false ? 'Create DM' : 'Message'}
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        ) : (
          <Box display="flex" justifyContent="center" p={3}>
            <Typography color="error">User not found</Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ViewProfile; 