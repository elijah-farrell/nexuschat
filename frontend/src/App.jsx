import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider } from './contexts/AuthContext';
import { ServerProvider } from './contexts/ServerContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/user/ProtectedRoute';
import { SocketProvider } from './contexts/SocketContext';

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
          <ServerProvider>
            <NotificationProvider>
              <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                  <Route path="/login" element={<Login mode={mode} setMode={setMode} />} />
                  <Route path="/register" element={<Register mode={mode} setMode={setMode} />} />
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <AppLayout mode={mode} setMode={setMode} />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Router>
            </NotificationProvider>
          </ServerProvider>
        </AuthProvider>
      </SocketProvider>
    </ThemeProvider>
  );
};

export default App; 