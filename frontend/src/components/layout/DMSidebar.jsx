import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  IconButton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Chip,
  Divider,
  Slide,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBackIosNew as ArrowBackIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import GroupDMCreator from '../chat/GroupDMCreator';
import { getProfilePictureUrl, getAvatarInitial } from '../../utils/imageUtils';
import PropTypes from 'prop-types';
import { useNotifications } from '../../contexts/NotificationContext';

const DMSidebar = React.memo(({ 
  selectedDirectMessage, 
  onSelectDirectMessage,
  onClose 
}) => {
  const { token, loading, user } = useAuth();
  const { socket, userStatuses } = useSocket();
  const [friends, setFriends] = useState([]);
  const [openDMs, setOpenDMs] = useState([]);
  // Rename local loading state to 'fetching' to avoid conflict with 'loading' from useAuth
  const [fetching, setFetching] = useState(false);
  const [addDMDialog, setAddDMDialog] = useState(false);
  const [showGroupCreator, setShowGroupCreator] = useState(false);

  const { notifications } = useNotifications();

  useEffect(() => {
    if (token) {
      fetchFriends();
    }
  }, [token]);

  const fetchFriends = async () => {
    if (fetching || !token) return;

    setFetching(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/friends/friends`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFriends(data.friends || []);
      } else {
        // setError('Failed to load friends'); // Original code had this line commented out
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      // setError('Network error'); // Original code had this line commented out
    } finally {
      setFetching(false);
    }
  };

  const fetchOpenDMs = async () => {
    if (fetching || !token) return;
    setFetching(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messaging/dms`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setOpenDMs(data.dms || []);
      }
    } catch (error) {
      // handle error
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchOpenDMs();
  }, [token]);

  // Real-time socket updates for DMs
  useEffect(() => {
    if (!socket || !token) return;
    // Join all DM rooms (optional, for group/DM events)
    // socket.emit('join_rooms', { dms: openDMs.map(dm => dm.id) });

    const handleNewMessage = (data) => {
      // Only refresh if the message is for a DM in the list or a new DM
      fetchOpenDMs();
    };
    const handleDMCreated = (data) => {
      fetchOpenDMs();
    };
    const handleDMUpdated = (data) => {
      fetchOpenDMs();
    };
    socket.on('new_message', handleNewMessage);
    socket.on('dm_created', handleDMCreated);
    socket.on('dm_updated', handleDMUpdated);
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('dm_created', handleDMCreated);
      socket.off('dm_updated', handleDMUpdated);
    };
  }, [socket, token]);

  // When notifications.unreadMessages changes, update DM list unread badges
  useEffect(() => {
    // This will trigger a re-render and update unread badges for DMs
  }, [notifications.unreadMessages]);

  const [confirmDM, setConfirmDM] = useState(null);

  const handleAddDM = async (friend) => {
    // Show confirmation inline
    setConfirmDM(friend);
  };

  const confirmCreateDM = async () => {
    if (!token || !confirmDM) return;
    
    try {
      // Get or create DM conversation
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messaging/users/${confirmDM.id}/dm`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (onSelectDirectMessage) {
          onSelectDirectMessage(data.dm_id);
        }
        // Refresh the DM list
        fetchOpenDMs();
      }
    } catch (error) {
      console.error('Error creating DM:', error);
    }
    
    setConfirmDM(null);
    setAddDMDialog(false);
  };

  const handleCancelConfirm = () => {
    setConfirmDM(null);
  };

  const handleGroupCreated = (groupDM) => {
    // Refresh the DM list to show the new group
    fetchOpenDMs();
    // Optionally select the new group
    if (onSelectDirectMessage) {
      onSelectDirectMessage(groupDM.id);
    }
  };



  const getLiveStatus = (dm) => {
    if (dm.type === 'dm' && (dm.user_id || dm.other_user_id)) {
      const id = dm.user_id || dm.other_user_id;
      return userStatuses.get(id) || dm.status || 'offline';
    }
    return dm.status || 'offline';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#57F287';
      case 'idle': return '#FEE75C';
      case 'away': return '#FEE75C';
      case 'dnd': return '#ED4245';
      case 'offline': return '#747F8D';
      default: return '#747F8D';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Online';
      case 'idle': return 'Idle';
      case 'away': return 'Away';
      case 'dnd': return 'Do Not Disturb';
      case 'offline': return 'Offline';
      default: return 'Offline';
    }
  };

  const renderDMAvatar = (dm) => {
    if (dm.type === 'group') {
      return (
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
          <GroupIcon />
        </Avatar>
      );
    } else {
      return (
        <Avatar 
          src={getProfilePictureUrl(dm.profile_picture)} 
          sx={{ width: 32, height: 32 }}
        >
          {getAvatarInitial(dm.username, dm.display_name)}
        </Avatar>
      );
    }
  };

  const renderDMName = (dm) => {
    if (dm.type === 'group') {
      return dm.display_name || 'Group DM';
    } else {
      // 1:1 DM display
      const otherUser = dm.members?.find(m => String(m.id) !== String(user?.id));
      let displayName = '';
      let avatarUrl = '';
      let avatarInitial = '';
      if (dm.type === 'group') {
        displayName = dm.name || 'Group DM';
        avatarUrl = '';
        avatarInitial = '';
      } else {
        displayName = otherUser ? '@' + otherUser.username : '@unknown';
        avatarUrl = otherUser?.profile_picture || '';
        avatarInitial = otherUser?.username ? otherUser.username[0].toUpperCase() : '?';
      }
      return displayName;
    }
  };

  DMSidebar.displayName = 'DMSidebar';

  DMSidebar.propTypes = {
    selectedDirectMessage: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.object,
    ]),
    onSelectDirectMessage: PropTypes.func,
    onClose: PropTypes.func,
  };

  return (
    <Slide direction="right" in={true} mountOnEnter unmountOnExit appear>
      <Box
        sx={{
          width: { xs: '100vw', sm: 240 },
          height: '100%',
          bgcolor: 'background.paper',
          borderRight: { xs: 0, sm: 1 },
          borderLeft: 0,
          borderColor: { xs: 'transparent', sm: 'divider' },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: { xs: 0, sm: 6 },
          position: { xs: 'fixed', sm: 'relative' },
          top: { xs: 0, sm: 'auto' },
          left: { xs: 0, sm: 'auto' },
          zIndex: { xs: 1200, sm: 'auto' },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: { xs: 3, sm: 2 },
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: { xs: 80, sm: 64 },
            flexShrink: 0,
            bgcolor: 'background.paper',
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              flex: 1,
              fontSize: { xs: '1.25rem', sm: '1.125rem' }
            }}
          >
            Direct Messages
          </Typography>
          <IconButton
            onClick={onClose}
            size="large"
            sx={{
              ml: 0.5,
              p: { xs: 1, sm: 0.5 },
              color: 'text.secondary',
              transition: 'transform 0.25s cubic-bezier(.4,2,.6,1), color 0.18s',
              '&:hover, &:focus': {
                color: 'error.main',
                transform: 'translateX(-3px) scale(1.13)',
                bgcolor: 'rgba(237,66,69,0.08)',
              },
              '&:active': {
                transform: 'scale(0.95) translateX(-3px)',
              },
              borderRadius: 2,
              fontSize: { xs: 24, sm: 20 },
            }}
            aria-label="Close DM sidebar"
          >
            <ArrowBackIcon sx={{ fontSize: { xs: 24, sm: 20 } }} />
          </IconButton>
        </Box>

        {/* DM List (open DMs only) */}
        <Box sx={{ 
          flex: 1,
          overflow: 'auto', 
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Error Alert */}
          {/* {error && ( // Original code had this line commented out
            <Alert severity="error" sx={{ m: 1 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )} */}
          {fetching ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : openDMs.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
              <Typography color="text.secondary" gutterBottom>
                No direct messages yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Click the + button to start a DM
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {openDMs.map((dm) => {
                let displayName = '';
                let avatarUrl = '';
                let avatarInitial = '';
                if (dm.type === 'group') {
                  displayName = dm.name || 'Group DM';
                  avatarUrl = '';
                  avatarInitial = '';
                } else {
                  // 1:1 DM display
                  const otherUser = dm.members?.find(m => String(m.id) !== String(user?.id));
                  displayName = otherUser ? '@' + otherUser.username : '@unknown';
                  avatarUrl = otherUser?.profile_picture || '';
                  avatarInitial = otherUser?.username ? otherUser.username[0].toUpperCase() : '?';
                }
                return (
                  <ListItem
                    key={dm.id}
                    selected={selectedDirectMessage === dm.id}
                    onClick={() => onSelectDirectMessage(dm.id)}
                    sx={{
                      px: 2,
                      py: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.08)' 
                          : 'rgba(0, 0, 0, 0.04)',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(88, 101, 242, 0.2)',
                        '&:hover': {
                          backgroundColor: 'rgba(88, 101, 242, 0.3)',
                        },
                      },
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Box sx={{ position: 'relative' }}>
                        {dm.type === 'group' ? (
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            <GroupIcon />
                          </Avatar>
                        ) : (
                          avatarUrl ? (
                            <Avatar src={getProfilePictureUrl(avatarUrl)} sx={{ width: 32, height: 32 }} />
                          ) : (
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>{avatarInitial}</Avatar>
                          )
                        )}
                      </Box>
                    </ListItemAvatar>
                    <ListItemText
                      primary={displayName}
                      secondary={dm.type === 'group' ? `${dm.members?.length || 0} members` : ''}
                      primaryTypographyProps={{
                        component: 'div',
                        sx: { fontSize: '0.875rem', fontWeight: 500 },
                      }}
                      secondaryTypographyProps={{
                        component: 'div',
                        sx: { fontSize: '0.75rem', color: 'text.secondary' },
                      }}
                    />

                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>

        {/* Add DM Button */}
        <Box sx={{ 
          p: 2, 
          bgcolor: 'background.paper',
          minHeight: 80,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center'
        }}>
          <Fab
            color="primary"
            size="small"
            onClick={() => setAddDMDialog(true)}
            sx={{ boxShadow: 'none' }}
          >
            <AddIcon />
          </Fab>
        </Box>

        {/* Add DM Dialog (Friends List or Confirmation) */}
        <Dialog 
          open={addDMDialog} 
          onClose={() => {
            setAddDMDialog(false);
            setConfirmDM(null);
          }} 
          maxWidth="xs" 
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: 'background.paper',
              borderRadius: 2,
            }
          }}
        >
          {!confirmDM ? (
            // Friends List View
            <>
              <DialogTitle>Start a Direct Message</DialogTitle>
              <DialogContent>
                <Box sx={{ mb: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<GroupIcon />}
                    onClick={() => {
                      setAddDMDialog(false);
                      setShowGroupCreator(true);
                    }}
                    sx={{ mb: 1 }}
                  >
                    Create Group DM
                  </Button>
                  <Divider sx={{ my: 1 }} />
                </Box>
                
                {friends.length === 0 ? (
                  <Typography color="text.secondary">No friends to DM yet.</Typography>
                ) : (
                  <List>
                    {friends.map(friend => (
                      <ListItem 
                        key={friend.id} 
                        onClick={() => handleAddDM(friend)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <ListItemAvatar>
                          <Avatar src={getProfilePictureUrl(friend.profile_picture)}>
                            {getAvatarInitial(friend.username, friend.name)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={friend.name || friend.username} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setAddDMDialog(false)}>Cancel</Button>
              </DialogActions>
            </>
          ) : (
            // Confirmation View
            <>
              <DialogTitle>Start Direct Message?</DialogTitle>
              <DialogContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar src={getProfilePictureUrl(confirmDM?.profile_picture)}>
                    {getAvatarInitial(confirmDM?.username, confirmDM?.name)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {confirmDM?.name || confirmDM?.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start a private conversation
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  This will create a new direct message conversation with {confirmDM?.name || confirmDM?.username}.
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCancelConfirm}>
                  Back
                </Button>
                <Button 
                  onClick={confirmCreateDM}
                  variant="contained"
                  color="primary"
                >
                  Start DM
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Group DM Creator */}
        <GroupDMCreator
          open={showGroupCreator}
          onClose={() => setShowGroupCreator(false)}
          onGroupCreated={handleGroupCreated}
        />



      </Box>
    </Slide>
  );
});

export default DMSidebar; 