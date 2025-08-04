import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

// Singleton to prevent multiple connections
let socketInstance = null;
let isConnecting = false;
let connectionPromise = null;

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userStatuses, setUserStatuses] = useState(new Map());
  const [isConnectingState, setIsConnectingState] = useState(false);
  const connectionAttemptsRef = useRef(0);
  const maxRetries = 3;
  const reconnectTimeoutRef = useRef(null);

  // Use state for token and user
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  });

  // Listen for storage changes (multi-tab)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'token') setToken(e.newValue);
      if (e.key === 'user') {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Also update state on login/logout in this tab (less frequent to prevent unnecessary reconnects)
  useEffect(() => {
    const interval = setInterval(() => {
      const newToken = localStorage.getItem('token');
      const newUserStr = localStorage.getItem('user');
      let newUser = null;
      try {
        newUser = newUserStr ? JSON.parse(newUserStr) : null;
      } catch {}
      
      // Only update if there's an actual change to prevent unnecessary reconnects
      if (token !== newToken) {
        setToken(newToken);
      }
      if (JSON.stringify(user) !== JSON.stringify(newUser)) {
        setUser(newUser);
      }
    }, 2000); // Increased to 2 seconds to reduce frequency
    return () => clearInterval(interval);
  }, [token, user]);

  useEffect(() => {
    // Only reconnect if we don't have a socket or if token/user actually changed
    const shouldReconnect = !socketInstance || 
                           !socketInstance.connected || 
                           socketInstance.auth?.token !== token ||
                           !user;
    
    if (shouldReconnect && token && user && connectionAttemptsRef.current < maxRetries) {
      // Clear any pending reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Debounce reconnection to prevent rapid reconnects
      reconnectTimeoutRef.current = setTimeout(() => {
        // Disconnect existing socket only if we need to reconnect
        if (socketInstance && socketInstance.connected) {
          try {
            socketInstance.disconnect();
          } catch {}
          // Don't set to null immediately, let the disconnect event handle it
        }
        if (isConnecting && connectionPromise) {
          connectionPromise.then((connectedSocket) => {
            if (connectedSocket) {
              setSocket(connectedSocket);
              setIsConnected(true);
              setIsConnectingState(false);
            }
          });
          return;
        }
        isConnecting = true;
        setIsConnectingState(true);
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        if (!backendUrl) {
          console.error('❌ VITE_BACKEND_URL environment variable is not set');
          return;
        }
        const newSocket = io(backendUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: false,
          forceNew: true,
        });

        connectionPromise = new Promise((resolve) => {
          newSocket.on('connect', () => {
            socketInstance = newSocket;
            setSocket(newSocket);
            setIsConnected(true);
            setIsConnectingState(false);
            isConnecting = false;
            connectionAttemptsRef.current = 0;
            resolve(newSocket);
          });
          newSocket.on('disconnect', (reason) => {
            setIsConnected(false);
            setIsConnectingState(false);
            isConnecting = false;
            // Only clear socketInstance if this is the current instance
            if (socketInstance === newSocket) {
              socketInstance = null;
            }
            resolve(null);
          });
          newSocket.on('connect_error', (error) => {
            setIsConnected(false);
            setIsConnectingState(false);
            isConnecting = false;
            socketInstance = null;
            connectionAttemptsRef.current += 1;
            if (connectionAttemptsRef.current >= maxRetries) {
              console.warn('Max connection attempts reached. WebSocket features disabled.');
            }
            resolve(null);
          });
        });
        newSocket.on('user_status_update', (data) => {
          setUserStatuses(prev => new Map(prev.set(data.userId, data.status)));
        });
        newSocket.on('user_online', (data) => {
          setUserStatuses(prev => new Map(prev.set(data.userId, 'online')));
        });
        newSocket.on('user_offline', (data) => {
          setUserStatuses(prev => new Map(prev.set(data.userId, 'offline')));
        });
        setSocket(newSocket);
        return () => {
          if (newSocket) {
            try {
              newSocket.disconnect();
            } catch {}
          }
          setIsConnectingState(false);
          isConnecting = false;
          connectionPromise = null;
          hasLoggedConnection = false;
          socketInstance = null;
        };
      }, 100); // 100ms debounce
    } else if (!token || !user) {
      if (socket && socket.connected) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setIsConnectingState(false);
        isConnecting = false;
        socketInstance = null;
      }
    }
  }, [token, user]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const value = {
    socket,
    isConnected,
    userStatuses,
    isConnecting: isConnectingState
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 