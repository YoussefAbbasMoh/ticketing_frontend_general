import React, { useState, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import NewConversationDialog from './NewConversationDialog';

const Chat = () => {
  const { selectConversation, activeConversation, setActiveConversation } = useChat();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive breakpoint with resize listener
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add resize listener with debounce
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 150);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleSelectConversation = (conversation) => {
    selectConversation(conversation);
  };

  const handleBack = () => {
    setActiveConversation(null);
  };

  const handleCreateNew = () => {
    setShowNewDialog(true);
  };

  const handleCloseDialog = () => {
    setShowNewDialog(false);
  };

  const handleConversationSelect = (conversation) => {
    setShowNewDialog(false);
    selectConversation(conversation);
  };

  // Determine what to show based on screen size and active conversation
  const showChatList = !isMobile || !activeConversation;
  const showChatWindow = !isMobile || activeConversation;

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden relative">
      {/* Chat List - Full width on mobile, fixed width on desktop */}
      <div 
        className={`
          ${showChatList ? 'flex' : 'hidden'}
          w-full md:w-80 lg:w-96 
          flex-shrink-0 
          h-full
          transition-all duration-300 ease-in-out
          border-r border-gray-200
          relative
          z-0
        `}
      >
        <ChatList
          onSelectConversation={handleSelectConversation}
          onCreateNew={handleCreateNew}
        />
      </div>

      {/* Chat Window - Full width on mobile, flex-1 on desktop */}
      <div 
        className={`
          ${showChatWindow ? 'flex' : 'hidden'}
          flex-1 
          h-full
          w-full
          min-w-0
          transition-all duration-300 ease-in-out
          relative
          z-0
        `}
      >
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            onBack={isMobile ? handleBack : null}
          />
        ) : (
          // Empty State
          <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center px-6 max-w-md">
              {/* Icon */}
              <div className="mb-6 relative">
                <div className="absolute inset-0 bg-secondary/10 rounded-full blur-2xl"></div>
                <svg 
                  className="w-20 h-20 mx-auto text-secondary relative" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                  />
                </svg>
              </div>

              {/* Text */}
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Welcome to Messages
              </h3>
              <p className="text-gray-500 mb-6">
                Select a conversation from the list or start a new one to begin chatting
              </p>

              {/* Action Button */}
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-white rounded-lg hover:bg-secondary-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Start New Conversation
              </button>

              {/* Keyboard Shortcut Hint (Desktop Only) */}
              <div className="hidden md:block mt-8 pt-8 border-t border-gray-200">
                <p className="text-xs text-gray-400">
                  Tip: Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-gray-600">N</kbd> to start a new conversation
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Dialog Modal */}
      {showNewDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <NewConversationDialog
            onClose={handleCloseDialog}
            onSelect={handleConversationSelect}
          />
        </div>
      )}
    </div>
  );
};

export default Chat;