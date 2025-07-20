import React from 'react';
import ChatArea from '../components/chat/ChatArea';

const Chat = ({
  mode = 'dm',
  selectedServer = null,
  selectedChannel = null,
  selectedDirectMessage = null,
  onSelectChannel = () => {},
  onSelectDirectMessage = () => {},
  onShowUserProfile = () => {},
}) => {
  // For DMs, selectedDirectMessage is a userId or user object
  // For servers, selectedChannel is a channel object

  return (
    <ChatArea
      selectedChannel={mode === 'server' ? selectedChannel : null}
      selectedDirectMessage={mode === 'dm' ? selectedDirectMessage : null}
      onShowUserProfile={onShowUserProfile}
    />
  );
};

export default Chat; 