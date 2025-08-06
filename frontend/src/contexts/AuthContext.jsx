import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
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
  const [isInitializing, setIsInitializing] = useState(false);
  const [skipValidation, setSkipValidation] = useState(false);
  const [shouldNavigateAfterRegister, setShouldNavigateAfterRegister] = useState(false);
  const { isConnected, isConnectingState } = useSocket();

  useEffect(() => {
    // Prevent infinite loops by checking if we're already initializing
    if (isInitializing) return;
    
    // Skip validation if we just registered
    if (skipValidation) {
      console.log('🔍 AUTH: Skipping validation for newly registered user');
      console.log('🔍 AUTH: Current user state:', user);
      console.log('🔍 AUTH: Current token state:', token);
      
      setSkipValidation(false);
      setLoading(false);
      setIsReady(true);
      setIsInitializing(false);
      
      // Ensure user is set from localStorage if available
      const storedUser = localStorage.getItem('user');
      console.log('🔍 AUTH: Stored user from localStorage:', storedUser);
      
      if (storedUser && !user) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('🔍 AUTH: Setting user from localStorage:', parsedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }
      return;
    }
    
    setIsInitializing(true);
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
            // Clear invalid token
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          // Silently handle auth initialization errors
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } else {
        // No token, ensure user is null
        setUser(null);
      }
      setLoading(false);
      setIsReady(true);
      setIsInitializing(false);
    };

    initializeAuth();
  }, [token, skipValidation]); // Remove isInitializing from dependencies to prevent infinite loop

  // Handle navigation after successful registration
  useEffect(() => {
    if (shouldNavigateAfterRegister && user && isReady) {
      setShouldNavigateAfterRegister(false);
      // Use window.location to navigate after state is confirmed
      window.location.href = '/dashboard';
    }
  }, [shouldNavigateAfterRegister, user, isReady]);



  // Enhanced loading state that includes socket connection
  const isFullyReady = isReady && (!user || (user && (isConnected || isConnectingState === false)));

  // Fallback: if socket connection takes too long, allow app to load anyway
  useEffect(() => {
    if (user && isReady && !isConnected && !isConnectingState) {
      const timeout = setTimeout(() => {
        // Force the app to load even without socket connection
      }, 15000); // 15 seconds timeout
      
      return () => clearTimeout(timeout);
    }
  }, [user, isReady, isConnected, isConnectingState]);

  // Additional fallback: if loading takes too long, force ready state
  useEffect(() => {
    if (!isReady) {
      const timeout = setTimeout(() => {
        setLoading(false);
        setIsReady(true);
      }, 10000); // 10 seconds timeout
      
      return () => clearTimeout(timeout);
    }
  }, [isReady]);

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

  const refreshUser = useCallback(async () => {
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
  }, [token]);

  const clearUIState = useCallback(() => {
    localStorage.removeItem('nexuschat-active-section');
    localStorage.removeItem('nexuschat-selected-channel');
    localStorage.removeItem('nexuschat-selected-dm');
    localStorage.removeItem('nexuschat-selected-server');
    localStorage.removeItem('nexuschat-friends-active-tab');
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (!backendUrl) {
        return { success: false, error: 'VITE_BACKEND_URL environment variable is not set' };
      }
      
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Login failed' };
      }

      const data = await response.json();
      
      // Clear any existing auth data before setting new user
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('nexuschat-active-section');
      localStorage.removeItem('nexuschat-selected-channel');
      localStorage.removeItem('nexuschat-selected-dm');
      localStorage.removeItem('nexuschat-selected-server');
      localStorage.removeItem('nexuschat-friends-active-tab');
      
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  }, []);

  const register = useCallback(async (username, password, name = null) => {
    try {
      console.log('🔍 REGISTER: Starting registration for:', username);
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (!backendUrl) {
        return { success: false, error: 'VITE_BACKEND_URL environment variable is not set' };
      }
      
      const response = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, name }),
      });

      console.log('🔍 REGISTER: Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('🔍 REGISTER: Failed with error:', errorData);
        return { success: false, error: errorData.error || 'Registration failed' };
      }

      const data = await response.json();
      console.log('🔍 REGISTER: Success! Token:', data.token ? 'exists' : 'missing', 'User:', data.user);
      
      // Clear any existing auth data before setting new user
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('nexuschat-active-section');
      localStorage.removeItem('nexuschat-selected-channel');
      localStorage.removeItem('nexuschat-selected-dm');
      localStorage.removeItem('nexuschat-selected-server');
      localStorage.removeItem('nexuschat-friends-active-tab');
      
      // Set token first, then user to ensure proper initialization
      console.log('🔍 REGISTER: Setting token to:', data.token);
      setToken(data.token);
      console.log('🔍 REGISTER: Setting user to:', data.user);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Force ready state to true after successful registration
      setLoading(false);
      setIsReady(true);
      
      // Skip validation for newly registered users
      setSkipValidation(true);
      
      // Signal that navigation should happen after state is set
      setShouldNavigateAfterRegister(true);
      
      console.log('🔍 REGISTER: AuthContext updated, returning success');
      return { success: true };
    } catch (error) {
      console.log('🔍 REGISTER: Network error:', error);
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  }, []);

  const logout = useCallback(async () => {
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
  }, [token]);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    isReady,
    isFullyReady,
    login,
    register,
    logout,
    refreshUser,
  }), [user, token, loading, isReady, isFullyReady]);

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