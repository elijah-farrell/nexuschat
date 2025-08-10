import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Divider,
  Paper,
  Alert,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  Fade,
  Grow,
  Zoom,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Message as MessageIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  History as HistoryIcon,
  FilterList as FilterListIcon,
  PersonRemove as PersonRemoveIcon,
  Block as BlockIcon,
  Report as ReportIcon,
  Info as InfoIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '@mui/material/styles';

import { getProfilePictureUrl, getAvatarInitial } from "../utils/imageUtils";
import PropTypes from 'prop-types';

const Friends = ({ onSelectDirectMessage, onShowUserProfile }) => {
  const theme = useTheme();
  const { token, loading } = useAuth();
  const { clearNotification } = useNotifications();
  const { socket, userStatuses } = useSocket();
  const [activeTab, setActiveTab] = useState(() => {
    // Restore active tab from localStorage, default to 0 (All Friends)
    const savedTab = localStorage.getItem('nexuschat-friends-active-tab');
    return savedTab ? parseInt(savedTab) : 0;
  });
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [addFriendDialog, setAddFriendDialog] = useState(false);
  const [friendUsername, setFriendUsername] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [previousSentRequests, setPreviousSentRequests] = useState([]);
  
  // New state for searching through existing friends/requests
  const [friendsSearchQuery, setFriendsSearchQuery] = useState('');
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [filteredOnlineFriends, setFilteredOnlineFriends] = useState([]);
  
  // Menu state for friend actions
  const [friendMenuAnchor, setFriendMenuAnchor] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  
  const isDarkMode = theme.palette.mode === 'dark';


  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('nexuschat-friends-active-tab', activeTab.toString());
  }, [activeTab]);

  useEffect(() => {
    if (token) {
      fetchFriends();
      fetchFriendRequests();
      fetchSentRequests();
    }
  }, [token]);

  // Clear friend request notifications when viewing the requests tab
  useEffect(() => {
    if (activeTab === 2) {
      clearNotification('friendRequests');
    }
  }, [activeTab]);

  // Auto-refresh when someone accepts your request (check for new friends)
  useEffect(() => {
    if (friends.length > 0 && sentRequests.length > 0) {
      // If we have sent requests and friends, check if any sent requests disappeared
      // This could indicate someone accepted the request
      const checkForAcceptedRequests = () => {
        fetchSentRequests();
        fetchFriends();
      };
      
      const timeout = setTimeout(checkForAcceptedRequests, 5000);
      return () => clearTimeout(timeout);
    }
  }, [friends.length, sentRequests.length]);

  // Force refresh when component mounts or token changes
  useEffect(() => {
    if (token) {
      // Clear any stale data first
      setFriends([]);
      setFriendRequests([]);
      setSentRequests([]);
      setSearchResults([]);
      
      // Then fetch fresh data
      fetchFriends();
      fetchFriendRequests();
      fetchSentRequests();
    }
  }, [token]);

  // Add a socket event handler for friend_request_accepted
  useEffect(() => {
    if (!socket) return;
    const handleAccepted = (data) => {
      setSuccess(`${data.recipientName || data.recipientUsername || 'Someone'} accepted your friend request!`);
    };
    socket.on('friend_request_accepted', handleAccepted);
    return () => {
      socket.off('friend_request_accepted', handleAccepted);
    };
  }, [socket]);

  // Auto-dismiss success and error messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Clear messages when switching tabs
  useEffect(() => {
    setSuccess(null);
    setError(null);
  }, [activeTab]);

  // Clear messages when performing new actions
  useEffect(() => {
    if (loading) {
      setSuccess(null);
      setError(null);
    }
  }, [loading]);

  // Force tabs to recalculate layout when data changes
  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
    return () => clearTimeout(timer);
  }, [friends.length, friendRequests.length, sentRequests.length]);

  // Filter friends and requests based on search query and active tab
  useEffect(() => {
    const filterItems = (items, query) => {
      if (!query.trim()) return items;
      
      const searchTerm = query.toLowerCase();
      return items.filter(item => {
        const user = item.user || item.recipient || item.sender || item;
        const username = user.username?.toLowerCase() || '';
        const name = user.name?.toLowerCase() || '';
        const displayName = user.display_name?.toLowerCase() || '';
        
        return username.includes(searchTerm) || 
               name.includes(searchTerm) || 
               displayName.includes(searchTerm);
      });
    };

    // Only filter the current active tab
    if (activeTab === 0) {
      setFilteredFriends(filterItems(friends, friendsSearchQuery));
    } else if (activeTab === 1) {
      // Real-time online friends derived from friends and userStatuses
      const realTimeOnlineFriends = friends.filter(f => userStatuses.get(f.id) === 'online');
      setFilteredOnlineFriends(filterItems(realTimeOnlineFriends, friendsSearchQuery));
    }
  }, [friends, friendRequests, sentRequests, friendsSearchQuery, activeTab]);

  // --- Filtering for Requests and Pending Tabs ---
  // Only filter for search, not for status (backend already filters for 'pending')
  const filteredFriendRequests = friendsSearchQuery
    ? friendRequests.filter(r => {
        const user = r.user || r.sender || r;
        const username = user.username?.toLowerCase() || '';
        const name = user.name?.toLowerCase() || '';
        const displayName = user.display_name?.toLowerCase() || '';
        const searchTerm = friendsSearchQuery.toLowerCase();
        return (
          username.includes(searchTerm) ||
          name.includes(searchTerm) ||
          displayName.includes(searchTerm)
        );
      })
    : friendRequests;

  const filteredSentRequests = friendsSearchQuery
    ? sentRequests.filter(r => {
        const user = r.user || r.recipient || r;
        const username = user.username?.toLowerCase() || '';
        const name = user.name?.toLowerCase() || '';
        const displayName = user.display_name?.toLowerCase() || '';
        const searchTerm = friendsSearchQuery.toLowerCase();
        return (
          username.includes(searchTerm) ||
          name.includes(searchTerm) ||
          displayName.includes(searchTerm)
        );
      })
    : sentRequests;

  // --- Socket event handler: always update both lists ---
  useEffect(() => {
    if (!socket) return;
    const refetchAll = () => {
      fetchFriends();
      fetchFriendRequests();
      fetchSentRequests();
      if (searchQuery && searchQuery.trim().length >= 2) {
        searchUsers(searchQuery);
      }
    };
    socket.on('friend_request_received', refetchAll);
    socket.on('friend_request_accepted', refetchAll);
    socket.on('friend_request_rejected', refetchAll);
    socket.on('friend_removed', refetchAll);
    socket.on('friend_request_cancelled', refetchAll);
    return () => {
      socket.off('friend_request_received', refetchAll);
      socket.off('friend_request_accepted', refetchAll);
      socket.off('friend_request_rejected', refetchAll);
      socket.off('friend_removed', refetchAll);
      socket.off('friend_request_cancelled', refetchAll);
    };
  }, [socket, searchQuery]);

  // Clear search when switching tabs
  useEffect(() => {
    setFriendsSearchQuery('');
  }, [activeTab]);



  const fetchFriends = async () => {
    if (loading || !token) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/friends/friends?ts=` + Date.now(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setFriends(data.friends || []);
      } else {
        setError('Failed to load friends');
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setError('Network error');
    }
  };

  const fetchFriendRequests = async () => {
    if (loading || !token) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/friends/requests?ts=` + Date.now(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setFriendRequests(data.requests || []);
      } else {
        setError('Failed to load friend requests');
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      setError('Network error');
    }
  };

  const fetchSentRequests = async () => {
    if (loading || !token) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/friends/requests/sent?ts=` + Date.now(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSentRequests(data.requests || []);
      } else {
        setError('Failed to load sent requests');
      }
    } catch (error) {
      console.error('Error fetching sent requests:', error);
      setError('Network error');
    }
  };

  const searchUsers = async (query) => {
    if (!token || !query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/friends/search?query=${encodeURIComponent(query)}&ts=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!friendUsername.trim() || !token) return;
    
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/friends/requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientUsername: friendUsername.trim(),
        }),
      });

      if (response.ok) {
        setSuccess('Friend request sent successfully!');
        setAddFriendDialog(false);
        setFriendUsername('');
        fetchSentRequests(); // Refresh sent requests
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      setError('Network error');
    } finally {
      // setLoading(false); // This line was removed as per the edit hint
    }
  };

  const handleAddFriendFromSearch = async (user) => {
    if (!user || !user.id || !token) return;
    
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/friends/requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: user.id,
        }),
      });

      if (response.ok) {
        setSuccess('Friend request sent successfully!');
        setFriendUsername('');
        fetchSentRequests(); // Refresh sent requests
        searchUsers(searchQuery); // Refresh search results to update status
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      setError('Network error');
    } finally {
      // setLoading(false); // This line was removed as per the edit hint
    }
  };

  const handleAcceptRequest = async (requestId) => {
    if (!token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/friends/requests/${requestId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSuccess('Friend request accepted!');
        fetchFriendRequests(); // Refresh requests
        fetchFriends(); // Refresh friends list
      } else {
        setError('Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      setError('Network error');
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/friends/requests/${requestId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSuccess('Friend request rejected');
        fetchFriendRequests(); // Refresh requests
      } else {
        setError('Failed to reject friend request');
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      setError('Network error');
    }
  };

  const handleCancelSentRequest = async (requestId) => {
    if (!token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/friends/requests/${requestId}/cancel`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSuccess('Friend request cancelled');
        fetchSentRequests(); // Refresh sent requests
        
        // If there's an active search, refresh the search results to update the UI
        if (searchQuery && searchQuery.trim().length >= 2) {
          searchUsers(searchQuery);
        }
      } else {
        setError('Failed to cancel friend request');
      }
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      setError('Network error');
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/friends/friends/${friendId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSuccess('Friend removed successfully');
        fetchFriends(); // Refresh friends list
      } else {
        setError('Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      setError('Network error');
    }
  };

  const handleStartDM = async (friendId) => {
    if (!token || !onSelectDirectMessage) return;
    
    try {
      // Get or create DM conversation
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messaging/users/${friendId}/dm`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        onSelectDirectMessage(data.dm_id);
      } else {
        setError('Failed to start DM');
      }
    } catch (error) {
      console.error('Error starting DM:', error);
      setError('Network error');
    }
  };

  // Menu handlers
  const handleFriendMenuOpen = (event, friend) => {
    setFriendMenuAnchor(event.currentTarget);
    setSelectedFriend(friend);
  };

  const handleFriendMenuClose = () => {
    setFriendMenuAnchor(null);
    setSelectedFriend(null);
  };

  const handleCopyUsername = () => {
    if (selectedFriend) {
      navigator.clipboard.writeText(selectedFriend.username || selectedFriend.name);
      setSuccess('Username copied to clipboard!');
    }
    handleFriendMenuClose();
  };

  const handleViewProfile = () => {
    if (selectedFriend && onShowUserProfile) {
      onShowUserProfile(selectedFriend.id);
    }
    handleFriendMenuClose();
  };

  const handleBlockUser = () => {
    // TODO: Implement block functionality
    setSuccess('Block functionality coming soon!');
    handleFriendMenuClose();
  };

  const handleReportUser = () => {
    // TODO: Implement report functionality
    setSuccess('Report functionality coming soon!');
    handleFriendMenuClose();
  };

  const renderSentRequest = (request) => (
    <ListItem
      key={request.id}
      sx={{
        borderRadius: 1,
        mb: 1,
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        },
      }}
    >
      <ListItemAvatar>
        <Avatar src={getProfilePictureUrl(request.profile_picture)} sx={{ width: 40, height: 40 }}>
          {getAvatarInitial(request.username, request.name)}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box>
            <Typography sx={{ fontWeight: 500, color: 'text.primary' }}>
              @{request.username}
            </Typography>
            {request.name && request.name !== request.username && (
              <Typography variant="caption" color="text.secondary">
                {request.name}
              </Typography>
            )}
          </Box>
        }
        secondary="Friend request sent"
        primaryTypographyProps={{
          component: 'div',
        }}
        secondaryTypographyProps={{
          component: 'div',
          sx: { color: 'text.secondary' },
        }}
      />
      <Box>
        <IconButton
          size="small"
          onClick={() => handleCancelSentRequest && handleCancelSentRequest(request.id)}
          sx={{ color: '#d32f2f' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
    </ListItem>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#44b700';
      case 'away': return '#ff9800'; // orange/yellow for away
      case 'dnd': return '#d32f2f';
      case 'offline': return '#757575';
      default: return '#757575';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'dnd': return 'Do Not Disturb';
      case 'offline': return 'Offline';
      default: return 'Offline';
    }
  };

  const getDisplayName = (user) => user.name && user.name !== user.username ? user.name : null;

  // Real-time online friends derived from friends and userStatuses
  const getLiveStatus = (user) => userStatuses.get(user.id) || user.status || 'offline';
  const realTimeOnlineFriends = friends.filter(f => getLiveStatus(f) === 'online');

  const renderFriendItem = (friend) => (
    <ListItem
      key={friend.id}
      sx={{
        borderRadius: 1,
        mb: 1,
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        },
      }}
    >
      <ListItemAvatar>
        <Box sx={{ position: 'relative' }}>
          <Avatar 
            src={getProfilePictureUrl(friend.profile_picture)}
            sx={{ 
              width: 40, 
              height: 40,
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8,
              }
            }}
            onClick={() => {
              if (onShowUserProfile) {
                onShowUserProfile(friend.id);
              }
            }}
          >
            {getAvatarInitial(friend.username, friend.name)}
          </Avatar>
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 16,
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: getStatusColor(getLiveStatus(friend)),
              border: 2,
              borderColor: '#2F3136',
            }}
          />
        </Box>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box>
            <Typography
              sx={{ 
                fontWeight: 500, 
                color: 'text.primary',
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline',
                }
              }}
              onClick={() => {
                if (onShowUserProfile) {
                  onShowUserProfile(friend.id);
                }
              }}
            >
              @{friend.username}
            </Typography>
            {getDisplayName(friend) && (
              <Typography variant="caption" color="text.secondary">
                {friend.name}
              </Typography>
            )}
          </Box>
        }
        secondary={getStatusText(getLiveStatus(friend))}
        primaryTypographyProps={{
          component: 'div',
        }}
        secondaryTypographyProps={{
          component: 'div',
          sx: { color: 'text.secondary' },
        }}
      />
      <Box>
        <IconButton 
          size="small" 
          sx={{ color: isDarkMode ? '#B9BBBE' : theme.palette.text.secondary }}
          onClick={() => handleStartDM && handleStartDM(friend.id)}
        >
          <MessageIcon />
        </IconButton>
        <IconButton 
          size="small" 
          sx={{ color: isDarkMode ? '#B9BBBE' : theme.palette.text.secondary }}
          onClick={(event) => handleFriendMenuOpen && handleFriendMenuOpen(event, friend)}
        >
          <MoreVertIcon sx={{ color: isDarkMode ? '#B9BBBE' : theme.palette.text.secondary }} />
        </IconButton>
      </Box>
    </ListItem>
  );

  const renderFriendRequest = (request) => (
    <ListItem
      key={request.id}
      sx={{
        borderRadius: 1,
        mb: 1,
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        },
      }}
    >
      <ListItemAvatar>
        <Avatar src={getProfilePictureUrl(request.profile_picture)} sx={{ width: 40, height: 40 }}>
          {getAvatarInitial(request.username, request.name)}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box>
            <Typography sx={{ fontWeight: 500, color: 'text.primary' }}>
              @{request.username}
            </Typography>
            {request.name && request.name !== request.username && (
              <Typography variant="caption" color="text.secondary">
                {request.name}
              </Typography>
            )}
          </Box>
        }
        secondary="Wants to be your friend"
        primaryTypographyProps={{
          component: 'div',
        }}
        secondaryTypographyProps={{
          component: 'div',
          sx: { color: 'text.secondary' },
        }}
      />
      <Box>
        <IconButton
          size="small"
          onClick={() => handleAcceptRequest(request.id)}
          sx={{ color: '#44b700', mr: 1 }}
        >
          <CheckIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => handleRejectRequest(request.id)}
          sx={{ color: '#d32f2f' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
    </ListItem>
  );

  const renderSearchResult = (user) => (
    <ListItem
      key={user.id}
      sx={{
        borderRadius: 1,
        mb: 1,
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        },
      }}
    >
      <ListItemAvatar>
        <Avatar src={getProfilePictureUrl(user.profile_picture)} sx={{ width: 40, height: 40 }}>
          {getAvatarInitial(user.username, user.name)}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={user.name}
        secondary={`@${user.username}`}
        primaryTypographyProps={{
          component: 'div',
          sx: { fontWeight: 500, color: 'text.primary' },
        }}
        secondaryTypographyProps={{
          component: 'div',
          sx: { color: 'text.secondary' },
        }}
      />
      <Box>
        {user.relationship_status === 'friend' && (
          <Chip label="Friends" size="small" color="success" />
        )}
        {user.relationship_status === 'request_sent' && (
          <Chip label="Request Sent" size="small" color="warning" />
        )}
        {user.relationship_status === 'request_received' && (
          <Chip label="Request Received" size="small" color="info" />
        )}
        {user.relationship_status === 'none' && (
          <Button
            size="small"
            startIcon={<PersonAddIcon />}
            onClick={() => {
              setFriendUsername(user.username);
              handleAddFriendFromSearch(user);
            }}
          >
            Add Friend
          </Button>
        )}
      </Box>
    </ListItem>
  );

  return (
    <Fade in={true} timeout={700}>
      <Box sx={{ 
        p: { xs: 0.5, sm: 1, md: 2 }, 
        maxWidth: { xs: '100%', sm: 600, md: 700 }, // Added xl
        mx: 'auto',
        width: '100%'
      }}>
        {/* Modern Header */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'stretch', sm: 'center' }, 
          mb: { xs: 1, sm: 2, md: 4 },
          p: { xs: 1.5, sm: 2, md: 3 },
          gap: { xs: 1.5, sm: 0 },
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(87, 242, 135, 0.1) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          maxWidth: { xs: '100%', sm: 600, md: 700 }, // Added xl
          mx: 'auto',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #3B82F6 0%, #57F287 100%)',
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3B82F6 0%, #57F287 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}>
              <PeopleIcon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h4" component="h1" sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #3B82F6 0%, #57F287 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Friends
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {friends.length} friends • {realTimeOnlineFriends.length} online
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setAddFriendDialog(true)}
            sx={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #4752C4 100%)',
              borderRadius: 2,
              px: { xs: 2, sm: 3 },
              py: { xs: 1, sm: 1.5 },
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4752C4 0%, #3C45A5 100%)',
                boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)',
                transform: 'translateY(-1px)',
              },
              '&:active': {
                transform: 'translateY(0)',
              }
            }}
          >
            Add Friend
          </Button>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Search Bar - Made more prominent */}
        <Paper sx={{ 
          p: { xs: 1.5, sm: 2, md: 3 }, 
          mb: { xs: 1, sm: 2, md: 3 },
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <SearchIcon sx={{ color: '#3B82F6', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Find People
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              placeholder="Search by username or name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: searchLoading && <CircularProgress size={20} />,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '1.1rem',
                  py: 1,
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#3B82F6',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3B82F6',
                  },
                }
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Search for users to add as friends. You can search by username or display name.
          </Typography>
        </Paper>



        {/* Search Results - Made more prominent */}
        {searchQuery && (
          <Paper sx={{ 
            p: { xs: 1.5, sm: 2, md: 3 }, 
            mb: { xs: 1, sm: 2, md: 3 } 
          }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Search Results
              {searchResults.length > 0 && ` (${searchResults.length})`}
            </Typography>
            {searchResults.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No users found matching &quot;{searchQuery}&quot;
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Try searching with a different username or name
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {(Array.isArray(searchResults) ? searchResults : []).map(renderSearchResult)}
              </List>
            )}
          </Paper>
        )}

        {/* Tabs */}
        <Paper sx={{ 
          mb: { xs: 1, sm: 2, md: 3 },
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          maxWidth: { xs: '100%', sm: 700, md: 800 },
          mx: 'auto',
        }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            key={`tabs-${friends.length}-${friendRequests.length}-${sentRequests.length}`}
            variant={window.innerWidth < 900 ? 'scrollable' : 'fullWidth'}
            scrollButtons={window.innerWidth < 900 ? 'auto' : false}
            allowScrollButtonsMobile={window.innerWidth < 900}
            sx={{
              minHeight: { xs: 56, sm: 48 },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.75rem', lg: '0.9rem' }, // smaller at md and below
                minHeight: { xs: 56, sm: 48 },
                color: 'text.secondary',
                padding: { xs: '6px 8px', sm: '8px 12px', md: '8px 12px', lg: '12px 16px' }, // tighter at md and below
                '&.Mui-selected': {
                  color: '#3B82F6',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#3B82F6',
                height: 3,
                transition: 'all 0.3s ease',
              },
              '& .MuiTabs-flexContainer': {
                justifyContent: 'center', // center the tabs
                gap: 0, // remove gap
              },
              '& .MuiTabs-scroller': {
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
              },
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleIcon sx={{ fontSize: 18 }} />
                  <span>All Friends ({friends.length})</span>
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: '#57F287',
                    mr: 0.5
                  }} />
                  <span>Online ({realTimeOnlineFriends.length})</span>
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonAddIcon sx={{ fontSize: 18 }} />
                  <span>Requests ({friendRequests.length})</span>
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon sx={{ fontSize: 18 }} />
                  <span>Pending ({sentRequests.length})</span>
                </Box>
              } 
            />
          </Tabs>
        </Paper>

        {/* Search Bar for Current Tab */}
        <Paper sx={{ 
          p: { xs: 1, sm: 1.5, md: 2 }, 
          mb: { xs: 1, sm: 2, md: 3 },
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FilterListIcon sx={{ color: '#57F287', fontSize: 20 }} />
            <TextField
              fullWidth
              placeholder={
                activeTab === 0 ? "Search through your friends..." :
                activeTab === 1 ? "Search through online friends..." :
                activeTab === 2 ? "Search through friend requests..." :
                "Search through sent requests..."
              }
              value={friendsSearchQuery}
              onChange={(e) => setFriendsSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '1rem',
                  py: 0.5,
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#57F287',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#57F287',
                  },
                }
              }}
            />
          </Box>
        </Paper>

        {/* Tab Content */}
        <Paper sx={{ 
          p: { xs: 0.5, sm: 1, md: 2 },
          maxHeight: { xs: '50vh', sm: 'none' },
          overflow: { xs: 'auto', sm: 'visible' }
        }}>
          {activeTab === 0 && (
            <Box sx={{ flex: 1, minHeight: '100%' }}>
              {friends.length === 0 ? (
                <Zoom in={true} timeout={700}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      minHeight: '50vh',
                      width: '100%',
                      maxWidth: '100%',
                      gap: 2,
                      m: 0,
                      p: 0,
                    }}
                  >
                    {/* SVG Illustration */}
                    <Box sx={{ mb: 3 }}>
                      <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <ellipse cx="90" cy="150" rx="70" ry="18" fill="#E3E9F7" />
                        <rect x="50" y="60" width="80" height="40" rx="16" fill="#57F287" />
                        <rect x="65" y="75" width="50" height="10" rx="5" fill="#fff" opacity="0.8" />
                        <circle cx="70" cy="70" r="7" fill="#3B82F6" />
                        <circle cx="110" cy="70" r="7" fill="#FEE75C" />
                        <rect x="80" y="100" width="20" height="8" rx="4" fill="#ED4245" />
                      </svg>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                      You have no friends yet
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2, maxWidth: '400px' }}>
                      Search for people above or enter your friends username!
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<PersonAddIcon />}
                      onClick={() => setAddFriendDialog(true)}
                    >
                      Add Your First Friend
                    </Button>
                  </Box>
                </Zoom>
              ) : filteredFriends.length === 0 && friendsSearchQuery ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary" gutterBottom>
                    No friends found matching &quot;{friendsSearchQuery}&quot;
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try searching with a different term or clear the search
                  </Typography>
                </Box>
              ) : (
                <>
                  {/* Fun friendship tip */}
                  <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      💡 Did you know? Friends make every chat brighter. Say hi to someone today!
                    </Typography>
                  </Box>
                  <List>
                    {(Array.isArray(friendsSearchQuery ? filteredFriends : friends) ? (friendsSearchQuery ? filteredFriends : friends) : []).map((friend, idx) => (
                      <Grow in={true} timeout={500 + idx * 80} key={friend.id}>
                        {renderFriendItem(friend)}
                      </Grow>
                    ))}
                  </List>
                </>
              )}
            </Box>
          )}

          {activeTab === 1 && (
            <Box sx={{ width: '100%' }}>
              {realTimeOnlineFriends.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, width: '100%' }}>
                  <Typography color="text.secondary" gutterBottom>
                    No friends online right now
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your friends will appear here when they come online
                  </Typography>
                </Box>
              ) : filteredOnlineFriends.length === 0 && friendsSearchQuery ? (
                <Box sx={{ textAlign: 'center', py: 4, width: '100%' }}>
                  <Typography color="text.secondary" gutterBottom>
                    No online friends found matching &quot;{friendsSearchQuery}&quot;
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try searching with a different term or clear the search
                  </Typography>
                </Box>
              ) : (
                <List>
                                      {(Array.isArray(friendsSearchQuery ? filteredOnlineFriends : realTimeOnlineFriends) ? (friendsSearchQuery ? filteredOnlineFriends : realTimeOnlineFriends) : []).map(renderFriendItem)}
                </List>
              )}
            </Box>
          )}

          {activeTab === 2 && (
            <Box sx={{ width: '100%' }}>
              {friendRequests.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, width: '100%' }}>
                  <Typography color="text.secondary" gutterBottom>
                    No pending friend requests
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    When someone sends you a friend request, it will appear here
                  </Typography>
                </Box>
              ) : filteredFriendRequests.length === 0 && friendsSearchQuery ? (
                <Box sx={{ textAlign: 'center', py: 4, width: '100%' }}>
                  <Typography color="text.secondary" gutterBottom>
                    No friend requests found matching &quot;{friendsSearchQuery}&quot;
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try searching with a different term or clear the search
                  </Typography>
                </Box>
              ) : (
                <List>
                                      {(Array.isArray(filteredFriendRequests) ? filteredFriendRequests : []).map(renderFriendRequest)}
                </List>
              )}
            </Box>
          )}

          {activeTab === 3 && (
            <Box sx={{ width: '100%' }}>
              {sentRequests.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, width: '100%' }}>
                  <Typography color="text.secondary" gutterBottom>
                    No sent friend requests
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    When you send friend requests, they will appear here
                  </Typography>
                </Box>
              ) : filteredSentRequests.length === 0 && friendsSearchQuery ? (
                <Box sx={{ textAlign: 'center', py: 4, width: '100%' }}>
                  <Typography color="text.secondary" gutterBottom>
                    No sent requests found matching &quot;{friendsSearchQuery}&quot;
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try searching with a different term or clear the search
                  </Typography>
                </Box>
              ) : (
                <List>
                                      {(Array.isArray(filteredSentRequests) ? filteredSentRequests : []).map(renderSentRequest)}
                </List>
              )}
            </Box>
          )}
        </Paper>

        {/* Add Friend Dialog */}
        <Dialog open={addFriendDialog} onClose={() => setAddFriendDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Add Friend
            <IconButton
              onClick={() => setAddFriendDialog(false)}
              autoFocus
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Username"
              type="text"
              fullWidth
              variant="outlined"
              value={friendUsername}
              onChange={(e) => setFriendUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddFriend()}
              placeholder="Enter the username of the person you want to add"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddFriendDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleAddFriend} 
              disabled={loading || !friendUsername.trim()}
            >
              {loading ? <CircularProgress size={20} /> : 'Add Friend'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Friend Actions Menu */}
        <Menu
          anchorEl={friendMenuAnchor}
          open={Boolean(friendMenuAnchor)}
          onClose={handleFriendMenuClose}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 200,
              background: isDarkMode ? theme.palette.background.paper : 'rgba(255, 255, 255, 0.95)',
              color: isDarkMode ? theme.palette.text.primary : 'inherit',
              backdropFilter: 'blur(10px)',
              border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleViewProfile || (() => {})}>
            <ListItemIcon>
              <InfoIcon fontSize="small" />
            </ListItemIcon>
            View Profile
          </MenuItem>
          <MenuItem onClick={handleCopyUsername || (() => {})}>
            <ListItemIcon>
              <CopyIcon fontSize="small" />
            </ListItemIcon>
            Copy Username
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => {
            if (selectedFriend) {
              handleRemoveFriend(selectedFriend.id);
            }
            handleFriendMenuClose();
          }} sx={{ color: '#d32f2f' }}>
            <ListItemIcon>
              <PersonRemoveIcon fontSize="small" sx={{ color: '#d32f2f' }} />
            </ListItemIcon>
            Remove Friend
          </MenuItem>
          <MenuItem onClick={handleBlockUser || (() => {})} sx={{ color: '#f57c00' }}>
            <ListItemIcon>
              <BlockIcon fontSize="small" sx={{ color: '#f57c00' }} />
            </ListItemIcon>
            Block User
          </MenuItem>
          <MenuItem onClick={handleReportUser || (() => {})} sx={{ color: '#d32f2f' }}>
            <ListItemIcon>
              <ReportIcon fontSize="small" sx={{ color: '#d32f2f' }} />
            </ListItemIcon>
            Report User
          </MenuItem>
        </Menu>


      </Box>
    </Fade>
  );
};

Friends.propTypes = {
  onShowUserProfile: PropTypes.func,
  onSelectDirectMessage: PropTypes.func,
};

export default Friends; 