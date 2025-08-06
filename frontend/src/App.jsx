import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme, Button } from '@mui/material';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/user/ProtectedRoute';
import { SocketProvider } from './contexts/SocketContext';
import { Box, CircularProgress, Typography, Fade } from '@mui/material';

// AppLoading component defined directly in App.jsx
const AppLoading = ({ children }) => {
  const { isFullyReady, user, logout } = useAuth();
  const location = window.location.pathname;
  const isAuthPage = location === '/login' || location === '/register';
  const isLandingPage = location === '/';
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  const [showRetryButton, setShowRetryButton] = useState(false);

  // Show timeout message after 10 seconds if still loading
  useEffect(() => {
    if (!isFullyReady && !isAuthPage && !isLandingPage) {
      const timeout = setTimeout(() => {
        setShowTimeoutMessage(true);
      }, 10000); // 10 seconds

      const retryTimeout = setTimeout(() => {
        setShowRetryButton(true);
      }, 15000); // 15 seconds

      return () => {
        clearTimeout(timeout);
        clearTimeout(retryTimeout);
      };
    } else {
      setShowTimeoutMessage(false);
      setShowRetryButton(false);
    }
  }, [isFullyReady, isAuthPage, isLandingPage]);

  const handleRetry = () => {
    // Clear all auth state and reload
    logout();
    window.location.reload();
  };

  // Show loading screen if not fully ready and not on auth pages or landing page
  if (!isFullyReady && !isAuthPage && !isLandingPage) {
    return (
      <Fade in={true} timeout={500}>
        <Box
          sx={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            alignItems: 'center', bgcolor: 'background.default', zIndex: 9999, gap: 3
          }}
        >
          <CircularProgress size={60} sx={{ color: '#5865F2', '& .MuiCircularProgress-circle': { strokeLinecap: 'round', } }} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'text.primary', mb: 1, fontWeight: 600 }}>
              Connecting to NexusChat...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Setting up real-time features
            </Typography>
            {showTimeoutMessage && (
              <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
                Taking longer than expected. You can still use the app without real-time features.
              </Typography>
            )}
            {showRetryButton && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="error.main" sx={{ mb: 1 }}>
                  Still having issues?
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={handleRetry}
                  sx={{ textTransform: 'none' }}
                >
                  Retry Connection
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Fade>
    );
  }
  return children;
};

const App = () => {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('nexuschat-theme');
    return savedMode || 'dark';
  });

  // Save theme preference to localStorage and update body attribute
  useEffect(() => {
    localStorage.setItem('nexuschat-theme', mode);
    document.body.setAttribute('data-theme', mode);
  }, [mode]);

  const theme = createTheme({
    palette: {
      mode,
      background: {
        default: mode === 'dark' ? '#181a20' : '#f8fafc',
        paper: mode === 'dark' ? '#23272f' : '#fff',
      },
      primary: {
        main: '#5865F2',
      },
      secondary: {
        main: '#57F287',
      },
      text: {
        primary: mode === 'dark' ? '#ffffff' : '#1a1a1a',
        secondary: mode === 'dark' ? '#b9bbbe' : '#6b7280',
      },
      divider: mode === 'dark' ? '#40444b' : '#e5e7eb',
    },
    shape: { borderRadius: 10 },
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1920,
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#23272f' : '#ffffff',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'dark' ? '#2f3136' : '#f9fafb',
            borderRight: `1px solid ${mode === 'dark' ? '#40444b' : '#e5e7eb'}`,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#2f3136' : '#ffffff',
            border: `1px solid ${mode === 'dark' ? '#40444b' : '#e5e7eb'}`,
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SocketProvider>
        <AuthProvider>
          <NotificationProvider>
              <Router 
                future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
              >
                <AppLoading>
                  <Routes>
                    <Route path="/" element={<LandingPage mode={mode} setMode={setMode} />} />
                    <Route path="/login" element={<Login mode={mode} setMode={setMode} />} />
                    <Route path="/register" element={<Register mode={mode} setMode={setMode} />} />
                    <Route
                      path="/app/*"
                      element={
                        <ProtectedRoute>
                          <AppLayout mode={mode} setMode={setMode} />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </AppLoading>
              </Router>
            </NotificationProvider>
        </AuthProvider>
      </SocketProvider>
    </ThemeProvider>
  );
};

export default App; 