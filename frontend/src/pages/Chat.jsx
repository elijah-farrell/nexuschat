import React from 'react';
import { useOutletContext } from 'react-router-dom';
import ChatArea from '../components/chat/ChatArea';

const Chat = () => {
  // Get selectedDirectMessage from the outlet context
  const { selectedDirectMessage, onSelectDirectMessage } = useOutletContext() || {};
  
  console.log('Chat component rendered with selectedDirectMessage:', selectedDirectMessage);

  return (
    <ChatArea
      selectedDirectMessage={selectedDirectMessage}
      onShowUserProfile={() => {}} // This can be added later if needed
    />
  );
};

export default Chat; 