import React from 'react';
import ChatArea from '../components/chat/ChatArea';

const Chat = ({
  selectedDirectMessage = null,
  onSelectDirectMessage = () => {},
  onShowUserProfile = () => {},
}) => {
  // For DMs, selectedDirectMessage is a userId or user object

  return (
    <ChatArea
      selectedDirectMessage={selectedDirectMessage}
      onShowUserProfile={onShowUserProfile}
    />
  );
};

export default Chat; 