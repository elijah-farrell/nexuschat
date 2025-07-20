import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { token, loading } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState({
    friendRequests: 0,
    unreadMessages: 0,
    serverInvites: 0,
  });
  // Rename local loading state to 'fetching' to avoid conflict with 'loading' from useAuth
  const [fetching, setFetching] = useState(false);

  const fetchNotifications = async () => {
    if (fetching || !token) return;

    try {
      setFetching(true);
      
      // Fetch friend requests count
      const friendRequestsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/friends/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (friendRequestsResponse.ok) {
        const data = await friendRequestsResponse.json();
        const pendingRequests = data.requests?.filter(req => req.status === 'pending') || [];
        
        setNotifications(prev => ({
          ...prev,
          friendRequests: pendingRequests.length,
        }));
      }

      // Fetch unread DM message count
      const unreadDMResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messaging/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (unreadDMResponse.ok) {
        const data = await unreadDMResponse.json();
        setNotifications(prev => ({
          ...prev,
          unreadMessages: data.unread_count || 0,
        }));
      }

      // TODO: Add other notification types (unread messages, server invites, etc.)
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setFetching(false);
    }
  };

  // Clear notification for a type, or for a specific DM
  const clearNotification = useCallback((type, dmId) => {
    setNotifications(prev => {
      if (type === 'unreadMessages' && dmId) {
        // Subtract 1 from unreadMessages if possible, or recalc from backend later
        return {
          ...prev,
          unreadMessages: Math.max(0, prev.unreadMessages - 1),
        };
      } else if (type && prev[type] > 0) {
        return {
          ...prev,
          [type]: 0,
        };
      }
      return prev;
    });
  }, []);

  const clearAllNotifications = () => {
    setNotifications({
      friendRequests: 0,
      unreadMessages: 0,
      serverInvites: 0,
    });
  };

  const incrementNotification = (type) => {
    setNotifications(prev => ({
      ...prev,
      [type]: prev[type] + 1,
    }));
  };

  const decrementNotification = (type) => {
    setNotifications(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] - 1),
    }));
  };

  const getTotalNotifications = () => {
    return Object.values(notifications).reduce((total, count) => total + count, 0);
  };

  useEffect(() => {
    if (loading || !token) return;
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [loading, token]);

  useEffect(() => {
    if (!socket) return;
    // Listen for real-time friend request events
    const handleRequest = () => setNotifications(prev => ({ ...prev, friendRequests: prev.friendRequests + 1 }));
    const handleAccept = () => setNotifications(prev => ({ ...prev, friendRequests: Math.max(0, prev.friendRequests - 1) }));
    const handleReject = () => setNotifications(prev => ({ ...prev, friendRequests: Math.max(0, prev.friendRequests - 1) }));
    socket.on('friend_request_received', handleRequest);
    socket.on('friend_request_accepted', handleAccept);
    socket.on('friend_request_rejected', handleReject);
    return () => {
      socket.off('friend_request_received', handleRequest);
      socket.off('friend_request_accepted', handleAccept);
      socket.off('friend_request_rejected', handleReject);
    };
  }, [socket]);

  const value = {
    notifications,
    loading,
    fetchNotifications,
    clearNotification,
    clearAllNotifications,
    incrementNotification,
    decrementNotification,
    getTotalNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 

// --- Window Focus Context ---
const WindowFocusContext = createContext(true);

export function WindowFocusProvider({ children }) {
  const [isWindowFocused, setIsWindowFocused] = useState(document.visibilityState === 'visible');

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsWindowFocused(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <WindowFocusContext.Provider value={isWindowFocused}>
      {children}
    </WindowFocusContext.Provider>
  );
}

export function useWindowFocus() {
  return useContext(WindowFocusContext);
} 