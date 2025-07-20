import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Badge,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Fade,
  Grow,
  Slide,
  Zoom,
  LinearProgress,
  Skeleton,
} from '@mui/material';
import {
  Message as MessageIcon,
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
  Star as StarIcon,
  Circle as CircleIcon,
  AccessTime as AccessTimeIcon,
  Timeline as TimelineIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Celebration as CelebrationIcon,
  Visibility,
  DarkMode,
  LightMode,
} from '@mui/icons-material';
import { useAuth } from "../contexts/AuthContext";
import { getProfilePictureUrl, getAvatarInitial } from "../utils/imageUtils";
import { useNavigate } from "react-router-dom";
import { useSocket } from '../contexts/SocketContext';

const Home = ({ onShowUserProfile, onSelectDirectMessage, mode, setMode }) => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const now = Date.now();
  const [friendActivity, setFriendActivity] = useState({
    friendRequests: [],
    friends: [],
    statusActivity: []
  });
  const [dmActivity, setDmActivity] = useState({
    dmConversations: [],
    recentDMMessages: [],
    unreadSummary: { total_unread: 0, conversations_with_unread: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const navigate = useNavigate();
  const tabsRef = useRef();
  const { userStatuses } = useSocket();
  const [lastSeenMap, setLastSeenMap] = useState({});
  const prevStatusesRef = useRef(new Map());

  useEffect(() => {
    if (token) {
      fetchAllActivityData();
    }
  }, [token]);

  useEffect(() => {
    if (
      tabsRef.current &&
      typeof tabsRef.current.updateIndicator === 'function' &&
      !loading
    ) {
      tabsRef.current.updateIndicator();
    }
  }, [
    loading,
    friendActivity.friendRequests.length,
    dmActivity.unreadSummary.total_unread
  ]);

  // Force tabs to recalculate layout when data changes
  useEffect(() => {
    if (!loading) {
      // Multiple attempts to ensure indicator updates
      const timers = [
        setTimeout(() => {
          if (tabsRef.current && typeof tabsRef.current.updateIndicator === 'function') {
            tabsRef.current.updateIndicator();
          }
          window.dispatchEvent(new Event('resize'));
        }, 50),
        setTimeout(() => {
          if (tabsRef.current && typeof tabsRef.current.updateIndicator === 'function') {
            tabsRef.current.updateIndicator();
          }
          window.dispatchEvent(new Event('resize'));
        }, 200),
        setTimeout(() => {
          if (tabsRef.current && typeof tabsRef.current.updateIndicator === 'function') {
            tabsRef.current.updateIndicator();
          }
          window.dispatchEvent(new Event('resize'));
        }, 500)
      ];
      
      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [loading, friendActivity.friendRequests.length, dmActivity.unreadSummary.total_unread, activeTab]);

  // Force indicator update when activeTab changes
  useEffect(() => {
    if (!loading && tabsRef.current) {
      const timer = setTimeout(() => {
        if (tabsRef.current && typeof tabsRef.current.updateIndicator === 'function') {
          tabsRef.current.updateIndicator();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, loading]);

  // Show celebration animation only after first login
  useEffect(() => {
    if (!loading && user && !hasShownWelcome) {
      if (localStorage.getItem('justLoggedIn') === 'true') {
        setShowCelebration(true);
        setHasShownWelcome(true);
        localStorage.removeItem('justLoggedIn');
        setTimeout(() => setShowCelebration(false), 3000);
      }
    }
  }, [loading, user, hasShownWelcome]);

  // Update lastSeenMap only when a user's status transitions to offline
  useEffect(() => {
    const newLastSeen = {};
    friendActivity.statusActivity.forEach(friend => {
      const prevStatus = prevStatusesRef.current.get(friend.id);
      const currentStatus = getLiveStatus(friend);
      if (prevStatus && prevStatus !== 'offline' && currentStatus === 'offline') {
        newLastSeen[friend.id] = Date.now();
      }
      // Update the ref for next time
      prevStatusesRef.current.set(friend.id, currentStatus);
    });
    if (Object.keys(newLastSeen).length > 0) {
      setLastSeenMap(prev => ({ ...prev, ...newLastSeen }));
    }
  }, [userStatuses, friendActivity.statusActivity]);

  // Remove tabRenderKey, indicatorStyle, tabLabelRefs, friendsTabLabelRef, tabsRef, and all related useEffects

  const fetchAllActivityData = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all activity data in parallel
      const [friendResponse, dmResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/friends/activity`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messaging/activity/dms`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (friendResponse.ok) {
        const friendData = await friendResponse.json();
        setFriendActivity(friendData);
      }

      if (dmResponse.ok) {
        const dmData = await dmResponse.json();
        setDmActivity(dmData);
      }

    } catch (error) {
      console.error('Error fetching activity data:', error);
      setError('Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllActivityData();
    setRefreshing(false);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now - date) / (1000 * 60);
    const diffInHours = diffInMinutes / 60;
    const diffInDays = diffInHours / 24;

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m ago`;
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInDays < 7) return `${Math.floor(diffInDays)}d ago`;
    return date.toLocaleDateString();
  };

  const getLiveStatus = (user) => userStatuses.get(user.id || user.friend_id) || user.status || 'offline';

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#44b700';
      case 'idle': return '#ff9800';
      case 'away': return '#ff9800';
      case 'dnd': return '#f44336';
      case 'offline': return '#bdbdbd';
      default: return '#bdbdbd';
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleViewProfile = (userId) => {
    if (onShowUserProfile) {
      onShowUserProfile(userId);
    }
  };
  const handleOpenDM = (userId) => {
    if (onSelectDirectMessage) {
      onSelectDirectMessage(userId);
    }
  };

  const getActivityScore = () => {
    let score = 0;
    score += friendActivity.friends.length * 10;
    score += friendActivity.friendRequests.filter(r => r.status === 'pending').length * 5;
    score += dmActivity.unreadSummary.total_unread * 2;
    return Math.min(score, 100);
  };

  const getActivityLevel = (score) => {
    if (score >= 80) return { level: 'Very Active', color: '#57F287', icon: <SparklesIcon /> };
    if (score >= 60) return { level: 'Active', color: '#5865F2', icon: <TrendingUpIcon /> };
    if (score >= 40) return { level: 'Moderate', color: '#FEE75C', icon: <TimelineIcon /> };
    if (score >= 20) return { level: 'Quiet', color: '#F57C00', icon: <TrendingDownIcon /> };
    return { level: 'Inactive', color: '#747F8D', icon: <Visibility /> };
  };

  // --- Modernized ListItem Styles ---
  const modernListItemSx = {
    px: 2, // Add horizontal padding for more space left/right
    mb: 1,
    cursor: 'pointer',
    borderRadius: 2,
    transition: 'transform 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s, background 0.18s',
    boxShadow: 0,
    '&:hover, &:focus': {
      bgcolor: 'action.hover',
      transform: 'scale(1.03)',
      boxShadow: 6,
      position: 'relative',
      zIndex: 2,
    },
    '&:active': {
      transform: 'scale(0.98)',
      boxShadow: 2,
      position: 'relative',
      zIndex: 2,
    },
  };
  const modernAvatarBoxSx = {
    position: 'relative',
    cursor: 'pointer',
    transition: 'transform 0.18s cubic-bezier(.4,2,.6,1), filter 0.18s',
    ml: 0.5, // Add a little left margin so avatar isn't flush left
    mr: 1.5, // Add right margin for spacing from text
    '&:hover, &:focus': { filter: 'brightness(0.85)', transform: 'scale(1.13)' },
    '&:active': { transform: 'scale(0.98)' },
  };
  const modernUsernameStyle = {
    fontWeight: 500,
    cursor: 'pointer',
    color: '#5865F2',
    transition: 'color 0.18s, text-decoration 0.18s, transform 0.18s',
  };
  // Simple style for Recently Added
  const simpleListItemSx = {
    px: 2,
    mb: 1,
    cursor: 'pointer',
    borderRadius: 2,
    transition: 'background 0.18s',
    boxShadow: 0,
    '&:hover, &:focus': {
      bgcolor: 'action.hover',
    },
    '&:active': {},
  };
  const simpleAvatarBoxSx = {
    position: 'relative',
    cursor: 'pointer',
    transition: 'none',
    ml: 0.5,
    mr: 1.5,
  };

  // Cool, natural greeting messages
  const greetingTemplates = [
    'Welcome back!',
    'Good to see you!',
    'Hope you\'re having a great day!',
    'Let\'s get chatting!',
    'Nice to see you again!',
    'Ready for some new messages?',
    'Your friends are waiting!',
    'Jump into the conversation!',
    'Let\'s make today awesome!',
    'Glad you\'re here!'
  ];
  const randomGreeting = useMemo(() => {
    const idx = Math.floor(Math.random() * greetingTemplates.length);
    return greetingTemplates[idx];
  }, []);

  if (loading) {
    return (
      <Box sx={{ 
        flex: 1, 
        p: 3, 
        bgcolor: 'background.default', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        gap: 3
      }}>
        <Zoom in={true}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ color: '#5865F2', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'text.primary', mb: 1 }}>
              Loading your dashboard...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gathering your latest activity
            </Typography>
          </Box>
        </Zoom>
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Skeleton variant="rectangular" height={120} sx={{ mb: 2, borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={120} sx={{ mb: 2, borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
        </Box>
      </Box>
    );
  }

  // Remove activity level calculation and UI
  // const activityScore = getActivityScore();
  // const activityLevel = getActivityLevel(activityScore);

  // Add SVG illustration and greeting if all lists are empty
  const showEmptyState =
    dmActivity.dmConversations.length === 0 &&
    dmActivity.recentDMMessages.length === 0 &&
    friendActivity.statusActivity.length === 0;

  // Calculate 2 weeks in ms
  const TWO_WEEKS = 1000 * 60 * 60 * 24 * 14;

  // Add a placeholder for server count
  const SERVER_PLACEHOLDER_COUNT = 0;

  return (
    <Box sx={{ 
      flex: 1, 
      p: { xs: 0.5, sm: 1, md: 2, lg: 3 }, 
      bgcolor: 'background.default', 
      overflow: 'auto', 
      position: 'relative' 
    }}>
      {/* Theme Toggle Button */}
      {setMode && (
        <IconButton
          onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            color: mode === 'dark' ? 'white' : 'black',
            bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
            },
            zIndex: 1000
          }}
        >
          {mode === 'dark' ? <LightMode /> : <DarkMode />}
        </IconButton>
      )}
      {/* Celebration Animation */}
      {showCelebration && (
        <Fade in={showCelebration} timeout={1000}>
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
              pointerEvents: 'none',
            }}
          >
            <Zoom in={showCelebration} timeout={500}>
              <Box sx={{ textAlign: 'center' }}>
                <CelebrationIcon sx={{ fontSize: 80, color: '#57F287', mb: 2 }} />
                <Typography variant="h4" sx={{ color: '#57F287', fontWeight: 'bold' }}>
                  Welcome back!
                </Typography>
              </Box>
            </Zoom>
          </Box>
        </Fade>
      )}

      {/* Welcome Header */}
      <Fade in={!loading} timeout={800}>
        <Box sx={{ mb: 4, pt: { xs: 1.5, sm: 1, md: 0, lg: 0 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                {randomGreeting}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Here's what's happening in your world
              </Typography>
            </Box>
            {/* Removed duplicate dark mode toggle from header */}
          </Box>
          
          {/* Activity Level Indicator */}
          {/* Remove activity level UI (progress bar, level, etc.) */}
        </Box>
      </Fade>

      {error && (
        <Slide in={!!error} direction="down">
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        </Slide>
      )}

      {/* Quick Stats */}
      <Grow in={!loading} timeout={1200}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: { xs: 0.5, sm: 1, md: 2 }, mb: { xs: 1, sm: 2, md: 4 } }}>
          <Box sx={{ flex: 1 }}>
            <Card sx={{ bgcolor: 'background.paper', height: 120, display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>{friendActivity.friends.length}</Typography>
                    <Typography color="text.secondary">Friends</Typography>
                  </Box>
                  <Badge badgeContent={friendActivity.friendRequests.filter(r => r.status === 'pending').length} color="error">
                    <Avatar sx={{ bgcolor: '#1976d2' }}><PersonAddIcon /></Avatar>
                  </Badge>
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Card sx={{ bgcolor: 'background.paper', height: 120, display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>{SERVER_PLACEHOLDER_COUNT}</Typography>
                    <Typography color="text.secondary">Servers</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#388e3c' }}><GroupIcon /></Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Card sx={{ bgcolor: 'background.paper', height: 120, display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>{dmActivity.unreadSummary.total_unread}</Typography>
                    <Typography color="text.secondary">Unread Messages</Typography>
                  </Box>
                  <Badge badgeContent={dmActivity.unreadSummary.conversations_with_unread} color="primary">
                    <Avatar sx={{ bgcolor: '#f57c00' }}><MessageIcon /></Avatar>
                  </Badge>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Grow>

      {/* Activity Tabs */}
      <Grow in={!loading} timeout={1400}>
        <Card sx={{ 
          bgcolor: 'background.paper', 
          mb: { xs: 1, sm: 2, md: 3 },
          overflow: 'hidden'
        }}>
          {loading ? (
            <Box sx={{ height: 56, display: 'flex', alignItems: 'center', px: 2 }}>
              <Skeleton variant="rectangular" width={240} height={32} sx={{ borderRadius: 2 }} />
            </Box>
          ) : (
            <>
              <Tabs
                key={`home-tabs-${friendActivity.friendRequests.length}-${dmActivity.unreadSummary.total_unread}-${loading}-${activeTab}`}
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  minHeight: { xs: 56, sm: 48 },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#5865F2',
                    height: 3,
                    transition: 'all 0.3s ease',
                  },
                  '& .MuiTabs-flexContainer': {
                    justifyContent: 'flex-start',
                    gap: { xs: 0, sm: 1 },
                  },
                  '& .MuiTab-root': {
                    minHeight: { xs: 56, sm: 48 },
                    minWidth: { xs: 100, sm: 120, md: 140 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                    padding: { xs: '8px 12px', sm: '12px 16px' },
                  },
                }}
                action={tabsRef}
              >
                <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PersonAddIcon />Friends{friendActivity.friendRequests.filter(r => r.status === 'pending').length > 0 && (<Chip label={friendActivity.friendRequests.filter(r => r.status === 'pending').length} size="small" color="error" sx={{ height: 16, fontSize: '0.7rem' }} />)}</Box>} />
                <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><GroupIcon />Servers</Box>} />
                <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><MessageIcon />Messages{dmActivity.unreadSummary.total_unread > 0 && (<Chip label={dmActivity.unreadSummary.total_unread} size="small" color="primary" sx={{ height: 16, fontSize: '0.7rem' }} />)}</Box>} />
              </Tabs>
              <CardContent sx={{ 
                p: { xs: 0.5, sm: 1, md: 2 },
                maxHeight: { xs: '50vh', sm: 'none' },
                overflow: { xs: 'auto', sm: 'visible' }
              }}>
                {/* Friends Tab */}
                {activeTab === 0 && (
                  <Slide in={activeTab === 0} direction="left" timeout={300}>
                    <Box>
                      {/* Find Friends Button */}
                      {/* Best Friends (most recently messaged) */}
                      {dmActivity.dmConversations
                        .filter(dm => dm.type === 'dm' && (dm.total_messages || 0) >= 5)
                        .sort((a, b) => new Date(b.last_message_time || b.conversation_created) - new Date(a.last_message_time || a.conversation_created))
                        .slice(0, 5)
                        .length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <StarIcon sx={{ color: '#FEE75C' }} />
                              Best Friends
                            </Typography>
                          </Box>
                          <List sx={{ p: 0 }}>
                            {dmActivity.dmConversations
                              .filter(dm => dm.type === 'dm' && (dm.total_messages || 0) >= 5)
                              .sort((a, b) => new Date(b.last_message_time || b.conversation_created) - new Date(a.last_message_time || a.conversation_created))
                              .slice(0, 5)
                              .map((dm, index) => (
                                <Grow in={true} timeout={500 + index * 100} key={dm.id}>
                                  <ListItem
                                    sx={modernListItemSx}
                                    onClick={() => handleViewProfile(dm.other_user_id)}
                                  >
                                    <ListItemAvatar>
                                      <Box
                                        sx={modernAvatarBoxSx}
                                        onClick={e => { e.stopPropagation(); handleViewProfile(dm.other_user_id); }}
                                        tabIndex={0}
                                        aria-label={`View profile of @${dm.username || dm.display_name}`}
                                      >
                                        <Avatar src={getProfilePictureUrl(dm.profile_picture)}>
                                          {getAvatarInitial(dm.username, dm.display_name)}
                                        </Avatar>
                                      </Box>
                                    </ListItemAvatar>
                                    <ListItemText
                                      primary={
                                        <span
                                          style={{ fontWeight: 500, cursor: 'pointer', color: 'inherit', transition: 'color 0.18s, textDecoration 0.18s' }}
                                          onClick={e => { e.stopPropagation(); handleViewProfile(dm.other_user_id); }}
                                          onMouseOver={e => { e.target.style.textDecoration = 'underline'; e.target.style.color = '#4051b5'; }}
                                          onMouseOut={e => { e.target.style.textDecoration = 'none'; e.target.style.color = ''; }}
                                          tabIndex={0}
                                          aria-label={`View profile of @${dm.username || dm.display_name}`}
                                        >
                                          @{dm.username || dm.display_name}
                                        </span>
                                      }
                                      secondary={`${dm.total_messages?.toLocaleString() || 0} messages together`}
                                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                                      secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                    <IconButton
                                      onClick={e => { e.stopPropagation(); handleOpenDM(dm.id); }}
                                      size="small"
                                      sx={{ ml: 1, color: 'text.secondary', transition: 'color 0.18s, transform 0.18s', '&:hover': { color: '#5865F2', transform: 'scale(1.2)' }, '&:active': { transform: 'scale(0.98)' } }}
                                      aria-label="Open direct message"
                                    >
                                      <MessageIcon fontSize="small" />
                                    </IconButton>
                                  </ListItem>
                                </Grow>
                              ))}
                          </List>
                        </Box>
                      )}
                      {/* Check if there are any friends at all */}
                      {(() => {
                        const hasBestFriends = dmActivity.dmConversations
                          .filter(dm => dm.type === 'dm' && (dm.total_messages || 0) >= 5).length > 0;
                        const hasRecentlyOnline = friendActivity.statusActivity.length > 0;
                        const hasRecentlyAdded = friendActivity.friends
                          .filter(friend => friend.friend_id !== user?.id)
                          .filter(friend => now - new Date(friend.friendship_date).getTime() < 1000 * 60 * 60 * 48).length > 0;
                        
                        // Check if user has any friends at all (not just recent ones)
                        const hasAnyFriendsAtAll = friendActivity.friends.length > 0;
                        
                        if (!hasAnyFriendsAtAll) {
                          return (
                            <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                              You don't have any friends yet. Add friends to start chatting!
                            </Typography>
                          );
                        } else if (!hasBestFriends && !hasRecentlyOnline && !hasRecentlyAdded) {
                          return (
                            <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                              Seems a bit quiet around here. Add friends to start chatting!
                            </Typography>
                          );
                        }
                        return null;
                      })()}
                      {/* Recently Online */}
                      {friendActivity.statusActivity.length > 0 && (
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircleIcon sx={{ color: '#57F287' }} />
                            Recently Online
                          </Typography>
                          <List sx={{ p: 0 }}>
                            {friendActivity.statusActivity
                              .filter(friend => friend.id !== user?.id)
                              .filter(friend => now - new Date(friend.last_seen).getTime() < 1000 * 60 * 60 * 24 * 7)
                              .slice(0, 5)
                              .map((friend, index) => (
                                <Grow in={true} timeout={700 + index * 100} key={friend.id}>
                                  <ListItem 
                                    sx={modernListItemSx}
                                    onClick={() => handleViewProfile(friend.id)}
                                  >
                                    <ListItemAvatar>
                                      <Box sx={modernAvatarBoxSx} tabIndex={0} aria-label={`View profile of @${friend.username}`}> 
                                        <Avatar src={getProfilePictureUrl(friend.profile_picture)}>
                                          {getAvatarInitial(friend.username, friend.name)}
                                        </Avatar>
                                      </Box>
                                    </ListItemAvatar>
                                    <ListItemText
                                      primary={<span
                                        style={{ fontWeight: 500, cursor: 'pointer', color: 'inherit', transition: 'color 0.18s, textDecoration 0.18s' }}
                                        onMouseOver={e => { e.target.style.textDecoration = 'underline'; e.target.style.color = '#4051b5'; }}
                                        onMouseOut={e => { e.target.style.textDecoration = 'none'; e.target.style.color = ''; }}
                                      >@{friend.username}</span>}
                                      secondary={
                                        getLiveStatus(friend) === 'online'
                                          ? 'Online'
                                          : `Last seen ${formatTimestamp(friend.last_seen)}`
                                      }
                                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                                      secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                  </ListItem>
                                </Grow>
                              ))}
                          </List>
                        </Box>
                      )}
                      {/* Recently Added */}
                      {friendActivity.friends
                        .filter(friend => friend.friend_id !== user?.id)
                        .filter(friend => now - new Date(friend.friendship_date).getTime() < 1000 * 60 * 60 * 48)
                        .sort((a, b) => new Date(b.friendship_date) - new Date(a.friendship_date))
                        .slice(0, 5)
                        .length > 0 && (
                          <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AccessTimeIcon sx={{ color: '#5865F2' }} />
                              Recently Added
                            </Typography>
                            <List sx={{ p: 0 }}>
                              {friendActivity.friends
                                .filter(friend => friend.friend_id !== user?.id)
                                .filter(friend => now - new Date(friend.friendship_date).getTime() < 1000 * 60 * 60 * 48)
                                .sort((a, b) => new Date(b.friendship_date) - new Date(a.friendship_date))
                                .slice(0, 5)
                                .map(friend => (
                                  <ListItem
                                    key={friend.friend_id}
                                    sx={simpleListItemSx}
                                    onClick={() => handleViewProfile(friend.friend_id)}
                                  >
                                    <ListItemAvatar>
                                      <Box sx={modernAvatarBoxSx} tabIndex={0} aria-label={`View profile of @${friend.username}`}> 
                                        <Avatar src={getProfilePictureUrl(friend.profile_picture)}>
                                          {getAvatarInitial(friend.username, friend.name)}
                                        </Avatar>
                                      </Box>
                                    </ListItemAvatar>
                                    <ListItemText
                                      primary={<span
                                        style={{ fontWeight: 500, cursor: 'pointer', color: 'inherit', transition: 'color 0.18s, textDecoration 0.18s' }}
                                        onMouseOver={e => { e.target.style.textDecoration = 'underline'; e.target.style.color = '#4051b5'; }}
                                        onMouseOut={e => { e.target.style.textDecoration = 'none'; e.target.style.color = ''; }}
                                      >@{friend.username}</span>}
                                      secondary={`Friends since ${formatTimestamp(friend.friendship_date)}`}
                                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                                      secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                  </ListItem>
                                ))}
                            </List>
                          </Box>
                        )}
                    </Box>
                  </Slide>
                )}
                {/* Servers Tab */}
                {activeTab === 1 && (
                  <Slide in={activeTab === 1} direction="left" timeout={300}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
                      <Zoom in={true} timeout={500}>
                        <GroupIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      </Zoom>
                      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                        Servers Coming Soon!
                      </Typography>
                      <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ maxWidth: 400, mb: 3 }}>
                        We're working hard to bring you server functionality. You'll be able to create and join servers, manage channels, and collaborate with communities.
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Chip 
                          label="In Development" 
                          color="primary" 
                          variant="outlined" 
                          clickable={false}
                          tabIndex={-1}
                          sx={{ cursor: 'default', pointerEvents: 'none' }}
                        />
                        <Chip 
                          label="Coming Soon" 
                          color="secondary" 
                          variant="outlined" 
                          clickable={false}
                          tabIndex={-1}
                          sx={{ cursor: 'default', pointerEvents: 'none' }}
                        />
                      </Box>
                    </Box>
                  </Slide>
                )}
                {/* Messages Tab */}
                {activeTab === 2 && (
                  <Slide in={activeTab === 2} direction="left" timeout={300}>
                    <Box>
                      {dmActivity.dmConversations.length === 0 && dmActivity.recentDMMessages.length === 0 ? (
                        <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                          No messages yet. Start a conversation with a friend!
                        </Typography>
                      ) : (
                        <>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MessageIcon sx={{ color: '#5865F2' }} />
                            Recent Activity
                          </Typography>
                          <List sx={{ p: 0 }}>
                            {(() => {
                              // Merge and deduplicate by conversation id
                              const activityMap = new Map();
                              dmActivity.dmConversations.forEach(dm => {
                                activityMap.set(dm.id, {
                                  ...dm,
                                  type: dm.type,
                                  time: dm.last_message_time || dm.conversation_created
                                });
                              });
                              dmActivity.recentDMMessages.forEach(msg => {
                                if (!activityMap.has(msg.conversation_id)) {
                                  activityMap.set(msg.conversation_id, {
                                    id: msg.conversation_id,
                                    username: msg.username,
                                    name: msg.name,
                                    profile_picture: msg.profile_picture,
                                    last_message: msg.content,
                                    last_message_time: msg.created_at,
                                    unread_count: msg.is_read ? 0 : 1,
                                    type: 'msg',
                                    time: msg.created_at
                                  });
                                }
                              });
                              // Sort by most recent
                              const activityList = Array.from(activityMap.values()).sort((a, b) => new Date(b.time) - new Date(a.time));
                              return activityList.slice(0, 10).map((item, index) => (
                                <Grow in={true} timeout={500 + index * 100} key={item.id}>
                                  <ListItem 
                                    sx={modernListItemSx}
                                    onClick={() => handleOpenDM(item.id)}
                                  >
                                    <ListItemAvatar>
                                      <Box sx={modernAvatarBoxSx} tabIndex={0} aria-label={`View profile of @${item.username}`}> 
                                        <Avatar src={getProfilePictureUrl(item.profile_picture)}>
                                          {getAvatarInitial(item.username, item.name)}
                                        </Avatar>
                                      </Box>
                                    </ListItemAvatar>
                                    <ListItemText
                                      primary={
                                        item.type === 'group' || item.type === 'group_dm' ? (
                                          <span style={{ fontWeight: 500 }}>
                                            {item.display_name || item.name || 'Group DM'}
                                            {item.created_by_username && (
                                              <span style={{ fontWeight: 400, color: '#888', marginLeft: 8, fontSize: '0.9em' }}>
                                                (Created by @{item.created_by_username})
                                              </span>
                                            )}
                                          </span>
                                        ) : (
                                          <span style={{ fontWeight: 500 }}>
                                            @{item.username || item.display_name}
                                          </span>
                                        )
                                      }
                                      secondary={
                                        item.last_message 
                                          ? `${item.last_message} • ${formatTimestamp(item.last_message_time)}`
                                          : (item.type === 'group' || item.type === 'group_dm')
                                            ? `(Created by @${item.created_by_username})`
                                            : 'No messages yet'
                                      }
                                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                                      secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                    <IconButton
                                      onClick={e => { e.stopPropagation(); handleOpenDM(item.id); }}
                                      size="small"
                                      sx={{ ml: 1, color: 'text.secondary', transition: 'color 0.18s, transform 0.18s', '&:hover': { color: '#5865F2', transform: 'scale(1.2)' }, '&:active': { transform: 'scale(0.98)' } }}
                                      aria-label="Open direct message"
                                    >
                                      <MessageIcon fontSize="small" />
                                    </IconButton>
                                    {item.unread_count > 0 && (
                                      <Chip 
                                        label={item.unread_count} 
                                        size="small" 
                                        color="primary" 
                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                      />
                                    )}
                                  </ListItem>
                                </Grow>
                              ));
                            })()}
                          </List>
                        </>
                      )}
                    </Box>
                  </Slide>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </Grow>

      {/* Floating Action Button */}
      {/* Remove the Floating Action Button (Fab) */}

      {showEmptyState && (
        <Fade in={true} timeout={900}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
            <Slide in={true} direction="up" timeout={900}>
              <Box sx={{ mb: 3 }}>
                <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="90" cy="150" rx="70" ry="18" fill="#E3E9F7" />
                  <rect x="40" y="40" width="100" height="60" rx="18" fill="#5865F2" />
                  <rect x="55" y="60" width="70" height="10" rx="5" fill="#fff" opacity="0.8" />
                  <rect x="55" y="75" width="40" height="8" rx="4" fill="#fff" opacity="0.5" />
                  <circle cx="60" cy="55" r="6" fill="#FEE75C" />
                  <circle cx="75" cy="55" r="6" fill="#57F287" />
                  <circle cx="90" cy="55" r="6" fill="#ED4245" />
                </svg>
              </Box>
            </Slide>
            <Fade in={true} timeout={1200}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: 'text.primary', textAlign: 'center' }}>
                Welcome to NexusChat!
              </Typography>
            </Fade>
            <Fade in={true} timeout={1400}>
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 400, mb: 2 }}>
                Start a conversation, connect with friends, or join a server. Your chat world is waiting for you!
              </Typography>
            </Fade>
            <Fade in={true} timeout={1600}>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 400 }}>
                Tip: Click on a friends avatar or name anywhere to view their profile or start a direct message.
              </Typography>
            </Fade>
          </Box>
        </Fade>
      )}
    </Box>
  );
};

export default Home; 