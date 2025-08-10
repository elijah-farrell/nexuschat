import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  CircularProgress,
  Zoom
} from '@mui/material';
import {
  Person,
  Palette,
  Analytics,
  Delete,
  Warning,
  CheckCircle,
  Error,
  DarkMode,
  LightMode,
  Edit,
  Save,
  Cancel
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Settings = ({ mode, setMode }) => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  // Username change state
  const [username, setUsername] = useState(user?.username || '');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  
  // Stats state
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Delete account state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteUsername, setDeleteUsername] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Load user stats on component mount
  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Username validation (same as registration)
  const validateUsername = (username) => {
    if (!username) return 'Username is required';
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 20) return 'Username must be less than 20 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
    return '';
  };

  const handleUsernameChange = (e) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    setUsernameError(validateUsername(newUsername));
  };

  const handleSaveUsername = async () => {
    const error = validateUsername(username);
    if (error) {
      setUsernameError(error);
      return;
    }

    setUsernameLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/username`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (response.ok) {
        await refreshUser();
        setIsEditingUsername(false);
        setUsernameError('');
      } else {
        setUsernameError(data.error || 'Failed to update username');
      }
    } catch (error) {
      setUsernameError('Network error. Please try again.');
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteUsername !== user?.username) {
      setDeleteError('Username does not match');
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: deleteUsername }),
      });

      if (response.ok) {
        await logout();
        navigate('/login');
      } else {
        const data = await response.json();
        setDeleteError(data.error || 'Failed to delete account');
      }
    } catch (error) {
      setDeleteError('Network error. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card sx={{ 
      height: '100%', 
      transition: 'transform 0.2s', 
      '&:hover': { transform: 'translateY(-2px)' },
      bgcolor: 'background.paper'
    }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" component="div" color={color} fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Settings
      </Typography>

      {/* Username Section */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        bgcolor: 'background.paper'
      }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Person sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Username</Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={2}>
          {isEditingUsername ? (
            <>
              <TextField
                fullWidth
                value={username}
                onChange={handleUsernameChange}
                error={!!usernameError}
                helperText={usernameError}
                disabled={usernameLoading}
                sx={{ flexGrow: 1 }}
              />
              <IconButton 
                onClick={handleSaveUsername} 
                disabled={usernameLoading || !!usernameError}
                color="primary"
              >
                {usernameLoading ? <CircularProgress size={20} /> : <Save />}
              </IconButton>
              <IconButton 
                onClick={() => {
                  setIsEditingUsername(false);
                  setUsername(user?.username || '');
                  setUsernameError('');
                }}
                disabled={usernameLoading}
              >
                <Cancel />
              </IconButton>
            </>
          ) : (
            <>
              <Typography variant="body1" sx={{ flexGrow: 1 }}>
                {user?.username}
              </Typography>
              <IconButton onClick={() => setIsEditingUsername(true)}>
                <Edit />
              </IconButton>
            </>
          )}
        </Box>
      </Paper>

      {/* Theme Section */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        bgcolor: 'background.paper'
      }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Palette sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Theme</Typography>
        </Box>
        
        <FormControlLabel
          control={
            <Switch
              checked={mode === 'dark'}
              onChange={(e) => setMode(e.target.checked ? 'dark' : 'light')}
              icon={<LightMode />}
              checkedIcon={<DarkMode />}
            />
          }
          label={`${mode === 'dark' ? 'Dark' : 'Light'} Mode`}
        />
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Switch between light and dark themes
        </Typography>
      </Paper>

      {/* Stats Section */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        bgcolor: 'background.paper'
      }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Analytics sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Account Overview</Typography>
        </Box>
        
        {statsLoading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Messages Sent"
                value={stats?.messages || 0}
                icon={<Typography variant="h6">💬</Typography>}
                color="primary"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Friends"
                value={stats?.friends || 0}
                icon={<Typography variant="h6">👥</Typography>}
                color="secondary"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Conversations"
                value={stats?.conversations || 0}
                icon={<Typography variant="h6">💭</Typography>}
                color="success"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Days Active"
                value={stats?.accountAge || 0}
                icon={<Typography variant="h6">📅</Typography>}
                color="info"
              />
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Danger Zone */}
      <Paper sx={{ 
        p: 3, 
        border: '2px solid #f44336',
        bgcolor: 'background.paper'
      }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Warning sx={{ mr: 1, color: '#f44336' }} />
          <Typography variant="h6" color="#f44336">Danger Zone</Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Once you delete your account, there is no going back. Please be certain.
        </Typography>
        
        <Button
          variant="outlined"
          color="error"
          startIcon={<Delete />}
          onClick={() => setDeleteDialogOpen(true)}
        >
          Delete Account
        </Button>
      </Paper>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#f44336' }}>
          <Box display="flex" alignItems="center">
            <Warning sx={{ mr: 1 }} />
            Delete Account
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            This action cannot be undone. This will permanently delete your account and remove all your data.
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            To confirm deletion, please type your exact username: <strong>{user?.username}</strong>
          </Typography>
          
          <TextField
            fullWidth
            label="Username"
            value={deleteUsername}
            onChange={(e) => setDeleteUsername(e.target.value)}
            error={!!deleteError}
            helperText={deleteError}
            disabled={deleteLoading}
            sx={{ mb: 2 }}
          />
          
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            disabled={deleteLoading || deleteUsername !== user?.username}
            startIcon={deleteLoading ? <CircularProgress size={16} /> : <Delete />}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings; 