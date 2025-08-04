import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isReady, setIsReady] = useState(false);
  const { isConnected, isConnectingState } = useSocket();

  useEffect(() => {
    setIsReady(false); // Reset ready state when token changes
    const initializeAuth = async () => {
      if (token) {
        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            const userWithStatus = {
              ...userData.user,
              status: userData.user.status || 'online'
            };
            setUser(userWithStatus);
          } else {
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (error) {
          // Silently handle auth initialization errors
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
      setIsReady(true);
    };

    initializeAuth();
  }, [token]);

  // Enhanced loading state that includes socket connection
  const isFullyReady = isReady && (!user || (user && (isConnected || isConnectingState === false)));

  // Fallback: if socket connection takes too long, allow app to load anyway
  useEffect(() => {
    if (user && isReady && !isConnected && !isConnectingState) {
      const timeout = setTimeout(() => {
        console.log('[AUTH DEBUG] Socket connection timeout, allowing app to load anyway');
        // Force the app to load even without socket connection
      }, 15000); // 15 seconds timeout
      
      return () => clearTimeout(timeout);
    }
  }, [user, isReady, isConnected, isConnectingState]);

  // Periodically update user status (every 30 seconds)
  useEffect(() => {
    if (!token || !user) return;

    let inactivityTimeout = null;
    let isAway = false;

    const setAway = async () => {
      if (!isAway) {
        isAway = true;
        try {
          await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/status`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'away' }),
          });
          setUser(prev => ({ ...prev, status: 'away' }));
        } catch (error) {
          // ignore
        }
      }
    };

    const setOnline = async () => {
      if (isAway || user.status !== 'online') {
        isAway = false;
        try {
          await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/status`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'online' }),
          });
          setUser(prev => ({ ...prev, status: 'online' }));
        } catch (error) {
          // ignore
        }
      }
    };

    const resetInactivityTimeout = () => {
      clearTimeout(inactivityTimeout);
      setOnline();
      inactivityTimeout = setTimeout(setAway, 5 * 60 * 1000); // 5 minutes
    };

    // Listen for user activity
    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    activityEvents.forEach(event => window.addEventListener(event, resetInactivityTimeout));
    inactivityTimeout = setTimeout(setAway, 5 * 60 * 1000);

    // Set online immediately on mount
    setOnline();

    // Set online when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setOnline();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(inactivityTimeout);
      activityEvents.forEach(event => window.removeEventListener(event, resetInactivityTimeout));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token, user]);

  const refreshUser = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const userData = await response.json();
        const userWithStatus = {
          ...userData.user,
          status: userData.user.status || 'online'
        };
        setUser(userWithStatus);
        localStorage.setItem('user', JSON.stringify(userWithStatus)); // Always update localStorage
      }
    } catch (error) {
      // handle refresh user errors
    }
  };

  const clearUIState = () => {
    localStorage.removeItem('nexuschat-active-section');
    localStorage.removeItem('nexuschat-selected-channel');
    localStorage.removeItem('nexuschat-selected-dm');
    localStorage.removeItem('nexuschat-selected-server');
    localStorage.removeItem('nexuschat-friends-active-tab');
  };

  const login = async (username, password) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (!backendUrl) {
        return { success: false, error: 'VITE_BACKEND_URL environment variable is not set' };
      }
      console.log('[AUTH DEBUG] Login attempt:', { username, backendUrl });
      
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      console.log('[AUTH DEBUG] Login response status:', response.status);
      console.log('[AUTH DEBUG] Login response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.log('[AUTH DEBUG] Login error response:', errorData);
        return { success: false, error: errorData.error || 'Login failed' };
      }

      const data = await response.json();
      console.log('[AUTH DEBUG] Login success data:', data);
      
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      return { success: true };
    } catch (error) {
      console.error('[AUTH DEBUG] Login error:', error);
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  };

  const register = async (username, password, name = null) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (!backendUrl) {
        return { success: false, error: 'VITE_BACKEND_URL environment variable is not set' };
      }
      console.log('[AUTH DEBUG] Register attempt:', { username, name, backendUrl });
      
      const response = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, name }),
      });

      console.log('[AUTH DEBUG] Register response status:', response.status);
      console.log('[AUTH DEBUG] Register response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.log('[AUTH DEBUG] Register error response:', errorData);
        return { success: false, error: errorData.error || 'Registration failed' };
      }

      const data = await response.json();
      console.log('[AUTH DEBUG] Register success data:', data);
      
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true };
    } catch (error) {
      console.error('[AUTH DEBUG] Register error:', error);
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint to update status
      if (token) {
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      // Silently handle logout errors
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      // Clear all app state from localStorage for fresh start
      localStorage.removeItem('nexuschat-active-section');
      localStorage.removeItem('nexuschat-selected-channel');
      localStorage.removeItem('nexuschat-selected-dm');
      localStorage.removeItem('nexuschat-selected-server');
      localStorage.removeItem('nexuschat-friends-active-tab');
    }
  };

  const value = {
    user,
    token,
    loading,
    isReady,
    isFullyReady,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useLogoutWithSocket() {
  const { logout } = useAuth();
  const { socket } = useSocket();
  return async function logoutWithSocket() {
    if (socket && socket.connected) {
      socket.disconnect();
    }
    await logout();
  };
} 