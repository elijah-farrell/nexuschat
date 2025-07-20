import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ServerContext = createContext();

export const useServers = () => {
  return {
    servers: [],
    loading: false,
    fetchServers: () => {},
    createServer: () => Promise.resolve({ success: false, error: 'Coming soon' }),
    createChannel: () => {},
    fetchChannels: () => {},
  };
};

export const ServerProvider = ({ children }) => {
  const value = {
    servers: [],
    loading: false,
    fetchServers: () => {},
    createServer: () => Promise.resolve({ success: false, error: 'Coming soon' }),
    createChannel: () => {},
    fetchChannels: () => {},
  };
  return (
    <ServerContext.Provider value={value}>
      {children}
    </ServerContext.Provider>
  );
}; 