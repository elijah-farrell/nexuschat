import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Send as SendIcon,
  MoreVert as MoreVertIcon,
  Group as GroupIcon,
  People as PeopleIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { getProfilePictureUrl, getAvatarInitial } from '../../utils/imageUtils';
import { useWindowFocus } from '../../contexts/NotificationContext';
import { useNotifications } from '../../contexts/NotificationContext';

const ChatArea = React.memo(({ 
  selectedChannel, 
  selectedDirectMessage,
}) => {
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [dmId, setDmId] = useState(null);
  const [dmInfo, setDmInfo] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const theme = useTheme();
  const [creatorInfo, setCreatorInfo] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const chatAreaRef = useRef();
  const isWindowFocused = useWindowFocus();
  const [showNewMessages, setShowNewMessages] = useState(false);
  const [showMemberList, setShowMemberList] = useState(false);
  const { clearNotification } = useNotifications();
  const { userStatuses } = useSocket();

  const getLiveStatus = (user) => userStatuses.get(user.id) || user.status || 'offline';
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#10B981'; // Modern green
      case 'idle': return '#F59E0B'; // Warm amber
      case 'away': return '#F59E0B'; // Warm amber
      case 'dnd': return '#EF4444'; // Clean red
      case 'offline': return '#94A3B8'; // Medium gray
      default: return '#94A3B8'; // Medium gray
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

  const fetchDMInfo = useCallback(async (overrideDmId = null) => {
    if (!token) return;
    try {
      setError(null);
      const id = overrideDmId || dmId;
      if (!id) return;
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messaging/dms/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDmInfo(data.dm);
      } else {
        setError('Failed to load conversation');
      }
    } catch (error) {
      setError('Failed to load conversation');
    }
  }, [token, dmId]);

  const fetchMessages = useCallback(async (overrideDmId = null) => {
    if (!token) return;
    setLoading(true);
    try {
      setError(null);
      let url;
      if (selectedChannel) {
        url = `${import.meta.env.VITE_BACKEND_URL}/api/messaging/channels/${selectedChannel.id}/messages`;
      } else if (dmId || overrideDmId) {
        const id = overrideDmId || dmId;
        url = `${import.meta.env.VITE_BACKEND_URL}/api/messaging/dms/${id}/messages`;
      } else {
        return;
      }
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || data);
      } else {
        setError('Failed to load messages');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [token, selectedChannel, dmId]);

  useEffect(() => {
    if (selectedChannel) {
      setDmId(null);
      setDmInfo(null);
      fetchMessages();
    } else if (selectedDirectMessage) {
      // Always treat selectedDirectMessage as a DM/conversation ID
      setDmId(selectedDirectMessage);
      fetchDMInfo(selectedDirectMessage);
      fetchMessages(selectedDirectMessage);
    }
  }, [selectedChannel, selectedDirectMessage, token, fetchMessages, fetchDMInfo]);

  // Also fetch DM info when dmId changes
  useEffect(() => {
    if (dmId && !selectedChannel) {
      fetchDMInfo();
    }
  }, [dmId, selectedChannel, fetchDMInfo]);

  // Real-time message handling
  useEffect(() => {
    if (!socket) return;

    // Join the appropriate room when channel/dm changes
    if (selectedChannel) {
      socket.emit('join_rooms', { channels: [selectedChannel.id] });
    } else if (dmId) {
      socket.emit('join_rooms', { dms: [dmId] });
    } else {
    }

    // Listen for new messages
    const handleNewMessage = (data) => {
      if ((selectedChannel && data.channel_id === selectedChannel.id) || 
          (dmId && String(data.dm_id) === String(dmId))) {
        // Prevent duplicate if sender is current user
        if (!user || data.message.sender_id !== user.id) {
          setMessages(prev => [...prev, data.message]);
          scrollToBottom();
        }
      }
    };

    // Listen for typing indicators
    const handleUserTyping = (data) => {
      if ((selectedChannel && data.channel_id === selectedChannel.id) || 
          (dmId && data.dm_id === dmId)) {
        if (data.user_id !== user?.id) {
          setTypingUsers(prev => new Set(prev.add(data.username)));
        }
      }
    };

    const handleUserStopTyping = (data) => {
      if ((selectedChannel && data.channel_id === selectedChannel.id) || 
          (dmId && data.dm_id === dmId)) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.username);
          return newSet;
        });
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      if (selectedChannel) {
        socket.emit('leave_rooms', { channels: [selectedChannel.id] });
      } else if (dmId) {
        socket.emit('leave_rooms', { dms: [dmId] });
      }
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [socket, selectedChannel?.id, dmId, user?.id]);

  // Fallback polling for messages (every 30 seconds) - only if socket is not connected
  useEffect(() => {
    if (!token || (!selectedChannel && !dmId) || socket?.connected) return;
    const interval = setInterval(() => {
      fetchMessages();
    }, 30000);
    return () => clearInterval(interval);
  }, [token, selectedChannel, dmId, socket?.connected]);

  // Fetch DM creator info when dmInfo changes
  useEffect(() => {
    const fetchCreator = async () => {
      if (!dmInfo || !token) return;
      
      if (dmInfo.type === 'group' && dmInfo.created_by) {
        // For group DMs, find the creator in the members array
        const creator = dmInfo.members?.find(m => m.id === dmInfo.created_by);
        if (creator) {
          setCreatorInfo(creator);
        } else {
          // Fallback: fetch creator by API if not in members
          try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/profile/${dmInfo.created_by}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            if (response.ok) {
              const data = await response.json();
              setCreatorInfo(data.user);
            }
          } catch (error) {
            setCreatorInfo(null);
          }
        }
      } else if (dmInfo.type === 'dm' && dmInfo.created_by) {
        // For 1:1 DMs, find the actual creator from members array
        const creator = dmInfo.members?.find(m => m.id === dmInfo.created_by);
        if (creator) {
          setCreatorInfo(creator);
        } else {
          setCreatorInfo(null);
        }
      } else {
        setCreatorInfo(null);
      }
    };
    fetchCreator();
  }, [dmInfo, token, user?.id]);

  // Mark DM as read logic
  const markDMAsRead = useCallback(async () => {
    if (!dmId) return;
    try {
              await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messaging/mark-read/${dmId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      // Optionally update NotificationContext here if needed
      if (typeof clearNotification === 'function') {
        clearNotification('unreadMessages', dmId);
      }
    } catch (err) {
      // Ignore errors for now
    }
  }, [dmId, token, clearNotification]);

  // Mark as read when DM is open, window focused, and at bottom
  useEffect(() => {
    if (dmId && isWindowFocused && isAtBottom) {
      markDMAsRead();
    }
  }, [dmId, isWindowFocused, isAtBottom, markDMAsRead]);

  // Show 'New messages' indicator if a new message arrives and not at bottom
  useEffect(() => {
    if (!isAtBottom) {
      setShowNewMessages(true);
    }
  }, [messages.length]);

  // Hide new messages indicator when scrolled to bottom
  useEffect(() => {
    if (isAtBottom) setShowNewMessages(false);
  }, [isAtBottom]);

  const fetchDMIdAndMessages = async () => {
    if (!token || !selectedDirectMessage) return;
    setLoading(true);
    try {
              const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messaging/users/${selectedDirectMessage}/dm`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDmId(data.dm_id);
        fetchMessages(data.dm_id);
        fetchDMInfo(data.dm_id);
      } else {
        setError('Failed to get DM conversation');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !token) return;
    setSending(true);
    const messageText = message.trim();
    try {
      let url;
      let body;
      if (selectedChannel) {
        url = `${import.meta.env.VITE_BACKEND_URL}/api/messaging/channels/${selectedChannel.id}/messages`;
        body = { content: messageText };
      } else if (dmId) {
        url = `${import.meta.env.VITE_BACKEND_URL}/api/messaging/dms/${dmId}/messages`;
        body = { content: messageText };
      } else {
        return;
      }
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        const data = await response.json();
        const newMsg = data.message || data;
        setMessages(prev => [...prev, newMsg]);
        setMessage('');
      } else {
        setError('Failed to send message');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 80); // 80ms delay for images/avatars to load
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMessageChange = (e) => {
    const newMessage = e.target.value;
    setMessage(newMessage);

    // Handle typing indicators
    if (socket && (selectedChannel || dmId)) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing_start', {
          channel_id: selectedChannel?.id,
          dm_id: dmId,
          user_id: user?.id,
          username: user?.username
        });
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        if (socket) {
          socket.emit('typing_stop', {
            channel_id: selectedChannel?.id,
            dm_id: dmId,
            user_id: user?.id,
            username: user?.username
          });
        }
        setIsTyping(false);
      }, 2000);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      // Parse the timestamp and convert to local time
      let date;
      if (typeof timestamp === 'string') {
        // Backend now sends proper UTC timestamps with Z
        date = new Date(timestamp);
      } else {
        date = new Date(timestamp);
      }
      
      if (isNaN(date.getTime())) return '';
      
      // Discord-like format: 1:00 PM, 11:30 AM, etc.
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      return '';
    }
  };

  const formatDateHeader = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      // Parse the timestamp and convert to local time
      let date;
      if (typeof timestamp === 'string') {
        // Backend now sends proper UTC timestamps with Z
        date = new Date(timestamp);
      } else {
        date = new Date(timestamp);
      }
      
      if (isNaN(date.getTime())) return '';
      
      const now = new Date();
      const diffInMs = now - date;
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

      // Today
      if (diffInDays < 1) {
        return 'Today';
      }
      // Yesterday
      else if (diffInDays < 2) {
        return 'Yesterday';
      }
      // Within last 7 days - show full day name
      else if (diffInDays < 7) {
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      // Within last year - show month, day, year
      else if (diffInDays < 365) {
        return date.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
      }
      // Older - show full date
      else {
        return date.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
      }
    } catch (error) {
      return '';
    }
  };

  const formatFullTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      // Parse the timestamp and convert to local time
      let date;
      if (typeof timestamp === 'string') {
        // Backend now sends proper UTC timestamps with Z
        date = new Date(timestamp);
      } else {
        date = new Date(timestamp);
      }
      
      if (isNaN(date.getTime())) return '';
      
      // Discord-like full timestamp: "Today at 1:00 PM" or "July 18, 2025 at 1:00 PM"
      const timeStr = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      
      const now = new Date();
      const diffInMs = now - date;
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

      if (diffInDays < 1) {
        return `Today at ${timeStr}`;
      } else if (diffInDays < 2) {
        return `Yesterday at ${timeStr}`;
      } else if (diffInDays < 365) {
        const dateStr = date.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric' 
        });
        return `${dateStr} at ${timeStr}`;
      } else {
        const dateStr = date.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
        return `${dateStr} at ${timeStr}`;
      }
    } catch (error) {
      return '';
    }
  };

  const shouldShowDateHeader = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    
    // Parse timestamps with proper UTC conversion
    let currentDate, previousDate;
    
    if (typeof currentMessage.created_at === 'string') {
      // Backend now sends proper UTC timestamps with Z
      currentDate = new Date(currentMessage.created_at);
    } else {
      currentDate = new Date(currentMessage.created_at);
    }
    
    if (typeof previousMessage.created_at === 'string') {
      // Backend now sends proper UTC timestamps with Z
      previousDate = new Date(previousMessage.created_at);
    } else {
      previousDate = new Date(previousMessage.created_at);
    }
    
    // Show header if dates are different
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  const getChatTitle = () => {
    if (selectedDirectMessage && dmInfo) {
      if (dmInfo.type === 'dm') {
        // Use members array to find the other user
        const otherUser = dmInfo.members?.find(m => String(m.id) !== String(user?.id));
        return otherUser ? `@${otherUser.username}` : '@unknown';
      } else if (dmInfo.type === 'group') {
        return dmInfo.name || 'Group DM';
      }
    }
    if (selectedChannel) {
      return `# ${selectedChannel.name}`;
    }
    return 'Select a channel or start a conversation';
  };

  const getChatDescription = () => {
    if (selectedDirectMessage && dmInfo) {
      if (dmInfo.type === 'dm') {
        const otherUser = dmInfo.members?.find(m => String(m.id) !== String(user?.id));
        return otherUser?.name || 'Direct Message';
      } else if (dmInfo.type === 'group') {
        return `${dmInfo.members?.length || 0} members`;
      }
    }
    if (selectedChannel) {
      return 'Text Channel';
    }
    return '';
  };

  // In the render, use dmInfo.type, dmInfo.name, and dmInfo.members to display group/1:1 info
  // Example:
  const renderChatHeader = () => {
    if (!dmInfo) return null;
    if (dmInfo.type === 'group') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}><GroupIcon /></Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>{dmInfo.name || 'Group DM'}</Typography>
            <Typography variant="body2" color="text.secondary">
              {dmInfo.members?.map(m => '@' + m.username).join(', ')}
            </Typography>
          </Box>
        </Box>
      );
    } else {
      // 1:1 DM: show the other user from members array
      const otherUser = dmInfo.members?.find(m => String(m.id) !== String(user?.id));
      const avatarUrl = otherUser?.profile_picture || '';
      const avatarInitial = otherUser?.username ? otherUser.username[0].toUpperCase() : '?';
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          {avatarUrl ? (
            <Avatar src={getProfilePictureUrl(avatarUrl)} sx={{ width: 40, height: 40 }} />
          ) : (
            <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>{avatarInitial}</Avatar>
          )}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>{otherUser ? '@' + otherUser.username : '@unknown'}</Typography>
            <Typography variant="body2" color="text.secondary">{otherUser?.name}</Typography>
          </Box>
        </Box>
      );
    }
  };

  // Show error state if there's an error
  if (error) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'error.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              !
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600 }}>
            Something went wrong
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center' }}>
            {error}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
            Try selecting a different friend
          </Typography>
        </Box>
      </Box>
    );
  }

  const handleScrollToBottom = () => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
      setShowNewMessages(false);
      markDMAsRead();
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      {/* Main Chat Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
      {/* Chat Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'background.paper',
          height: 64,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
              {getChatTitle()}
            </Typography>
            {getChatDescription() && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {getChatDescription()}
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Show member list button for all DMs (both 1:1 and group) */}
          {selectedDirectMessage && dmInfo && (
            <IconButton
              size="small"
              onClick={() => setShowMemberList(!showMemberList)}
              sx={{
                color: showMemberList ? 'primary.main' : 'text.secondary',
                '&:hover': {
                  bgcolor: 'action.hover',
                  color: 'text.primary',
                },
              }}
            >
              <PeopleIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Messages Area */}
      <Box
        ref={chatAreaRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          pb: 1, // Reduce bottom padding to match input area
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* New messages indicator */}
        {showNewMessages && (
          <Box sx={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 2 }}>
            <Box
              onClick={handleScrollToBottom}
              sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', px: 2, py: 0.5, borderRadius: 16, cursor: 'pointer', boxShadow: 2, fontWeight: 500 }}
            >
              New messages
            </Box>
          </Box>
        )}
        {/* DM Creator Info as system message at the top */}
        {selectedDirectMessage && dmInfo && creatorInfo && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Chip
              avatar={
                <Avatar
                  src={getProfilePictureUrl(creatorInfo.profile_picture)}
                  sx={{ width: 24, height: 24, fontSize: '0.9rem', bgcolor: 'primary.main' }}
                >
                  {getAvatarInitial(creatorInfo.username, creatorInfo.name)}
                </Avatar>
              }
              label={`Created by ${creatorInfo.name || creatorInfo.username || 'Unknown'}${dmInfo.created_at ? ' • ' + formatFullTimestamp(dmInfo.created_at) : ''}`}
              sx={{
                bgcolor: 'background.paper',
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: '0.85rem',
                border: 1,
                borderColor: 'divider',
                px: 2,
                py: 0.5,
                boxShadow: 1,
                maxWidth: '100%',
                cursor: 'default', // Ensure no pointer
                pointerEvents: 'none', // Prevent any click
              }}
              size="medium"
              tabIndex={-1}
            />
          </Box>
        )}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {messages.map((msg, index) => {
              const prevMsg = messages[index - 1];
              const nextMsg = messages[index + 1];
              
              // Improved message grouping logic with proper UTC conversion
              const parseTimestamp = (timestamp) => {
                if (typeof timestamp === 'string') {
                  // Backend now sends proper UTC timestamps with Z
                  return new Date(timestamp);
                } else {
                  return new Date(timestamp);
                }
              };
              
              const isFirstInGroup =
                !prevMsg ||
                prevMsg.sender_id !== msg.sender_id ||
                parseTimestamp(msg.created_at) - parseTimestamp(prevMsg.created_at) > 5 * 60 * 1000; // 5 minutes
              
              const isLastInGroup =
                !nextMsg ||
                nextMsg.sender_id !== msg.sender_id ||
                parseTimestamp(nextMsg.created_at) - parseTimestamp(msg.created_at) > 5 * 60 * 1000; // 5 minutes
              
              // Show date header if this is the first message or if date changed
              const shouldShowDate = shouldShowDateHeader(msg, prevMsg);
              
              return (
                <React.Fragment key={msg.id}>
                  {/* Date Header */}
                  {shouldShowDate && (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      my: 2,
                      px: 2
                    }}>
                      <Chip
                        label={formatDateHeader(msg.created_at)}
                        size="small"
                        sx={{
                          bgcolor: 'background.paper',
                          border: 1,
                          borderColor: 'divider',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: 'text.secondary'
                        }}
                      />
                    </Box>
                  )}
                  <ListItem
                    sx={{
                      px: 2,
                      py: isFirstInGroup ? 0.5 : 0.125, // Much less padding for grouped messages
                      alignItems: 'center', // Center content vertically
                      borderRadius: 1, // Always have border radius to prevent layout shift
                      '&:hover .msg-time-hover': { opacity: 1 },
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    {/* Avatar - only show for first message in group */}
                    <ListItemAvatar sx={{ minWidth: 48, mr: 1, position: 'relative' }}>
                      {isFirstInGroup ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Avatar
                            src={getProfilePictureUrl(msg.profile_picture)}
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: 'primary.main',
                              fontSize: '0.875rem',
                              fontWeight: 'bold',
                            }}
                          >
                            {getAvatarInitial(msg.username, msg.name)}
                          </Avatar>
                        </Box>
                      ) : (
                        <Box sx={{ width: 40, height: 40 }} />
                      )}
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        isFirstInGroup ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              component="span"
                              variant="body1"
                              sx={{
                                color: 'text.primary',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                              }}
                            >
                              {msg.username || msg.name || 'Unknown User'}
                            </Typography>
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{
                                color: 'text.secondary',
                                fontSize: '0.75rem',
                                opacity: 0.7,
                              }}
                            >
                              {formatTimestamp(msg.created_at)}
                            </Typography>
                          </Box>
                        ) : null
                      }
                      secondary={
                        <Box component="span" sx={{ position: 'relative', display: 'block' }}>
                          {!isFirstInGroup && (
                            <Typography
                              component="span"
                              className="msg-time-hover"
                              variant="caption"
                              sx={{
                                color: 'text.secondary',
                                fontSize: '0.75rem',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                pointerEvents: 'none',
                                userSelect: 'none',
                                position: 'absolute',
                                left: '-60px',
                                top: '0',
                              }}
                            >
                              {formatTimestamp(msg.created_at)}
                            </Typography>
                          )}
                          <Typography
                            component="span"
                            variant="body2"
                            sx={{
                              color: 'text.primary',
                              fontSize: '0.875rem',
                              lineHeight: 1.4,
                              display: 'block',
                            }}
                          >
                            {msg.content}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        )}
        
        {/* Typing Indicators */}
        {typingUsers.size > 0 && (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontStyle: 'italic',
                fontSize: '0.75rem',
              }}
            >
              {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
            </Typography>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <Box
        sx={{
          p: 2,
          pt: 1, // Reduce top padding to match messages area
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
            bgcolor: 'action.hover',
            borderRadius: 2,
            p: 1,
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={`Message ${getChatTitle()}`}
            value={message}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            variant="standard"
            sx={{
              '& .MuiInputBase-root': {
                color: 'text.primary',
                fontSize: '0.875rem',
              },
              '& .MuiInputBase-input': {
                '&::placeholder': {
                  color: 'text.secondary',
                  opacity: 1,
                },
              },
              '& .MuiInput-underline:before': {
                borderBottom: 'none',
              },
              '& .MuiInput-underline:after': {
                borderBottom: 'none',
              },
              '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                borderBottom: 'none',
              },
            }}
          />
          <IconButton
            onClick={handleSendMessage}
            disabled={!message.trim() || sending}
            sx={{
              color: message.trim() && !sending ? 'primary.main' : 'text.disabled',
              '&:hover': {
                bgcolor: message.trim() && !sending ? 'primary.dark' : 'action.selected',
                color: 'white',
              },
              '&:disabled': {
                color: 'text.disabled',
              },
            }}
          >
            {sending ? <CircularProgress size={20} /> : <SendIcon />}
          </IconButton>
        </Box>
      </Box>
      </Box>

      {/* Member List Sidebar */}
      {showMemberList && selectedDirectMessage && dmInfo && (
        <Box
          sx={{
            width: 280,
            borderLeft: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          {/* Member List Header */}
          <Box
            sx={{
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Members — {dmInfo.members?.length || 0}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setShowMemberList(false)}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'action.hover',
                  color: 'text.primary',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Member List */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 1,
            }}
          >
            {dmInfo.members?.map((member) => {
              const status = getLiveStatus(member);
              const isCreator = member.id === dmInfo.created_by;
              
              return (
                <Box
                  key={member.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1.5,
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={getProfilePictureUrl(member.profile_picture)}
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: 'primary.main',
                        fontSize: '0.75rem',
                      }}
                    >
                      {getAvatarInitial(member.username, member.name)}
                    </Avatar>
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: getStatusColor(status),
                        border: 2,
                        borderColor: 'background.paper',
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: 'text.primary',
                          fontSize: '0.875rem',
                        }}
                      >
                        {member.name || member.username}
                      </Typography>
                      {isCreator && (
                        <Chip
                          label="Creator"
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.625rem',
                            bgcolor: 'primary.main',
                            color: 'white',
                          }}
                        />
                      )}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                        textTransform: 'capitalize',
                      }}
                    >
                      {getStatusText(status)}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
});

export default ChatArea; 