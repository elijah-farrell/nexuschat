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
  const isFullyReady = isReady && (!user || (user && isConnected && !isConnectingState));

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
      throw new Error('VITE_BACKEND_URL environment variable is not set');
    }
        const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.status === 429) {
        return { success: false, error: 'Too many login attempts. Please wait a moment before trying again.' };
      }

      if (response.ok) {
        const userWithStatus = {
          ...data.user,
          status: 'online'
        };
        setToken(data.token);
        setUser(userWithStatus);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userWithStatus));
        clearUIState();
        await refreshUser(); // Always fetch latest profile after login
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (username, password) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const userWithStatus = {
          ...data.user,
          status: 'online'
        };
        setToken(data.token);
        setUser(userWithStatus);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userWithStatus));
        clearUIState();
        await refreshUser(); // Always fetch latest profile after register
        return { success: true };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
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