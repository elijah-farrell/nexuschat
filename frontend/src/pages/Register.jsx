import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Lock, 
  Person, 
  Home, 
  DarkMode, 
  LightMode,
  CheckCircle,
  ArrowBack,
  ArrowForward,
  InfoOutlined,
  CheckCircleOutline,
  Cancel,
  Warning
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// No particles needed on register page

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

const Register = ({ mode, setMode }) => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Username availability states
  const [usernameStatus, setUsernameStatus] = useState('idle'); // 'idle', 'checking', 'available', 'unavailable', 'invalid'
  const [usernameAvailability, setUsernameAvailability] = useState(null);
  const [usernameCheckTimeout, setUsernameCheckTimeout] = useState(null);
  const [usernameAttempts, setUsernameAttempts] = useState(0);
  const [lastCheckedUsername, setLastCheckedUsername] = useState('');
  
  // Password strength states
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false
  });

  const steps = ['Account Details', 'Security Setup', 'Complete'];
  const usernameInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const toggleTheme = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setMode(newMode);
  };

  // Input sanitization and normalization
  const sanitizeInput = (input, type = 'text') => {
    if (!input) return '';
    
    let sanitized = input.trim();
    
    switch (type) {
      case 'username':
        // Remove leading/trailing spaces, convert to lowercase
        sanitized = sanitized.toLowerCase().replace(/\s+/g, '');
        break;
      case 'password':
        // Don't trim passwords, but remove leading/trailing whitespace
        sanitized = input.replace(/^\s+|\s+$/g, '');
        break;
      default:
        sanitized = sanitized.replace(/\s+/g, ' ').trim();
    }
    
    return sanitized;
  };

  // Enhanced password strength checker
  const checkPasswordStrength = useCallback((password) => {
    const requirements = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    setPasswordRequirements(requirements);
    
    const score = Object.values(requirements).filter(Boolean).length;
    setPasswordStrength(score);
    
    return score;
  }, []);

  // Debounced username availability check with rate limiting
  const checkUsernameAvailability = useCallback(async (username) => {
    if (!username || username.length < 3) {
      setUsernameStatus('idle');
      setUsernameAvailability(null);
      return;
    }

    // Validate username format before making API call
    if (!/^[a-zA-Z0-9_]+$/.test(username) || username.startsWith('_') || username.endsWith('_')) {
      setUsernameStatus('invalid');
      setUsernameAvailability(false);
      return;
    }

    // Don't check if we already checked this exact username
    if (username === lastCheckedUsername) {
      return;
    }

    // Rate limiting: prevent excessive API calls
    if (usernameAttempts >= 10) {
      setUsernameStatus('idle');
      setError('Too many username checks. Please wait a moment.');
      return;
    }

    setUsernameStatus('checking');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/check-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        const data = await response.json();
        setUsernameAvailability(data.available);
        setUsernameStatus(data.available ? 'available' : 'unavailable');
        setUsernameAttempts(prev => prev + 1);
        setLastCheckedUsername(username); // Remember we checked this username
      } else {
        setUsernameStatus('idle');
        setUsernameAvailability(null);
      }
    } catch (error) {
      console.error('Error checking username availability:', error);
      setUsernameStatus('idle');
      setUsernameAvailability(null);
      setError('Network error. Please check your connection.');
    }
  }, [usernameAttempts, lastCheckedUsername]);

  // Debounced username check with proper cleanup and better debouncing
  useEffect(() => {
    if (usernameCheckTimeout) {
      clearTimeout(usernameCheckTimeout);
    }

    // Only check if username is valid and different from last check
    if (formData.username && formData.username.length >= 3) {
      const timeout = setTimeout(() => {
        // Only check if username hasn't changed during the timeout
        if (formData.username && formData.username.length >= 3) {
          checkUsernameAvailability(formData.username);
        }
      }, 1000); // Increased delay to reduce spam
      setUsernameCheckTimeout(timeout);
    } else {
      setUsernameStatus('idle');
      setUsernameAvailability(null);
    }

    return () => {
      if (usernameCheckTimeout) {
        clearTimeout(usernameCheckTimeout);
      }
    };
  }, [formData.username, checkUsernameAvailability]);

  // Enhanced input handling with sanitization
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Sanitize input based on field type
    const sanitizedValue = sanitizeInput(value, name);
    
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    
    // Clear field-specific errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear general error when user starts typing
    if (error) {
      setError('');
    }
    
    // Reset username status when user starts typing a new username
    if (name === 'username') {
      setUsernameStatus('idle');
      setUsernameAvailability(null);
      setLastCheckedUsername(''); // Reset last checked username
    }
    
    // Check password strength for password field
    if (name === 'password') {
      checkPasswordStrength(sanitizedValue);
    }
  };

  // Enhanced validation functions
  const validateUsername = (username) => {
    if (!username) return 'Username is required';
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 20) return 'Username must be less than 20 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
    if (username.startsWith('_') || username.endsWith('_')) return 'Username cannot start or end with underscore';
    if (usernameStatus === 'invalid') return 'Username contains invalid characters';
    if (usernameStatus === 'unavailable') return 'Username is already taken';
    if (usernameStatus === 'checking') return 'Checking username availability...';
    if (usernameStatus === 'idle' && username.length >= 3) return 'Please wait while we check availability';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password.length > 128) return 'Password must be less than 128 characters';
    if (passwordStrength < 3) return 'Password is too weak. Please include more variety.';
    return '';
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return '';
  };

  const validateCurrentStep = () => {
    const newErrors = {};
    
    if (activeStep === 0) {
      const usernameError = validateUsername(formData.username);
      if (usernameError) newErrors.username = usernameError;
    } else if (activeStep === 1) {
      const passwordError = validatePassword(formData.password);
      if (passwordError) newErrors.password = passwordError;
      
      const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password);
      if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep(prev => prev + 1);
      // Focus on next input field
      setTimeout(() => {
        if (activeStep === 0) {
          passwordInputRef.current?.focus();
        }
      }, 100);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const result = await register(formData.username, formData.password);
      
      if (result.success) {
        setActiveStep(2); // Success step
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get username status icon and color
  const getUsernameStatusIcon = () => {
    switch (usernameStatus) {
      case 'checking':
        return <CircularProgress size={20} />;
      case 'available':
        return null; // No icon for available - just the chip below
      case 'unavailable':
        return null; // No icon for unavailable - just the tooltip info icon
      case 'invalid':
        return null; // No icon for invalid - just the tooltip info icon
      default:
        return null;
    }
  };

  // Password strength indicator
  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return '#EF4444';
    if (passwordStrength <= 3) return '#F59E0B';
    if (passwordStrength <= 4) return '#10B981';
    return '#059669';
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Fair';
    if (passwordStrength <= 4) return 'Good';
    return 'Strong';
  };

  // Modern input field styling
  const getInputSx = (fieldName = '') => ({
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
        borderColor: fieldName === 'username' && usernameStatus === 'available' ? '#10B981' : 
                    fieldName === 'username' && (usernameStatus === 'unavailable' || usernameStatus === 'invalid') ? '#EF4444' : 
                    fieldName === 'password' && formData.password && Object.values(passwordRequirements).every(req => req) ? '#10B981' :
                    fieldName === 'confirmPassword' && formData.confirmPassword && formData.confirmPassword === formData.password ? '#10B981' :
                    '#3B82F6',
        borderWidth: '2px',
        boxShadow: fieldName === 'username' && usernameStatus === 'available' ? '0 0 0 3px rgba(16, 185, 129, 0.1)' : 
                   fieldName === 'username' && (usernameStatus === 'unavailable' || usernameStatus === 'invalid') ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 
                   fieldName === 'password' && formData.password && Object.values(passwordRequirements).every(req => req) ? '0 0 0 3px rgba(16, 185, 129, 0.1)' :
                   fieldName === 'confirmPassword' && formData.confirmPassword && formData.confirmPassword === formData.password ? '0 0 0 3px rgba(16, 185, 129, 0.1)' :
                   '0 0 0 3px rgba(59, 130, 246, 0.1)',
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

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, textAlign: 'center', color: mode === 'dark' ? '#FFFFFF' : '#1F1F1F' }}>
              Account Details
            </Typography>
            
            {/* Username Field */}
            <TextField
              fullWidth
              label="Username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              error={!!errors.username}
              helperText={errors.username}
              sx={getInputSx('username')}
              autoFocus
              inputRef={usernameInputRef}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: mode === 'dark' ? '#B9BBBE' : '#606060' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {getUsernameStatusIcon()}
                    <Tooltip 
                      title={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            Username Requirements:
                          </Typography>
                          <Typography variant="body2" component="div">
                            • 3-20 characters long<br/>
                            • Letters, numbers, and underscores only<br/>
                            • Cannot start or end with underscore<br/>
                            • Must be unique
                          </Typography>
                        </Box>
                      }
                      arrow
                      placement="right"
                    >
                      <IconButton
                        edge="end"
                        sx={{
                          color: mode === 'dark' ? '#B9BBBE' : '#606060',
                          '&:hover': { color: '#3B82F6' }
                        }}
                      >
                        <InfoOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )
              }}
            />
            
            {/* Username status indicator */}
            {formData.username && formData.username.length >= 3 && (
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                {usernameStatus === 'checking' && (
                  <Chip
                    icon={<CircularProgress size={16} />}
                    label="Checking availability..."
                    size="small"
                    sx={{
                      bgcolor: mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                      color: '#3B82F6',
                      border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}
                  />
                )}
                {usernameStatus === 'available' && (
                  <Chip
                    icon={<CheckCircleOutline />}
                    label="Username available!"
                    size="small"
                    clickable={false}
                    sx={{
                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                      color: '#10B981',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      pointerEvents: 'none'
                    }}
                  />
                )}
                {usernameStatus === 'unavailable' && (
                  <Chip
                    label="Username taken"
                    size="small"
                    clickable={false}
                    sx={{
                      bgcolor: 'rgba(239, 68, 68, 0.1)',
                      color: '#EF4444',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      pointerEvents: 'none'
                    }}
                  />
                )}
                {usernameStatus === 'invalid' && (
                  <Chip
                    label="Invalid username format"
                    size="small"
                    clickable={false}
                    sx={{
                      bgcolor: 'rgba(239, 68, 68, 0.1)',
                      color: '#EF4444',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      pointerEvents: 'none'
                    }}
                  />
                )}
              </Box>
            )}
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, textAlign: 'center', color: mode === 'dark' ? '#FFFFFF' : '#1F1F1F' }}>
              Security Setup
            </Typography>
            
            {/* Password Field */}
            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              sx={getInputSx('password')}
              autoFocus
              inputRef={passwordInputRef}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: mode === 'dark' ? '#B9BBBE' : '#606060' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip 
                      title={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            Password Requirements:
                          </Typography>
                          <Typography variant="body2" component="div">
                            • At least 8 characters long<br/>
                            • Mix of uppercase and lowercase letters<br/>
                            • Include numbers and special characters<br/>
                            • Avoid common passwords
                          </Typography>
                        </Box>
                      }
                      arrow
                      placement="left"
                    >
                      <IconButton
                        sx={{
                          color: mode === 'dark' ? '#B9BBBE' : '#606060',
                          '&:hover': { color: '#3B82F6' }
                        }}
                      >
                        <InfoOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{
                        color: mode === 'dark' ? '#B9BBBE' : '#606060',
                        '&:hover': { color: '#3B82F6' }
                      }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {/* Password Requirements Checklist */}
            {formData.password && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {Object.entries(passwordRequirements).map(([req, met]) => (
                    <Box key={req} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {met ? (
                        <CheckCircleOutline sx={{ fontSize: 16, color: '#10B981' }} />
                      ) : (
                        <InfoOutlined sx={{ fontSize: 16, color: '#EF4444' }} />
                      )}
                      <Typography variant="body2" sx={{ 
                        color: met ? '#10B981' : mode === 'dark' ? '#606060' : '#606060',
                        fontSize: '0.875rem'
                      }}>
                        {req === 'length' && 'At least 8 characters'}
                        {req === 'lowercase' && 'Contains lowercase letter'}
                        {req === 'uppercase' && 'Contains uppercase letter'}
                        {req === 'number' && 'Contains number'}
                        {req === 'special' && 'Contains special character'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Confirm Password Field */}
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              sx={getInputSx('confirmPassword')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: mode === 'dark' ? '#B9BBBE' : '#606060' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip 
                      title={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            Confirm Password:
                          </Typography>
                          <Typography variant="body2" component="div">
                            • Must match your password exactly<br/>
                            • Double-check for typos<br/>
                            • This ensures you remember your password
                          </Typography>
                        </Box>
                      }
                      arrow
                      placement="left"
                    >
                      <IconButton
                        sx={{
                          color: mode === 'dark' ? '#B9BBBE' : '#606060',
                          '&:hover': { color: '#3B82F6' }
                        }}
                      >
                        <InfoOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      sx={{
                        color: mode === 'dark' ? '#B9BBBE' : '#606060',
                        '&:hover': { color: '#3B82F6' }
                      }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        );
      
      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle sx={{ fontSize: 80, color: '#10B981', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 1, color: mode === 'dark' ? '#FFFFFF' : '#1F1F1F' }}>
              Account Created Successfully!
            </Typography>
            <Typography variant="body1" sx={{ color: mode === 'dark' ? '#B9BBBE' : '#606060', mb: 2 }}>
              Welcome to NexusChat, {formData.username}!
            </Typography>
            <Typography variant="body2" sx={{ color: mode === 'dark' ? '#B9BBBE' : '#606060', mb: 3 }}>
              Redirecting you to your dashboard...
            </Typography>
            <CircularProgress sx={{ color: '#3B82F6' }} />
          </Box>
        );
      
      default:
        return null;
    }
  };

  // Check if we can proceed to next step
  const canProceedToNext = () => {
    if (activeStep === 0) {
      return formData.username && 
             formData.username.length >= 3 && 
             usernameStatus === 'available' && 
             !errors.username;
    }
    return true;
  };

  // Reset form when going back to first step
  const handleBackToFirst = () => {
    setActiveStep(0);
    setErrors({});
    setError('');
    setUsernameStatus('idle');
    setUsernameAvailability(null);
    setPasswordStrength(0);
    setPasswordRequirements({
      length: false,
      lowercase: false,
      uppercase: false,
      number: false,
      special: false
    });
  };

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
              maxWidth: '520px',
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
                Join NexusChat
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: mode === 'dark' ? '#B9BBBE' : '#606060',
                  fontSize: '1rem'
                }}
              >
                Create your account in just a few steps
              </Typography>
            </Box>

            {/* Stepper */}
            {activeStep < 2 && (
              <Stepper 
                activeStep={activeStep} 
                sx={{ 
                  mb: 4,
                  '& .MuiStepLabel-label': {
                    color: mode === 'dark' ? '#B9BBBE' : '#606060',
                    '&.Mui-active': {
                      color: '#3B82F6'
                    },
                    '&.Mui-completed': {
                      color: '#10B981'
                    }
                  },
                  '& .MuiStepIcon-root': {
                    color: mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(59, 130, 246, 0.3)',
                    '&.Mui-active': {
                      color: '#3B82F6'
                    },
                    '&.Mui-completed': {
                      color: '#10B981'
                    }
                  }
                }}
              >
                {steps.slice(0, 2).map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            )}

            {/* Error Alert */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: '12px',
                  bgcolor: mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'
                }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}

            {/* Step Content */}
            {renderStepContent()}

            {/* Navigation Buttons */}
            {activeStep < 2 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  onClick={activeStep === 0 ? handleBackToFirst : handleBack}
                  startIcon={<ArrowBack />}
                  sx={{
                    color: mode === 'dark' ? '#B9BBBE' : '#606060',
                    '&:hover': {
                      bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    }
                  }}
                >
                  {activeStep === 0 ? 'Cancel' : 'Back'}
                </Button>

                <Button
                  onClick={activeStep === 1 ? handleSubmit : handleNext}
                  disabled={loading || !canProceedToNext()}
                  endIcon={activeStep === 1 ? undefined : <ArrowForward />}
                  variant="contained"
                  sx={{
                    px: 4,
                    py: 1.2,
                    borderRadius: '12px',
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
                    transition: 'all 0.2s ease'
                  }}
                >
                  {loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : activeStep === 1 ? (
                    'Create Account'
                  ) : (
                    'Next'
                  )}
                </Button>
              </Box>
            )}

            {/* Login Link */}
            {activeStep < 2 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="body2"
                    sx={{ color: mode === 'dark' ? '#B9BBBE' : '#606060' }}
                  >
                    Already have an account?{' '}
                    <Link
                      component={RouterLink}
                      to="/login"
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
                      Sign in
                    </Link>
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        </Zoom>
      </Container>
    </Box>
  );
};

export default Register;
