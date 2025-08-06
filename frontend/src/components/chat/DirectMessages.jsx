import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Avatar,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Group as GroupIcon,
  Settings as SettingsIcon,
  Phone as PhoneIcon,
  Videocam as VideoIcon,
  ScreenShare as ScreenShareIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { getProfilePictureUrl, getAvatarInitial } from '../../utils/imageUtils';
import { useSocket } from '../../contexts/SocketContext';

const DirectMessages = React.memo(({ selectedDirectMessage, onBack }) => {
  const { user, token } = useAuth();
  const { clearNotification } = useNotifications();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [groupInfo, setGroupInfo] = useState(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const messagesEndRef = useRef(null);
  const { socket, userStatuses } = useSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages
  const fetchMessages = async () => {
    if (!token || !selectedDirectMessage) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messaging/dms/${selectedDirectMessage}/messages`, {
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
      console.error('Error fetching messages:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch DM info (user or group)
  const fetchDMInfo = async () => {
    if (!token || !selectedDirectMessage) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messaging/dms`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        const dm = data.dms?.find(d => d.id === parseInt(selectedDirectMessage));
        if (dm) {
          if (dm.type === 'group') {
            setGroupInfo(dm);
            setOtherUser(null);
          } else {
            setOtherUser({
              id: dm.other_user_id,
              name: dm.display_full_name,
              username: dm.display_name,
              profile_picture: dm.profile_picture,
              status: dm.status
            });
            setGroupInfo(null);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching DM info:', error);
    }
  };

  useEffect(() => {
    if (selectedDirectMessage && token) {
      fetchMessages();
      fetchDMInfo();
      if (clearNotification) clearNotification('unreadMessages');
    }
    // Only depend on selectedDirectMessage and token
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDirectMessage, token]);

  // Set up polling for real-time message updates (only if socket is not connected)
  useEffect(() => {
    if (!token || !selectedDirectMessage) return;
    const interval = setInterval(() => {
      fetchMessages();
    }, 30000); // Increased to 30 seconds
    return () => clearInterval(interval);
  }, [token, selectedDirectMessage]);

  // Real-time socket support for new messages
  useEffect(() => {
    if (!socket || !selectedDirectMessage) return;
    // Join DM room
    socket.emit('join_rooms', { dms: [selectedDirectMessage] });

    const handleNewMessage = (data) => {
      // Prevent duplicate if sender is current user (already appended on send)
      if (data.dm_id === selectedDirectMessage && data.message.sender_id !== user?.id) {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
    };
    socket.on('new_message', handleNewMessage);
    return () => {
      socket.emit('leave_rooms', { dms: [selectedDirectMessage] });
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, selectedDirectMessage, user?.id]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !token || !selectedDirectMessage) return;

    setSending(true);
    const messageText = newMessage.trim();

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messaging/dms/${selectedDirectMessage}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageText,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newMsg = data.message || data;
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
      } else {
        setError('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Network error');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    // Parse the timestamp and convert to local time
    let date;
    if (typeof timestamp === 'string') {
      // Backend now sends proper UTC timestamps with Z
      date = new Date(timestamp);
    } else {
      date = new Date(timestamp);
    }
    
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleCall = (type) => {
    // setCallType(type); // Removed
    setShowCallDialog(false);
    // setIsInCall(true); // Removed
  };

  // handleCallEnd = () => { // Removed
  //   setIsInCall(false); // Removed
  // }; // Removed

  const handleScreenShare = () => {
    // For testing, start a screen share call
    // setCallType('screen'); // Removed
    // setIsInCall(true); // Removed
  };

  const getLiveStatus = (user) => userStatuses.get(user.id) || user.status || 'offline';

  if (!selectedDirectMessage) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'text.secondary',
        }}
      >
        <Typography variant="h6">
          Select a conversation to start messaging
        </Typography>
      </Box>
    );
  }

  if (!otherUser && !groupInfo) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'text.secondary',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const isGroupDM = !!groupInfo;
  const displayName = isGroupDM ? groupInfo.display_name : otherUser.name;
  const displayUsername = isGroupDM ? null : otherUser.username;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* DM Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}>
        {onBack && (
          <IconButton onClick={onBack}>
            <ArrowBackIcon />
          </IconButton>
        )}
        
        <Avatar 
          src={isGroupDM ? null : getProfilePictureUrl(otherUser.profile_picture)} 
          sx={{ width: 40, height: 40, bgcolor: isGroupDM ? 'primary.main' : undefined }}
        >
          {isGroupDM ? <GroupIcon /> : getAvatarInitial(otherUser.username, otherUser.name)}
        </Avatar>
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {displayName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isGroupDM 
              ? `${groupInfo.member_count || 0} members` 
              : (getLiveStatus(otherUser).charAt(0).toUpperCase() + getLiveStatus(otherUser).slice(1))
            }
          </Typography>
        </Box>

        {/* Call and Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Voice Call">
            <IconButton onClick={() => setShowCallDialog(true)}>
              <PhoneIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Video Call">
            <IconButton onClick={() => setShowCallDialog(true)}>
              <VideoIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Screen Share">
            <IconButton onClick={handleScreenShare}>
              <ScreenShareIcon />
            </IconButton>
          </Tooltip>
          {isGroupDM && (
            <Tooltip title="Group Settings">
              <IconButton onClick={() => setShowGroupInfo(true)}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Messages List */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : messages.length === 0 ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            <Typography color="text.secondary" variant="body1">
              {isGroupDM 
                ? `No messages yet. Say hi to the group!`
                : `No messages yet. Say hi to @${displayUsername}!`
              }
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {messages.map((msg, index) => {
              const isOwnMessage = msg.sender_id === user.id;
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showUsername = !prevMessage || prevMessage.sender_id !== msg.sender_id;
              
              return (
                <ListItem 
                  key={msg.id} 
                  sx={{
                    justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                    flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                    gap: 1,
                    alignItems: 'flex-end',
                    py: showUsername ? 1 : 0.5,
                  }}
                >
                  {!isOwnMessage && (
                    <ListItemAvatar sx={{ minWidth: 'auto', alignSelf: 'flex-end' }}>
                      {showUsername ? (
                        <Avatar src={getProfilePictureUrl(msg.profile_picture)} sx={{ width: 32, height: 32 }}>
                          {getAvatarInitial(msg.username, msg.name)}
                        </Avatar>
                      ) : (
                        <Box sx={{ width: 32, height: 32 }} />
                      )}
                    </ListItemAvatar>
                  )}
                  <Box sx={{ 
                    maxWidth: '70%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                  }}>
                    {!isOwnMessage && showUsername && isGroupDM && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.75rem', 
                          color: 'text.secondary',
                          fontWeight: 500,
                          mb: 0.5,
                          ml: 1,
                        }}
                      >
                        {msg.name || msg.username}
                      </Typography>
                    )}
                    <Box sx={{ 
                      bgcolor: isOwnMessage ? 'primary.main' : 'background.paper',
                      color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
                      borderRadius: 2,
                      p: 1.5,
                      boxShadow: 1,
                    }}>
                      <Typography variant="body1" sx={{ fontSize: '1rem', wordBreak: 'break-word' }}>
                        {msg.content}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        fontSize: '0.75rem', 
                        color: isOwnMessage ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                        display: 'block',
                        mt: 0.5,
                      }}>
                        {formatTimestamp(msg.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                  {isOwnMessage && (
                    <ListItemAvatar sx={{ minWidth: 'auto', alignSelf: 'flex-end' }}>
                      {showUsername ? (
                        <Avatar src={getProfilePictureUrl(user.profile_picture)} sx={{ width: 32, height: 32 }}>
                          {getAvatarInitial(user.username, user.name)}
                        </Avatar>
                      ) : (
                        <Box sx={{ width: 32, height: 32 }} />
                      )}
                    </ListItemAvatar>
                  )}
                </ListItem>
              );
            })}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>

      {/* Message Input */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <TextField
          fullWidth
          multiline
          minRows={1}
          maxRows={4}
          placeholder={isGroupDM ? `Message ${displayName}` : `Message @${displayUsername}`}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          InputProps={{
            endAdornment: (
              <IconButton color="primary" onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                <SendIcon />
              </IconButton>
            ),
          }}
        />
      </Box>

      {/* Group Info Dialog */}
              <Dialog open={showGroupInfo} onClose={() => setShowGroupInfo(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Group Info
          <IconButton
            onClick={() => setShowGroupInfo(false)}
            autoFocus
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {groupInfo && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {groupInfo.display_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {groupInfo.member_count || 0} members
              </Typography>
              
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Members
              </Typography>
              <List>
                {groupInfo.members && JSON.parse(groupInfo.members).map((member) => (
                  <ListItem key={member.id} dense>
                    <ListItemAvatar>
                      <Avatar src={getProfilePictureUrl(member.profile_picture)}>
                        {getAvatarInitial(member.username, member.name)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.name || member.username}
                      secondary={`@${member.username}`}
                    />
                    <Chip 
                      label={member.status} 
                      size="small" 
                      color={member.status === 'online' ? 'success' : 'default'}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGroupInfo(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Call Dialog */}
              <Dialog open={showCallDialog} onClose={() => setShowCallDialog(false)}>
        <DialogTitle>
          Start Call
          <IconButton
            onClick={() => setShowCallDialog(false)}
            autoFocus
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Choose call type:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PhoneIcon />}
              onClick={() => handleCall('voice')}
              fullWidth
            >
              Voice Call
            </Button>
            <Button
              variant="outlined"
              startIcon={<VideoIcon />}
              onClick={() => handleCall('video')}
              fullWidth
            >
              Video Call
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCallDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

DirectMessages.displayName = 'DirectMessages';

DirectMessages.propTypes = {
  selectedDirectMessage: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object,
  ]),
  onBack: PropTypes.func,
};

export default DirectMessages; 