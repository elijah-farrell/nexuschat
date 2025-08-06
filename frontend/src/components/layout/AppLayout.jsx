import React, { useState, useEffect } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MainSidebar from './MainSidebar';
import DMSidebar from './DMSidebar';

import UserProfile from '../user/UserProfile';
import ViewProfile from '../user/ViewProfile';
import { useSocket } from '../../contexts/SocketContext';
import usePageTitle from '../../utils/usePageTitle';

const ConnectionBanner = () => {
  const { isConnected, isConnecting } = useSocket();
  const [apiOnline, setApiOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const checkApi = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/health`);
        setApiOnline(res.ok);
      } catch {
        setApiOnline(false);
      }
    };
    checkApi();
    const interval = setInterval(checkApi, 15000); // check every 15s
    return () => clearInterval(interval);
  }, []);

  // Show banner when disconnected, hide when reconnected
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      setShowBanner(true);
    } else if (isConnected) {
      // Auto-hide banner when reconnected
      const timer = setTimeout(() => setShowBanner(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, isConnecting]);

  if (!apiOnline) {
    return (
      <Box sx={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000,
        bgcolor: 'error.main', color: 'error.contrastText', py: 1, textAlign: 'center', fontWeight: 600
      }}>
        ❌ Server unavailable. Please try again later.
      </Box>
    );
  }
  if (showBanner && !isConnected && !isConnecting) {
    return (
      <Box sx={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000,
        bgcolor: 'warning.main', color: 'warning.contrastText', py: 1, textAlign: 'center', fontWeight: 600
      }}>
        ⚠️ Real-time connection lost. Reconnecting automatically...
      </Box>
    );
  }
  return null;
};

const AppLayout = ({ mode, setMode }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [selectedChannel, setSelectedChannel] = useState(() => {
    const savedChannel = localStorage.getItem('nexuschat-selected-channel');
    return savedChannel && savedChannel !== 'null' && savedChannel !== 'undefined' ? JSON.parse(savedChannel) : null;
  });
  const [selectedDirectMessage, setSelectedDirectMessage] = useState(() => {
    const savedDM = localStorage.getItem('nexuschat-selected-dm');
    return savedDM && savedDM !== 'null' && savedDM !== 'undefined' ? JSON.parse(savedDM) : null;
  });
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showViewProfile, setShowViewProfile] = useState(false);
  const [viewProfileUserId, setViewProfileUserId] = useState(null);

  const [showDMSidebar, setShowDMSidebar] = useState(false);
  const [dmButtonActive, setDmButtonActive] = useState(false);
  const [dmDetails, setDmDetails] = useState(null);

  // Set page title based on current URL
  usePageTitle(getPageTitle(location, selectedDirectMessage, dmDetails, user));

  // Get current section from URL
  const getCurrentSection = () => {
    const path = location.pathname;
    if (path.includes('/friends')) return 'friends';
    if (path.includes('/chat')) return 'chat';
    if (path.includes('/settings')) return 'settings';
    return 'home';
  };

  const handleSectionChange = (section) => {
    if (section === 'directs') {
      setDmButtonActive(true);
      setShowDMSidebar((prev) => !prev);
      setTimeout(() => setDmButtonActive(false), 350);
    } else {
      // Navigate to the appropriate route
      switch (section) {
        case 'home':
          navigate('/dashboard');
          break;
        case 'friends':
          navigate('/dashboard/friends');
          break;
        case 'chat':
          navigate('/dashboard/chat');
          break;
        case 'settings':
          navigate('/dashboard/settings');
          break;
        default:
          navigate('/dashboard');
      }
      
      if (section !== 'friends' && section !== 'home') {
        setShowDMSidebar(false);
      }
      // Clear selected DM when switching to Home or Friends
      if (section === 'home' || section === 'friends') {
        setSelectedDirectMessage(null);
      }
    }
  };

  const handleSelectDirectMessage = (dmId) => {
    setSelectedDirectMessage(dmId);
    setShowDMSidebar(true);
    setActiveSection('directs');
    setDmButtonActive(true);
    setTimeout(() => setDmButtonActive(false), 350);
  };

  const handleCloseDMSidebar = () => {
    setShowDMSidebar(false);
    // On mobile, go back to home when closing DM sidebar
    if (window.innerWidth < 600) {
      setActiveSection('home');
    }
  };

  // Use React Router's Outlet to render nested routes
  const renderMainContent = () => {
    return <Outlet />;
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default', overflow: 'hidden' }}>
      <CssBaseline />
      <ConnectionBanner />
      {/* Main Sidebar */}
      <MainSidebar
        activeSection={getCurrentSection()}
        onSectionChange={handleSectionChange}
        onShowUserProfile={() => setShowUserProfile(true)}
        showDMSidebar={showDMSidebar}
        dmButtonActive={dmButtonActive}
      />

      {/* DM Sidebar - Toggleable (Positioned between main sidebar and content) */}
      {showDMSidebar && (
        <DMSidebar
          selectedDirectMessage={selectedDirectMessage}
          onSelectDirectMessage={handleSelectDirectMessage}
          onClose={handleCloseDMSidebar}
        />
      )}

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
        {renderMainContent()}
      </Box>

      {/* User Profile Modal */}
      {showUserProfile && (
        <UserProfile
          open={showUserProfile}
          onClose={() => setShowUserProfile(false)}
        />
      )}

      {/* View Profile Modal */}
      {showViewProfile && (
        <ViewProfile
          open={showViewProfile}
          onClose={() => {
            setShowViewProfile(false);
            setViewProfileUserId(null);
          }}
          userId={viewProfileUserId}
          onGoToDM={handleSelectDirectMessage}
        />
      )}
    </Box>
  );
};

// Helper function to get page title based on current URL
const getPageTitle = (location, selectedDirectMessage, dmDetails, user) => {
  const path = location.pathname;
  if (path.includes('/friends')) return 'Friends';
  if (path.includes('/chat')) return 'Chat';
  if (path.includes('/settings')) return 'Settings';
  if (path.includes('/dashboard')) return 'NexusChat';
  return 'NexusChat';
};

export default AppLayout; 