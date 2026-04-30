import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { chatAPI } from '../../services/api';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import ThreadPanel from './ThreadPanel';
import Spinner from '../ui/Spinner';
import { useBunnyUpload } from '../../hooks/useBunnyUpload';

const ChatWindow = ({ conversation, onBack }) => {
  const { user } = useAuth();
  const { messages, sendMessage, sendFileMessage, loadMessages, markAsRead } = useChat();
  const { uploadFile, uploadVideo } = useBunnyUpload();
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const previousScrollHeight = useRef(0);

  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [threadMessage, setThreadMessage] = useState(null);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversation?._id) {
      setLoading(true);
      setReplyTo(null);
      setEditingMessage(null);
      loadMessages(conversation._id)
        .then(() => {
          setHasMore(true);
          // Scroll to bottom after messages are loaded
          setTimeout(() => {
            scrollToBottom('auto');
          }, 100);
        })
        .finally(() => setLoading(false));

      // Mark messages as read when opening conversation
      if (markAsRead) {
        markAsRead(conversation._id);
      }
    }
  }, [conversation?._id]);

  // ... (keeping existing scroll logic) ...
  // Auto-scroll to bottom when conversation opens and messages are available
  useEffect(() => {
    if (conversation?._id && messages.length > 0 && !loading) {
      // Wait for images to load before scrolling
      const timer = setTimeout(() => {
        scrollToBottom('auto');
        // Also scroll again after a bit more time to account for lazy-loaded images
        setTimeout(() => {
          scrollToBottom('auto');
        }, 300);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [conversation?._id, messages.length, loading]);

  // Scroll to bottom when new messages arrive (only if already near bottom)
  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;

      if (isNearBottom) {
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
          scrollToBottom('smooth');
          // Also scroll after images might load
          setTimeout(() => {
            scrollToBottom('smooth');
          }, 200);
        });
      }
    }
  }, [messages]);

  // Handle scroll button visibility
  const handleScroll = useCallback((e) => {
    const container = e.target;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    setShowScrollButton(!isNearBottom);

    // Load more messages when scrolled to top
    if (container.scrollTop === 0 && hasMore && !isLoadingMore) {
      handleLoadMore();
    }
  }, [hasMore, isLoadingMore]);

  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      if (behavior === 'auto') {
        // Instant scroll for initial load - use scrollTop for more reliable scrolling
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight;
        });
      } else {
        // Smooth scroll for user interactions
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        });
      }
    } else {
      // Fallback to scrollIntoView if container ref is not available
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
      });
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore || !conversation?._id) return;

    setIsLoadingMore(true);
    const container = messagesContainerRef.current;
    previousScrollHeight.current = container?.scrollHeight || 0;

    try {
      const currentPage = Math.ceil((messages.length || 0) / 50) + 1;
      const response = await chatAPI.getMessages(conversation._id, currentPage, 50);

      if (response.data.messages && response.data.messages.length > 0) {
        // Messages will be prepended by the context
        setHasMore(response.data.hasMore);

        // Maintain scroll position after loading older messages
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - previousScrollHeight.current;
          }
        }, 0);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Load more messages error:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSendMessage = async (content) => {
    if (!content.trim() || !conversation?._id) return;

    try {
      if (editingMessage) {
        await chatAPI.editMessage(editingMessage._id, content);
        setEditingMessage(null);
      } else {
        // Use context's sendMessage which updates local state immediately
        await sendMessage(conversation._id, content, replyTo?._id);
        setReplyTo(null);
        // Wait a bit for message to be added to DOM, then scroll
        setTimeout(() => {
          scrollToBottom('auto');
          // Also scroll again after images might load
          setTimeout(() => {
            scrollToBottom('auto');
          }, 300);
        }, 100);
      }
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const handleSendFile = async (type, file) => {
    if (!conversation?._id) return;

    try {
      // Voice remains on legacy multipart path.
      if (type === 'voice') {
        await sendFileMessage(conversation._id, type, file, replyTo?._id);
      } else {
        // Upload directly to Bunny from frontend.
        const uploadResult = type === 'video'
          ? await uploadVideo(file)
          : await uploadFile(file, `chat/${conversation._id}`);

        // Send only URL + metadata to backend API.
        await chatAPI.sendFileMessageByUrl(
          conversation._id,
          type,
          uploadResult.url,
          uploadResult.fileName || file.name || 'attachment',
          file?.size || null,
          file?.type || null,
          replyTo?._id || null,
        );

        // Reload messages so the uploaded media appears immediately.
        await loadMessages(conversation._id);
      }

      setReplyTo(null);
      // Wait for file message to be added, then scroll
      setTimeout(() => {
        scrollToBottom('auto');
        // Scroll again after media loads
        setTimeout(() => {
          scrollToBottom('auto');
        }, 500);
      }, 100);
    } catch (error) {
      console.error('Send file error:', error);
      alert(error?.message || 'Failed to send file. Please try again.');
    }
  };

  const handleReaction = async (message, emoji) => {
    try {
      await chatAPI.itemReaction(message._id, emoji);
    } catch (error) {
      console.error('Reaction error:', error);
    }
  };

  const handleDelete = async (message) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await chatAPI.deleteMessage(message._id);
    } catch (error) {
      console.error('Delete message error:', error);
    }
  };

  const handleReplyInThread = (message) => {
    setThreadMessage(message);
  };

  const getOtherParticipant = useCallback(() => {
    if (!conversation?.participants || conversation.participants.length === 0) return null;

    // For project groups, return null (we'll use project name instead)
    if (conversation.isGroup && conversation.project) {
      return null;
    }

    const currentUserId = user?._id?.toString() || user?.id?.toString();

    if (!currentUserId) {
      return conversation.participants[0];
    }

    const other = conversation.participants.find(p => {
      const participantId = p?._id?.toString() || p?.toString();
      return participantId && participantId !== currentUserId;
    });

    return other || conversation.participants[0];
  }, [conversation, user]);

  const otherParticipant = getOtherParticipant();
  const isProjectGroup = conversation?.isGroup && conversation?.project;
  const displayName = isProjectGroup
    ? (conversation.project?.project_name || conversation.groupName || 'Project Group')
    : (otherParticipant?.name || 'Unknown User');

  // Format last seen or online status
  const getStatusText = () => {
    if (otherParticipant?.isOnline) {
      return typing ? 'typing...' : 'Active now';
    }
    if (otherParticipant?.lastSeen) {
      const lastSeen = new Date(otherParticipant.lastSeen);
      const now = new Date();
      const diff = now - lastSeen;
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (minutes < 1) return 'Active now';
      if (minutes < 60) return `Active ${minutes}m ago`;
      if (hours < 24) return `Active ${hours}h ago`;
      if (days < 7) return `Active ${days}d ago`;
      return 'Offline';
    }
    return null;
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full-10% bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center px-6">
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-secondary/10 rounded-full blur-2xl"></div>
            <svg className="w-20 h-20 mx-auto text-secondary relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  const statusText = getStatusText();

  return (
    <>
      <div className="flex flex-col h-full w-full bg-white overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-white shadow-sm sticky top-0 z-20 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Back to conversations"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Avatar and Info */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-md ${isProjectGroup
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                  : 'bg-gradient-to-br from-secondary to-secondary-700'
                  }`}>
                  {isProjectGroup
                    ? (conversation.project?.project_name?.charAt(0)?.toUpperCase() || conversation.groupName?.charAt(0)?.toUpperCase() || 'P')
                    : (otherParticipant?.name?.charAt(0)?.toUpperCase() || '?')
                  }
                </div>
                {isProjectGroup && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                  </div>
                )}
                {!isProjectGroup && otherParticipant?.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                    {displayName}
                  </h3>
                  {isProjectGroup && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                      Group <span className="ml-1 text-gray-400">({conversation.participants.length}) members</span>
                    </span>
                  )}
                </div>
                {/* Group Members Preview (for groups) */}
                {isProjectGroup && (
                  <div className="flex -space-x-1 mt-0.5 overflow-hidden">
                    {conversation.participants.slice(0, 5).map(p => (
                      <div key={p._id} className="relative w-4 h-4 rounded-full border border-white bg-gray-200 flex items-center justify-center text-[8px]" title={p.name}>
                        {p.name?.charAt(0) || '?'}
                      </div>
                    ))}
                    {conversation.participants.length > 5 && (
                      <div className="relative w-4 h-4 rounded-full border border-white bg-gray-100 flex items-center justify-center text-[8px]">
                        +{conversation.participants.length - 5}
                      </div>
                    )}
                  </div>
                )}

                {statusText && !isProjectGroup && (
                  <p className={`text-xs truncate ${typing ? 'text-secondary font-medium' : 'text-gray-500'}`}>
                    {statusText}
                  </p>
                )}
                {!isProjectGroup && !statusText && (
                  <p className="text-xs text-gray-500 truncate">{otherParticipant?.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* More options could go here */}
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 relative min-h-0 overflow-hidden">
          {/* Messages */}
          <div
            ref={messagesContainerRef}
            data-messages-container
            className="h-full overflow-y-auto p-2 sm:p-3 md:p-4 space-y-1 sm:space-y-2 bg-gradient-to-b from-gray-50 to-white scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
            onScroll={handleScroll}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Spinner size="lg" color="secondary" />
                <p className="mt-3 text-sm text-gray-500">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                {/* ... Empty state ... */}
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-secondary/10 rounded-full blur-xl"></div>
                  <svg className="w-16 h-16 text-secondary relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-700 mb-1">No messages yet</h4>
                <p className="text-sm text-gray-500">Start the conversation{!isProjectGroup && otherParticipant ? ` with ${otherParticipant.name}` : ''}!</p>
              </div>
            ) : (
              <>
                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center py-2">
                    <button
                      onClick={handleLoadMore}
                      className="text-sm text-secondary hover:text-secondary-700 font-medium px-4 py-2 rounded-lg hover:bg-secondary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? (
                        <span className="flex items-center gap-2">
                          <Spinner size="sm" color="secondary" />
                          Loading...
                        </span>
                      ) : (
                        'Load older messages'
                      )}
                    </button>
                  </div>
                )}

                {/* Messages */}
                {messages.map((message, index) => {
                  const prevMessage = messages[index - 1];

                  const showDate = !prevMessage ||
                    new Date(message.createdAt).toDateString() !== new Date(prevMessage.createdAt).toDateString();

                  const isOwn = (message.sender?._id?.toString() || message.sender?.toString()) ===
                    (user?._id?.toString() || user?.id?.toString());

                  return (
                    <React.Fragment key={message._id || index}>
                      {showDate && (
                        <div className="flex justify-center my-6">
                          <span className="bg-white shadow-sm px-4 py-1.5 rounded-full text-xs text-gray-600 font-medium">
                            {new Date(message.createdAt).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                      <MessageBubble
                        message={message}
                        isOwn={isOwn}
                        onReply={() => setReplyTo(message)}
                        onEdit={() => setEditingMessage(message)}
                        onDelete={() => handleDelete(message)}
                        onReact={handleReaction}
                        onReplyInThread={() => handleReplyInThread(message)}
                      />
                    </React.Fragment>
                  );
                })}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to Bottom Button */}
          {showScrollButton && (
            <button
              onClick={() => scrollToBottom('smooth')}
              className="absolute bottom-4 right-4 sm:right-6 p-2 sm:p-3 bg-white shadow-lg rounded-full hover:bg-gray-50 transition-all duration-200 border border-gray-200 z-30"
              aria-label="Scroll to bottom"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 relative z-10">
          <MessageInput
            onSend={handleSendMessage}
            onSendFile={handleSendFile}
            disabled={!conversation}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            editingMessage={editingMessage}
            onCancelEdit={() => setEditingMessage(null)}
          />
        </div>
      </div>

      {/* Thread Panel */}
      {threadMessage && (
        <ThreadPanel
          parentMessage={threadMessage}
          onClose={() => setThreadMessage(null)}
        />
      )}
    </>
  );
};

export default ChatWindow;