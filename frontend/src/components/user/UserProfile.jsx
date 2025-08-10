import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  TextField,
  Avatar,
  Typography,
  Box,
  IconButton,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Circle as CircleIcon,
  AccessTime as AccessTimeIcon,
  Check as CheckIcon, // <-- Add this import
  People as PeopleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getProfilePictureUrl, getAvatarInitial } from '../../utils/imageUtils';
import { useSocket } from '../../contexts/SocketContext';

const UserProfile = ({ open, onClose }) => {
  const { user, token, refreshUser } = useAuth();
  const theme = useTheme();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [bannerColor, setBannerColor] = useState(user?.banner_color || '#3B82F6');
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    name: user?.name || '',
    bio: user?.bio || '',
    profile_picture: user?.profile_picture || '',
    banner_color: user?.banner_color || '#3B82F6',
    status: user?.status || 'online',
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const { userStatuses } = useSocket();

  // Update form data when user changes
  useEffect(() => {
    if (user && !editing) {
      setFormData({
        username: user.username || '',
        name: user.name || '',
        bio: user.bio || '',
        profile_picture: user.profile_picture || '',
        banner_color: user.banner_color || '#3B82F6',
        status: user.status || 'online',
      });
      setBannerColor(user.banner_color || '#3B82F6');
    }
  }, [user, editing]);

  // Auto-dismiss success and error messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#57F287';
      case 'idle': return '#FEE75C';
      case 'dnd': return '#ED4245';
      case 'offline': return '#747F8D';
      case 'away': return '#ff9800'; // orange/yellow for away
      default: return '#747F8D';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Online';
      case 'idle': return 'Idle';
      case 'dnd': return 'Do Not Disturb';
      case 'offline': return 'Offline';
      default: return 'Offline';
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDisplayName = (user) => user.name && user.name !== user.username ? user.name : null;

  const getLiveStatus = (user) => userStatuses.get(user.id) || user.status || 'offline';

  const handleEdit = () => {
    setEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setEditing(false);
    setSelectedImage(null);
    setImagePreview(null);
    setError(null);
    setSuccess(null);
    // Reset form data to current user data
    if (user) {
      setFormData({
        username: user.username || '',
        name: user.name || '',
        bio: user.bio || '',
        profile_picture: user.profile_picture || '',
        banner_color: user.banner_color || '#3B82F6',
        status: user.status || 'online',
      });
      setBannerColor(user.banner_color || '#3B82F6');
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // If there's a new image, upload it first
      let profilePictureUrl = formData.profile_picture;
      if (selectedImage) {
        const formDataImage = new FormData();
        formDataImage.append('profile_picture', selectedImage);
        
        const uploadResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/upload-profile-picture`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataImage,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          profilePictureUrl = uploadData.profile_picture_url;
        } else {
          throw new Error('Failed to upload profile picture');
        }
      }

      // Update profile
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          profile_picture: profilePictureUrl,
          banner_color: bannerColor,
        }),
      });

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        setEditing(false);
        setSelectedImage(null);
        setImagePreview(null);
        // Update the user object with new data
        // You might want to update the user context here
        if (refreshUser) await refreshUser();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  // Remove the handleSaveBannerColor function and replace with local state update
  const handleBannerColorChange = (newColor) => {
    setBannerColor(newColor);
    setFormData(prev => ({ ...prev, banner_color: newColor }));
  };

  const handleClose = () => {
    if (editing) {
      handleCancel();
    }
    onClose();
  };

  // Add effect to auto-set status to online if user returns from away
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.status === 'away') {
        // Call API or update status to 'online'
        setFormData((prev) => ({ ...prev, status: 'online' }));
        // Optionally, call a function to update status on the server
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.status]);

  if (!user) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth disableAutoFocus disableEnforceFocus>
        <DialogContent>
          <Box display="flex" justifyContent="center" p={3}>
            <Typography>Loading...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper
      }}>
        <Box component="span" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>My Profile</Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!editing && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              size="small"
              sx={{
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                '&:hover': {
                  borderColor: theme.palette.primary.dark,
                  bgcolor: theme.palette.primary.dark,
                  color: 'white',
                },
              }}
            >
              Edit
            </Button>
          )}
          <IconButton 
            onClick={handleClose} 
            size="small" 
            autoFocus
            sx={{ 
              color: theme.palette.text.secondary,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
                color: theme.palette.text.primary
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {success && (
          <Alert severity="success" sx={{ mb: 2, bgcolor: '#57F287', color: 'white' }}>
            {success}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2, bgcolor: '#ED4245', color: 'white' }}>
            {error}
          </Alert>
        )}

        {/* Profile Header with Banner */}
        <Box 
          sx={{ 
            position: 'relative',
            width: '100%',
            height: 120,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${editing ? bannerColor : (user?.banner_color || '#3B82F6')} 0%, ${editing ? bannerColor : (user?.banner_color || '#3B82F6')}dd 100%)`,
            overflow: 'hidden',
            mb: 2,
            mt: 3,
            boxShadow: 3,
          }}
        >
          <Box display="flex" alignItems="center" height="100%" pl={3} pr={3}>
            <Box position="relative">
              <Avatar
                src={imagePreview || getProfilePictureUrl(user.profile_picture)}
                sx={{ 
                  width: 80, 
                  height: 80,
                  fontSize: '2rem',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  border: '3px solid rgba(255,255,255,0.3)'
                }}
              >
                {getAvatarInitial(user.username, user.name)}
              </Avatar>
              {editing && (
                <Box sx={{ position: 'absolute', bottom: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="profile-image-upload"
                    type="file"
                    onChange={handleImageChange}
                  />
                  <label htmlFor="profile-image-upload">
                    <IconButton color="primary" component="span" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                      <EditIcon />
                    </IconButton>
                  </label>
                  {selectedImage && (
                    <Typography variant="caption" sx={{ color: 'white', mt: 0.5, maxWidth: 120, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {selectedImage.name}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
            <Box ml={2} sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                @{user.username}
              </Typography>
              {getDisplayName(user) ? (
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  {user.name}
                </Typography>
              ) : (
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>
                  No display name set
                </Typography>
              )}
              <Chip
                label={getStatusText(getLiveStatus(user))}
                size="small"
                sx={{
                  mt: 1,
                  bgcolor: getStatusColor(getLiveStatus(user)),
                  color: 'white',
                  textTransform: 'capitalize'
                }}
              />
            </Box>
            {/* Banner Color Editor */}
            {editing && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  type="color"
                  value={bannerColor}
                  onChange={(e) => handleBannerColorChange(e.target.value)}
                  sx={{
                    width: 60,
                    '& .MuiInputBase-input': {
                      padding: '4px',
                      cursor: 'pointer'
                    }
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>

        {/* Bio Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
            About
          </Typography>
          {editing ? (
            <Box display="flex" alignItems="center" mb={2}>
              <PersonIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
              <TextField
                value={formData.bio}
                onChange={handleInputChange('bio')}
                variant="outlined"
                size="small"
                label="Bio"
                multiline
                rows={2}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />
            </Box>
          ) : (
            <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontStyle: 'italic' }}>
              {user.bio ? `"${user.bio}"` : 'No bio added yet'}
            </Typography>
          )}

          {/* Status */}
        </Box>

        <Divider sx={{ my: 0, borderColor: theme.palette.divider }} />

        {/* User Details */}
        {(editing || getLiveStatus(user) !== 'online') && (
          <Box sx={{ mb: 3 }}>
            {editing && (
              <Box display="flex" alignItems="center" mb={2}>
                <PersonIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                <Box display="flex" alignItems="center">
                  <Typography variant="body1" sx={{ color: theme.palette.text.primary, mr: 1 }}>
                    Display Name:
                  </Typography>
                  <TextField
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    variant="outlined"
                    size="small"
                    sx={{
                      ml: 0,
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: theme.palette.divider },
                        '&:hover fieldset': { borderColor: theme.palette.primary.main },
                        '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                      },
                      '& .MuiInputBase-input': { color: theme.palette.text.primary },
                    }}
                  />
                </Box>
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
          </Box>
        )}

        <Divider sx={{ my: 0, borderColor: theme.palette.divider }} />

        {/* Account Info */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
            Account Information
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Member since: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
          </Typography>
          {user.is_friend && user.friendship_date && (
            <Box display="flex" alignItems="center" mt={1}>
              <PeopleIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Friends since: {new Date(user.friendship_date).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Action Buttons */}
        {editing && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={loading}
              sx={{
                bgcolor: theme.palette.success.main,
                '&:hover': { bgcolor: theme.palette.success.dark },
                '&:disabled': { bgcolor: theme.palette.action.disabledBackground }
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              sx={{
                borderColor: theme.palette.text.secondary,
                color: theme.palette.text.secondary,
                '&:hover': { 
                  borderColor: theme.palette.error.main, 
                  bgcolor: theme.palette.error.main, 
                  color: 'white' 
                }
              }}
            >
              Cancel
            </Button>
          </Box>
        )}
      </DialogContent>

      
    </Dialog>
  );
};

export default UserProfile; 