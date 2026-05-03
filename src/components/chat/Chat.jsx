import React, { useState, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import NewConversationDialog from './NewConversationDialog';
import { getStoredLanguage, t } from '../../i18n';

const Chat = () => {
  const { selectConversation, activeConversation, setActiveConversation } = useChat();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [lang, setLang] = useState(getStoredLanguage());

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

  useEffect(() => {
    const onLanguageChanged = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLanguageChanged);
    return () => window.removeEventListener('language-changed', onLanguageChanged);
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
    <div className="relative flex h-[calc(100dvh-var(--app-header-height,64px))] w-full shrink-0 overflow-hidden bg-app-background font-cairo">
      {/* Chat List - Full width on mobile, fixed width on desktop */}
      <div
        className={`
          ${showChatList ? 'flex' : 'hidden'}
          w-full md:w-80 lg:w-96
          min-h-0 flex-shrink-0 flex-col
          h-full
          transition-all duration-300 ease-in-out
          border-r border-app-divider
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
          min-h-0 flex-1 flex-col
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
          <div className="flex h-full w-full items-center justify-center bg-app-background">
            <div className="max-w-md px-6 text-center">
              {/* Icon */}
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-orange/15 blur-2xl" />
                <svg 
                  className="relative mx-auto h-20 w-20 text-app-primary" 
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
              <h3 className="mb-2 text-xl font-semibold text-app-text">
                {t(lang, 'chatWelcomeTitle')}
              </h3>
              <p className="mb-6 text-app-text-secondary">
                {t(lang, 'chatWelcomeDescription')}
              </p>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleCreateNew}
                className="inline-flex min-h-[40px] transform items-center gap-2 rounded-app-btn bg-app-primary px-6 py-3 text-app-on-primary shadow-app-soft transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 hover:shadow-app-card"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t(lang, 'startNewConversation')}
              </button>

              {/* Keyboard Shortcut Hint (Desktop Only) */}
              <div className="mt-8 hidden border-t border-app-divider pt-8 md:block">
                <p className="text-xs text-app-text-tertiary">
                  {t(lang, 'chatShortcutTipPrefix')}{' '}
                  <kbd className="rounded border border-app-border bg-app-surface px-2 py-1 text-app-text-secondary">
                    N
                  </kbd>{' '}
                  {t(lang, 'chatShortcutTipSuffix')}
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