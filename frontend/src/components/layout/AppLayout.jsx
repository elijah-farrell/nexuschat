import React, { useState, useEffect } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import MainSidebar from './MainSidebar';
import DMSidebar from './DMSidebar';
import Friends from '../../pages/Friends';
import Home from '../../pages/Home';
import Chat from '../../pages/Chat';
import Settings from '../../pages/Settings';
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
  const [activeSection, setActiveSection] = useState(() => {
    // Always start with 'home' for new sessions, but allow restoring for existing sessions
    const savedSection = localStorage.getItem('nexuschat-active-section');
    return savedSection || 'home';
  });
  const [selectedChannel, setSelectedChannel] = useState(() => {
    // Restore selected channel from localStorage
    const savedChannel = localStorage.getItem('nexuschat-selected-channel');
    return savedChannel ? JSON.parse(savedChannel) : null;
  });
  const [selectedDirectMessage, setSelectedDirectMessage] = useState(() => {
    // Restore selected direct message from localStorage
    const savedDM = localStorage.getItem('nexuschat-selected-dm');
    return savedDM ? JSON.parse(savedDM) : null;
  });
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showViewProfile, setShowViewProfile] = useState(false);
  const [viewProfileUserId, setViewProfileUserId] = useState(null);
  const [selectedServer, setSelectedServer] = useState(() => {
    // Restore selected server from localStorage
    const savedServer = localStorage.getItem('nexuschat-selected-server');
    return savedServer ? JSON.parse(savedServer) : null;
  });
  const [showDMSidebar, setShowDMSidebar] = useState(false);
  const [dmButtonActive, setDmButtonActive] = useState(false);
  const [dmDetails, setDmDetails] = useState(null);

  // Fetch DM details when selectedDirectMessage changes
  useEffect(() => {
    if (selectedDirectMessage && activeSection === 'directs') {
      fetchDmDetails(selectedDirectMessage);
    }
  }, [selectedDirectMessage, activeSection]);

  const fetchDmDetails = async (dmId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/messaging/dms/${dmId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDmDetails(data.dm);
      }
    } catch (error) {
      console.error('Error fetching DM details:', error);
    }
  };

  // Dynamic page title based on active section
  usePageTitle(getPageTitle(activeSection, selectedDirectMessage, dmDetails, user));

  // Ensure we start on home when the component mounts
  useEffect(() => {
    // If no active section is saved, default to home
    if (!localStorage.getItem('nexuschat-active-section')) {
      setActiveSection('home');
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('nexuschat-active-section', activeSection);
  }, [activeSection]);

  useEffect(() => {
    localStorage.setItem('nexuschat-selected-channel', JSON.stringify(selectedChannel));
  }, [selectedChannel]);

  useEffect(() => {
    localStorage.setItem('nexuschat-selected-dm', JSON.stringify(selectedDirectMessage));
  }, [selectedDirectMessage]);

  useEffect(() => {
    localStorage.setItem('nexuschat-selected-server', JSON.stringify(selectedServer));
  }, [selectedServer]);

  const handleSectionChange = (section) => {
    if (section === 'directs') {
      setDmButtonActive(true);
      setShowDMSidebar((prev) => !prev);
      setTimeout(() => setDmButtonActive(false), 350);
    } else {
      setActiveSection(section);
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

  const renderMainContent = () => {
    switch (activeSection) {
      case 'home':
        return (
          <Home 
            onShowUserProfile={(userId) => {
              if (userId === user?.id) {
                // Show current user's profile for editing
                setShowUserProfile(true);
              } else {
                // Show other user's profile for viewing
                setViewProfileUserId(userId);
                setShowViewProfile(true);
              }
            }}
            onSelectDirectMessage={handleSelectDirectMessage}
            mode={mode}
            setMode={setMode}
          />
        );
      case 'friends':
        return (
          <Friends 
            onShowUserProfile={(userId) => {
              if (userId === user?.id) {
                setShowUserProfile(true);
              } else {
                setViewProfileUserId(userId);
                setShowViewProfile(true);
              }
            }}
            onSelectDirectMessage={handleSelectDirectMessage}
            mode={mode}
            setMode={setMode}
          />
        );
      case 'settings':
        return <Settings mode={mode} setMode={setMode} />;
      case 'directs':
        return (
          <Chat
            mode="dm"
            selectedDirectMessage={selectedDirectMessage}
            onSelectDirectMessage={setSelectedDirectMessage}
          />
        );
      default:
        // Remove server content rendering, always show Home
        return <Home />;
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default', overflow: 'hidden' }}>
      <CssBaseline />
      <ConnectionBanner />
      {/* Main Sidebar */}
      <MainSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        selectedServer={selectedServer}
        onServerSelect={setSelectedServer}
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

// Helper function to get page title based on active section
const getPageTitle = (activeSection, selectedDirectMessage, dmDetails, user) => {
  switch (activeSection) {
    case 'home':
      return 'Home';
    case 'friends':
      return 'Friends';
    case 'settings':
      return 'Settings';
    case 'directs':
      if (selectedDirectMessage && dmDetails) {
        if (dmDetails.type === 'group') {
          return dmDetails.name || 'Group DM';
        } else {
          // For 1-on-1 DMs, find the other user
          const otherUser = dmDetails.members?.find(m => String(m.id) !== String(user?.id));
          return otherUser ? `@${otherUser.username}` : 'Direct Message';
        }
      }
      return 'Direct Messages';
    default:
      return 'Home';
  }
};

export default AppLayout; 