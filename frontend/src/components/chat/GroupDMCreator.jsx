import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Avatar,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../../contexts/AuthContext';
import { getProfilePictureUrl, getAvatarInitial } from '../../utils/imageUtils';
import PropTypes from 'prop-types';

const GroupDMCreator = ({ open, onClose, onGroupCreated }) => {
  const { token } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      fetchFriends();
    }
  }, [open]);

  const fetchFriends = async () => {
    if (!token) return;

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
        setError('Failed to load friends');
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setError('Network error');
    }
  };

  const handleFriendToggle = (friendId) => {
    setSelectedFriends(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedFriends.length < 2) {
      setError('Please enter a group name and select at least 2 friends');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messaging/group-dms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupName.trim(),
          memberIds: selectedFriends,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onGroupCreated({ id: data.dm_id });
        onClose();
        // Reset form
        setGroupName('');
        setSelectedFriends([]);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create group DM');
      }
    } catch (error) {
      console.error('Error creating group DM:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSelectedFriends([]);
    setError(null);
    onClose();
  };

  return (
          <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Create Group DM
        <IconButton
          onClick={handleClose}
          autoFocus
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          sx={{ mb: 3 }}
          placeholder="Enter group name..."
        />

        <Typography variant="h6" sx={{ mb: 2 }}>
          Select Friends ({selectedFriends.length} selected)
        </Typography>

        {friends.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            No friends to add to group DM
          </Typography>
        ) : (
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {friends.map((friend) => (
              <ListItem key={friend.id} dense>
                <ListItemAvatar>
                  <Avatar src={getProfilePictureUrl(friend.profile_picture)}>
                    {getAvatarInitial(friend.username, friend.name)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={friend.name || friend.username}
                  secondary={`@${friend.username}`}
                />
                <ListItemSecondaryAction>
                  <Checkbox
                    edge="end"
                    checked={selectedFriends.includes(friend.id)}
                    onChange={() => handleFriendToggle(friend.id)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        {selectedFriends.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Selected:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedFriends.map(friendId => {
                const friend = friends.find(f => f.id === friendId);
                return friend ? (
                  <Chip
                    key={friendId}
                    label={friend.name || friend.username}
                    size="small"
                    onDelete={() => handleFriendToggle(friendId)}
                  />
                ) : null;
              })}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleCreateGroup}
          variant="contained"
          disabled={loading || !groupName.trim() || selectedFriends.length < 2}
        >
          {loading ? <CircularProgress size={20} /> : 'Create Group'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

GroupDMCreator.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onGroupCreated: PropTypes.func.isRequired,
};

export default GroupDMCreator; 