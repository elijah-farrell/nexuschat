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
  
  // Generate unique tab ID for cross-tab logout handling
  const [tabId] = useState(() => {
    const existingId = localStorage.getItem('nexuschat-tab-id');
    if (existingId) {
      return existingId;
    }
    const newId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('nexuschat-tab-id', newId);
    return newId;
  });

  // Listen for cross-tab logout and login notifications
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'nexuschat-logout-request' && e.newValue) {
        try {
          const logoutData = JSON.parse(e.newValue);
          // Only logout if this logout request is NOT from our own tab
          if (logoutData.tabId !== tabId) {
    
            setUser(null);
            setToken(null);
            // Don't clear localStorage here - let the initiating tab handle that
          }
        } catch (error) {
          // Error parsing logout request
        }
      }
      
      // Handle cross-tab login notifications
      if (e.key === 'nexuschat-login-request' && e.newValue) {
        try {
          const loginData = JSON.parse(e.newValue);
          // Only handle login if this login request is NOT from our own tab
          if (loginData.tabId !== tabId) {
    
            // Update local state to match the login
            setUser(loginData.user);
            setToken(loginData.token);
            // Don't set localStorage here - let the initiating tab handle that
          }
        } catch (error) {
          // Error parsing login request
        }
      }
    };

    // Clean up tab ID when tab is closed
    const handleBeforeUnload = () => {
      localStorage.removeItem('nexuschat-tab-id');
    };

    // Clean up tab ID when tab becomes hidden (optional, for better cleanup)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, could clean up some resources but keep tab ID
      } else {
        // Tab became visible - check if we need to sync with localStorage
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        // If localStorage has auth data but our state doesn't, sync up
        if (storedToken && storedUser && (!token || !user)) {
          try {
            const parsedUser = JSON.parse(storedUser);
    
            setToken(storedToken);
            setUser(parsedUser);
                  } catch (error) {
          // Error parsing stored user on visibility change
        }
        }
        
        // Also check if we have user state but no valid token - clear invalid state
        if (user && !storedToken) {
  
          setUser(null);
          setToken(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tabId, user, token]);

  useEffect(() => {
    // Prevent infinite loops by checking if we're already initializing
    if (isInitializing) return;
    
    // Skip validation if we just registered
    if (skipValidation) {
      setSkipValidation(false);
      setLoading(false);
      setIsReady(true);
      setIsInitializing(false);
      
      // Ensure user is set from localStorage if available
      const storedUser = localStorage.getItem('user');
      
      if (storedUser && !user) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          // Error parsing stored user
        }
      }
      return;
    }
    
    setIsInitializing(true);
    setIsReady(false); // Reset ready state when token changes
    
    const initializeAuth = async () => {
      // Skip validation for newly registered users
      if (skipValidation) {
        setLoading(false);
        setIsReady(true);
        setIsInitializing(false);
        return;
      }

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
      // Use React Router navigation instead of window.location for better UX
      // The navigation will be handled by the Register component's useEffect
    }
  }, [shouldNavigateAfterRegister, user, isReady]);

  // Reset skipValidation flag after a delay to allow navigation to complete
  useEffect(() => {
    if (skipValidation) {
      const timeout = setTimeout(() => {
        setSkipValidation(false);
      }, 2000); // Wait 2 seconds for navigation to complete
      
      return () => clearTimeout(timeout);
    }
  }, [skipValidation]);


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

  // Periodic token validation to ensure token remains valid
  useEffect(() => {
    if (!token || !user) return;

    const validateToken = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        // Don't clear auth state on network errors, only on actual auth failures
      }
    };

    // Validate token every 5 minutes
    const interval = setInterval(validateToken, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [token, user]);

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
      
      // Notify other tabs about successful login before setting localStorage
      const loginData = { tabId, user: data.user, token: data.token, timestamp: Date.now() };
      localStorage.setItem('nexuschat-login-request', JSON.stringify(loginData));
      
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Clear the login request to prevent it from persisting
      localStorage.removeItem('nexuschat-login-request');
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  }, [tabId]);

  const register = useCallback(async (username, password, name = null) => {
    try {
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

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Registration failed' };
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
      
      // Notify other tabs about successful registration before setting localStorage
      const loginData = { tabId, user: data.user, token: data.token, timestamp: Date.now() };
      localStorage.setItem('nexuschat-login-request', JSON.stringify(loginData));
      
      // Set token first, then user to ensure proper initialization
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Clear the login request to prevent it from persisting
      localStorage.removeItem('nexuschat-login-request');
      
      // Force ready state to true after successful registration
      setLoading(false);
      setIsReady(true);
      
      // Skip validation for newly registered users
      setSkipValidation(true);
      
      // Signal that navigation should happen after state is set
      setShouldNavigateAfterRegister(true);
      
      return { success: true };
    } catch (error) {
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
      // Notify other tabs about logout before clearing localStorage
      const logoutData = { tabId, timestamp: Date.now() };
      localStorage.setItem('nexuschat-logout-request', JSON.stringify(logoutData));
      
      // Clear local state
      setUser(null);
      setToken(null);
      
      // Clear localStorage for this tab only
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('nexuschat-active-section');
      localStorage.removeItem('nexuschat-selected-channel');
      localStorage.removeItem('nexuschat-selected-dm');
      localStorage.removeItem('nexuschat-selected-server');
      localStorage.removeItem('nexuschat-friends-active-tab');
      
      // Clear the logout request to prevent it from persisting
      localStorage.removeItem('nexuschat-logout-request');
    }
  }, [token, tabId]);

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