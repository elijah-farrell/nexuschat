import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Link,
  Zoom,
  CircularProgress
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Lock, 
  Person, 
  Home, 
  DarkMode, 
  LightMode,

} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// No particles needed on login page

// NexusChat Logo component using the new logo image
const CustomHubIcon = ({ size = 64 }) => (
  <Box
    sx={{
      width: size,
      height: size,
      backgroundImage: 'url(/nexuschatlogo.png)',
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      borderRadius: '16px',
      filter: 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.3))',
      margin: '0 auto',
      display: 'block'
    }}
  />
);

const Login = ({ mode, setMode }) => {
  const navigate = useNavigate();
  const { login, user, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Auto-login: redirect if user is already logged in and token is valid
  useEffect(() => {
    if (user && !loading) {
      // Check if we have a valid token before redirecting
      const token = localStorage.getItem('token');
      if (token) {
        navigate('/dashboard');
      }
    }
  }, [user, loading, navigate]);

  // Clean up invalid auth state when component mounts
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // If we have user state but no valid token, clear the invalid state
    if (user && !token) {
      console.log('🔍 LOGIN: Clearing invalid auth state');
      // Clear localStorage and let AuthContext handle the cleanup
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // Force a page reload to reset the auth state
      window.location.reload();
    }
  }, [user]);

  const toggleTheme = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setMode(newMode);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }


  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setFormLoading(true);
    setError('');
    
    try {
      await login(formData.username, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };











  // Modern input field styling
  const getInputSx = () => ({
    mb: 3,
    '& .MuiInputLabel-root': {
      color: mode === 'dark' ? '#B9BBBE' : '#606060',
      fontSize: '0.95rem',
      '&.Mui-focused': {
        color: '#3B82F6',
        fontWeight: 500
      }
    },
    '& .MuiOutlinedInput-root': {
      backgroundColor: mode === 'dark' ? 'rgba(30, 31, 34, 0.6)' : 'rgba(255, 255, 255, 0.8)',
      borderRadius: '12px',
      transition: 'all 0.2s ease',
      '& fieldset': {
        borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(59, 130, 246, 0.2)',
        borderWidth: '1.5px',
      },
      '&:hover fieldset': {
        borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(59, 130, 246, 0.4)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#3B82F6',
        borderWidth: '2px',
        boxShadow: `0 0 0 3px rgba(59, 130, 246, 0.1)`,
      },
      '& input': {
        color: mode === 'dark' ? '#FFFFFF' : '#1F1F1F',
        fontSize: '1rem',
        padding: '16px 14px',
      }
    },
    '& .MuiFormHelperText-root': {
      color: mode === 'dark' ? '#B9BBBE' : '#606060',
      fontSize: '0.875rem',
      marginLeft: '4px',
      '&.Mui-error': {
        color: '#EF4444',
        fontWeight: 500
      }
    },
    '& input:-webkit-autofill': {
      WebkitBoxShadow: `0 0 0 1000px ${mode === 'dark' ? 'rgba(30, 31, 34, 0.6)' : 'rgba(255, 255, 255, 0.8)'} inset`,
      WebkitTextFillColor: mode === 'dark' ? '#FFFFFF' : '#1F1F1F',
    }
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: mode === 'dark' 
          ? 'linear-gradient(135deg, #1E1F22 0%, #2C2F33 100%)'
          : 'linear-gradient(135deg, #FFFFFF 0%, #F4F4F5 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
             {/* Clean background - no particles needed */}

      {/* Theme toggle */}
      <IconButton
        onClick={toggleTheme}
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          color: mode === 'dark' ? '#FFFFFF' : '#1F1F1F',
          bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(59, 130, 246, 0.1)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(59, 130, 246, 0.2)',
            transform: 'scale(1.05)',
          },
          transition: 'all 0.2s ease',
          zIndex: 10
        }}
      >
        {mode === 'dark' ? <LightMode /> : <DarkMode />}
      </IconButton>

      {/* Back to Home */}
      <IconButton
        component={RouterLink}
        to="/"
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          color: mode === 'dark' ? '#FFFFFF' : '#1F1F1F',
          bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(59, 130, 246, 0.1)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(59, 130, 246, 0.2)',
            transform: 'scale(1.05)',
          },
          transition: 'all 0.2s ease',
          zIndex: 10
        }}
      >
        <Home />
      </IconButton>

      <Container maxWidth="sm">
        <Zoom in={true} timeout={800}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4, md: 5 },
              borderRadius: '20px',
              background: mode === 'dark' 
                ? 'rgba(44, 47, 51, 0.95)' 
                : 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              border: mode === 'dark' 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(59, 130, 246, 0.1)',
              boxShadow: mode === 'dark' 
                ? '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)'
                : '0 20px 25px -5px rgba(59, 130, 246, 0.1), 0 10px 10px -5px rgba(59, 130, 246, 0.05)',
              position: 'relative',
              zIndex: 2,
              maxWidth: '420px',
              margin: '0 auto'
            }}
          >
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <CustomHubIcon size={72} />
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  mt: 2,
                  mb: 1,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1.75rem', sm: '2rem' }
                }}
              >
                Welcome Back
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: mode === 'dark' ? '#B9BBBE' : '#606060',
                  fontSize: '1rem'
                }}
              >
                Sign in to your NexusChat account
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: '12px',
                  bgcolor: mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'
                }}
              >
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                error={!!errors.username}
                helperText={errors.username}
                sx={getInputSx()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: mode === 'dark' ? '#B9BBBE' : '#606060' }} />
                    </InputAdornment>
                  ),
                }}
              />
              

              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                sx={getInputSx()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: mode === 'dark' ? '#B9BBBE' : '#606060' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePassword}
                        edge="end"
                        sx={{
                          color: mode === 'dark' ? '#B9BBBE' : '#606060',
                          '&:hover': {
                            color: '#3B82F6'
                          }
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={formLoading}
                sx={{
                  py: 1.8,
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  '&:disabled': {
                    background: 'rgba(59, 130, 246, 0.5)',
                    transform: 'none',
                  },
                  transition: 'all 0.2s ease',
                  mb: 3
                }}
              >
                {formLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Sign In'
                )}
              </Button>

              {/* Register Link */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  sx={{ color: mode === 'dark' ? '#B9BBBE' : '#606060' }}
                >
                  Don't have an account?{' '}
                  <Link
                    component={RouterLink}
                    to="/register"
                    sx={{
                      color: '#3B82F6',
                      textDecoration: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        textDecoration: 'underline',
                        color: '#2563EB'
                      }
                    }}
                  >
                    Sign up
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Zoom>
      </Container>
    </Box>
  );
};

export default Login;
