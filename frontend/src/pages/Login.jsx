import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  CircularProgress,
  IconButton,
  Fade,
  Zoom,
  InputAdornment
} from '@mui/material';
import { 
  Person, 
  Lock, 
  DarkMode,
  LightMode,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import usePageTitle from '../utils/usePageTitle';

// Custom Hub Icon SVG component
const CustomHubIcon = ({ size = 48, color = 'white' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="loginGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#6366F1', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    
    {/* Background circle with gradient */}
    <circle cx="16" cy="16" r="15" fill="url(#loginGradient)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
    
    {/* Hub icon */}
    <g transform="translate(8, 8)" fill={color}>
      {/* Center circle */}
      <circle cx="8" cy="8" r="3" fill={color}/>
      
      {/* Connection lines */}
      <rect x="7" y="2" width="2" height="4" rx="1" fill={color}/>
      <rect x="7" y="10" width="2" height="4" rx="1" fill={color}/>
      <rect x="2" y="7" width="4" height="2" rx="1" fill={color}/>
      <rect x="10" y="7" width="4" height="2" rx="1" fill={color}/>
      
      {/* Corner dots */}
      <circle cx="4" cy="4" r="1.5" fill={color}/>
      <circle cx="12" cy="4" r="1.5" fill={color}/>
      <circle cx="4" cy="12" r="1.5" fill={color}/>
      <circle cx="12" cy="12" r="1.5" fill={color}/>
    </g>
  </svg>
);

const Login = ({ mode, setMode }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [particles, setParticles] = useState([]);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  usePageTitle('Login');

  // Validation functions
  const validateUsername = (username) => {
    if (!username) return 'Username is required';
    if (username.length < 3) return 'Username must be at least 3 characters';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  // Particle animation effect
  useEffect(() => {
    const createParticle = () => ({
      id: Math.random(),
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 2,
      speedY: (Math.random() - 0.5) * 2,
      opacity: Math.random() * 0.5 + 0.1
    });

    const initialParticles = Array.from({ length: 50 }, createParticle);
    setParticles(initialParticles);

    const animateParticles = () => {
      setParticles(prev => prev.map(particle => {
        let newX = particle.x + particle.speedX;
        let newY = particle.y + particle.speedY;
        
        // Boundary checking
        if (newX > window.innerWidth) newX = 0;
        if (newX < 0) newX = window.innerWidth;
        if (newY > window.innerHeight) newY = 0;
        if (newY < 0) newY = window.innerHeight;
        
        return {
          ...particle,
          x: newX,
          y: newY
        };
      }));
    };

    const interval = setInterval(animateParticles, 50);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate fields
    const newErrors = {};
    const usernameError = validateUsername(formData.username);
    const passwordError = validatePassword(formData.password);
    
    if (usernameError) newErrors.username = usernameError;
    if (passwordError) newErrors.password = passwordError;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await login(formData.username, formData.password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    // Clear error messages when toggling theme
    setErrors({}); // This line is removed
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: mode === 'dark' 
          ? 'linear-gradient(135deg, #0F0F23 0%, #1E1B4B 50%, #312E81 100%)'
          : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Animated particles */}
      {particles.map(particle => (
        <Box
          key={particle.id}
          sx={{
            position: 'absolute',
            width: particle.size,
            height: particle.size,
            background: mode === 'dark' 
              ? 'rgba(139, 92, 246, 0.3)' 
              : 'rgba(255, 255, 255, 0.4)',
            borderRadius: '50%',
            left: particle.x,
            top: particle.y,
            opacity: particle.opacity,
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
      ))}

      {/* Theme toggle button */}
      <IconButton
        onClick={toggleTheme}
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
          zIndex: 10
        }}
      >
        {mode === 'dark' ? <LightMode /> : <DarkMode />}
      </IconButton>

      <Container maxWidth="sm">
        <Zoom in={true} timeout={800}>
          <Paper
            elevation={24}
            sx={{
              p: 4,
              borderRadius: 3,
              background: mode === 'dark' 
                ? 'rgba(30, 27, 75, 0.9)' 
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative',
              zIndex: 2
            }}
          >
            {/* Logo and Title */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <CustomHubIcon size={64} />
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  mt: 2,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: mode === 'dark' ? 'white' : 'text.primary'
                }}
              >
                NexusChat
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mt: 1,
                  color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'
                }}
              >
                Welcome back! Sign in to your account
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                error={!!errors.username}
                helperText={errors.username}
                sx={{ 
                  mb: 3,
                  '& .MuiInputLabel-root': {
                    color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                    '&.Mui-focused': {
                      color: '#6366F1'
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: mode === 'dark' ? '#1E1B4B' : 'rgba(255, 255, 255, 0.95)',
                    transition: 'none !important',
                    '& fieldset': {
                      borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                      transition: 'none !important',
                    },
                    '&:hover fieldset': {
                      borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                      transition: 'none !important',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#6366F1',
                      transition: 'none !important',
                    },
                    '& input': {
                      color: mode === 'dark' ? 'white' : 'black',
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      borderRadius: '0',
                      transition: 'none !important',
                    }
                  },
                  '& .MuiFormHelperText-root': {
                    color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                    '&.Mui-error': {
                      color: '#f44336'
                    }
                  },
                  // Simple autofill override
                  '& input:-webkit-autofill': {
                    WebkitBoxShadow: `0 0 0 1000px ${mode === 'dark' ? '#1E1B4B' : 'rgba(255, 255, 255, 0.95)'} inset`,
                    WebkitTextFillColor: mode === 'dark' ? 'white' : 'black',
                  }
                }}
                InputProps={{
                  startAdornment: <Person sx={{ 
                    mr: 1, 
                    color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' 
                  }} />
                }}
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                sx={{
                  mb: 3, // Add bottom margin for spacing
                  '& .MuiInputLabel-root': {
                    color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                    '&.Mui-focused': {
                      color: '#6366F2'
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: mode === 'dark' ? 'rgba(30, 27, 75, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                    '& fieldset': {
                      borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#6366F2',
                    },
                    '& input': {
                      color: mode === 'dark' ? 'white' : 'black',
                      backgroundColor: 'transparent',
                    }
                  },
                  '& .MuiFormHelperText-root': {
                    color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                    '&.Mui-error': {
                      color: '#f44336'
                    }
                  },
                  '& input:-webkit-autofill': {
                    WebkitBoxShadow: `0 0 0 1000px ${mode === 'dark' ? '#1E1B4B' : 'rgba(255, 255, 255, 0.95)'} inset`,
                    WebkitTextFillColor: mode === 'dark' ? 'white' : 'black',
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <Lock sx={{ 
                      mr: 1, 
                      color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' 
                    }} />
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePassword}
                        onMouseDown={(event) => event.preventDefault()}
                        edge="end"
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
                disabled={loading}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5B5BD6 0%, #7C3AED 100%)',
                  },
                  '&:disabled': {
                    background: 'rgba(99, 102, 241, 0.5)',
                  }
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Sign In'
                )}
              </Button>
            </Box>

            {/* Register Link */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" sx={{ 
                color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' 
              }}>
                Don't have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  sx={{
                    color: '#6366F1',
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  }}
                >
                  Sign up here
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Zoom>
      </Container>
    </Box>
  );
};

Login.propTypes = {
  size: PropTypes.string,
  color: PropTypes.string,
  mode: PropTypes.string,
  setMode: PropTypes.func,
};

export default Login; 