import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { chatAPI, getAxiosErrorMessage } from '../../services/api';
import { useMySubscriptionPlan } from '../../hooks/useMySubscriptionPlan';
import { openFreePlanBlockedDialog } from '../../utils/freePlanGate';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import ThreadPanel from './ThreadPanel';
import { ChatMessagesAreaSkeleton, ButtonBusyDots } from '../ui/LoadingSkeletons';
import { useBunnyUpload } from '../../hooks/useBunnyUpload';
import { useIsRtl } from '../../hooks/useIsRtl';
import { getStoredLanguage } from '../../i18n';
import { useToast } from '../../contexts/ToastContext';

const THREAD_SUB = {
  en: {
    groupConversation: 'Group conversation',
    directMessage: 'Direct message',
  },
  ar: {
    groupConversation: 'محادثة جماعية',
    directMessage: 'رسالة مباشرة',
  },
};

const ChatWindow = ({ conversation, onBack }) => {
  const isRtl = useIsRtl();
  const navigate = useNavigate();
  const { toast, alertDialog } = useToast();
  const { user, canSeeSubscriptionNav } = useAuth();
  const companyKey = user?.activeCompanyId ? String(user.activeCompanyId) : 'default';
  const { canUploadChatAttachments } = useMySubscriptionPlan(companyKey);
  const { messages, sendMessage, loadMessages, markAsRead, applyThreadReplyUpdate } = useChat();
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
  const [lang, setLang] = useState(getStoredLanguage());

  useEffect(() => {
    const onLanguageChanged = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLanguageChanged);
    return () => window.removeEventListener('language-changed', onLanguageChanged);
  }, []);

  const txThread = (key) => THREAD_SUB[lang]?.[key] || THREAD_SUB.en[key] || key;

  const conversationId = conversation?._id ?? conversation?.id ?? null;

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      setLoading(true);
      setReplyTo(null);
      setEditingMessage(null);
      if (markAsRead) {
        markAsRead(conversationId);
      }
      loadMessages(conversationId)
        .then(() => {
          setHasMore(true);
          // Scroll to bottom after messages are loaded
          setTimeout(() => {
            scrollToBottom('auto');
          }, 100);
        })
        .finally(() => setLoading(false));
    }
  }, [conversationId, loadMessages, markAsRead]);

  // REST + Socket.IO can land on different serverless instances (e.g. Vercel), so live emits may never
  // arrive; poll lightly while this thread is open. Set VITE_CHAT_MESSAGE_POLL_MS=0 to disable.
  useEffect(() => {
    if (!conversationId) return undefined;
    const raw = import.meta.env?.VITE_CHAT_MESSAGE_POLL_MS;
    if (raw === '0') return undefined;
    const ms =
      raw != null && String(raw).trim() !== ''
        ? parseInt(String(raw), 10)
        : 4000;
    if (!Number.isFinite(ms) || ms <= 0) return undefined;

    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      loadMessages(conversationId);
    }, ms);
    return () => clearInterval(id);
  }, [conversationId, loadMessages]);

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

  const handleGlobalWheel = useCallback((e) => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const target = e.target;
    if (!(target instanceof Element)) return;

    // Let explicitly opted-out areas keep their native wheel behavior.
    if (target.closest('[data-chat-no-global-scroll]')) {
      return;
    }

    // If wheel already happened inside the messages container, keep native behavior.
    if (container.contains(target)) {
      return;
    }

    container.scrollTop += e.deltaY;
    e.preventDefault();
  }, []);

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

    if (!canUploadChatAttachments) {
      openFreePlanBlockedDialog(alertDialog, navigate, canSeeSubscriptionNav());
      return;
    }

    try {
      // Upload directly to Bunny from frontend for all file types.
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
      const msg = getAxiosErrorMessage(error, 'Failed to send file. Please try again.');
      const status = error.response?.status;
      if (
        status === 403 &&
        /free plan|upgrade your subscription|not available on/i.test(msg)
      ) {
        openFreePlanBlockedDialog(alertDialog, navigate, canSeeSubscriptionNav());
      } else {
        toast(msg, { severity: 'error' });
      }
      throw error;
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
  const isGroupChat = Boolean(conversation?.isGroup);
  const displayName = isGroupChat
    ? (
        conversation.groupName?.trim() ||
        conversation.project?.project_name ||
        'Project Group'
      )
    : (otherParticipant?.name || 'Unknown User');
  const threadSubtitle = isGroupChat
    ? txThread('groupConversation')
    : txThread('directMessage');

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
      <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-app-background">
        <div className="px-6 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-app-primary/10 blur-2xl"></div>
            <svg className="relative mx-auto h-20 w-20 text-app-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-lg text-app-text-secondary">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  const statusText = getStatusText();

  return (
    <>
      <div
        className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-app-surface"
        onWheelCapture={handleGlobalWheel}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex flex-shrink-0 items-center justify-between border-b border-app-divider bg-app-surface px-3 py-3 sm:px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="rounded-app-input p-2 transition-colors hover:bg-app-surface-variant"
                aria-label="Back to conversations"
              >
                <svg
                  className={`h-5 w-5 text-app-text-secondary ${isRtl ? '-scale-x-100' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Avatar and Info */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-base font-bold text-white shadow-app-soft sm:h-11 sm:w-11 sm:text-lg ${isProjectGroup
                  ? 'bg-app-info'
                  : 'bg-app-primary'
                  }`}>
                  {isProjectGroup
                    ? (conversation.project?.project_name?.charAt(0)?.toUpperCase() || conversation.groupName?.charAt(0)?.toUpperCase() || 'P')
                    : (otherParticipant?.name?.charAt(0)?.toUpperCase() || '?')
                  }
                </div>
                {isProjectGroup && (
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-app-info">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                  </div>
                )}
                {!isProjectGroup && otherParticipant?.isOnline && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-app-success sm:h-3.5 sm:w-3.5"></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-app-text sm:text-base">
                    {displayName}
                  </h3>
                  {isProjectGroup && (
                    <span className="flex-shrink-0 rounded-full bg-app-surface-variant px-2 py-0.5 text-xs text-app-text-secondary">
                      Group <span className="ml-1 text-app-text-tertiary">({conversation.participants.length}) members</span>
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-app-text-secondary">{threadSubtitle}</p>
                {isProjectGroup && (
                  <div className="mt-0.5 flex -space-x-1 overflow-hidden">
                    {conversation.participants.slice(0, 5).map(p => (
                      <div key={p._id} className="relative flex h-4 w-4 items-center justify-center rounded-full border border-white bg-app-surface-variant text-[8px]" title={p.name}>
                        {p.name?.charAt(0) || '?'}
                      </div>
                    ))}
                    {conversation.participants.length > 5 && (
                      <div className="relative flex h-4 w-4 items-center justify-center rounded-full border border-white bg-app-background text-[8px] text-app-text-secondary">
                        +{conversation.participants.length - 5}
                      </div>
                    )}
                  </div>
                )}

                {statusText && !isGroupChat && (
                  <p className={`truncate text-xs ${typing ? 'font-medium text-orange' : 'text-app-text-secondary'}`}>
                    {statusText}
                  </p>
                )}
                {!isGroupChat && !statusText && (
                  <p className="truncate text-xs text-app-text-secondary">{otherParticipant?.email}</p>
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
            className="h-full space-y-1 overflow-y-auto bg-app-background p-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-app-border sm:space-y-2 sm:p-3 md:p-4"
            onScroll={handleScroll}
          >
            {loading ? (
              <ChatMessagesAreaSkeleton bubbles={7} />
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-app-text-secondary">
                {/* ... Empty state ... */}
                <div className="relative mb-4">
                  <div className="absolute inset-0 rounded-full bg-app-primary/10 blur-xl"></div>
                  <svg className="relative h-16 w-16 text-app-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h4 className="mb-1 font-semibold text-app-text">No messages yet</h4>
                <p className="text-sm text-app-text-secondary">Start the conversation{!isGroupChat && otherParticipant ? ` with ${otherParticipant.name}` : ''}!</p>
              </div>
            ) : (
              <>
                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center py-2">
                    <button
                      onClick={handleLoadMore}
                      className="rounded-app-input px-4 py-2 text-sm font-medium text-orange transition-colors hover:bg-orange/10 hover:text-orange-dark disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? (
                        <span className="flex items-center gap-2">
                          <ButtonBusyDots className="text-orange" />
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
                          <span className="rounded-full border border-app-border bg-app-surface px-4 py-1.5 text-xs font-medium text-app-text-secondary shadow-app-soft">
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
              className="absolute bottom-4 right-4 z-30 rounded-full border border-app-divider bg-app-surface p-2 shadow-app-card transition-all duration-200 hover:bg-app-surface-variant sm:right-6 sm:p-3"
              aria-label="Scroll to bottom"
            >
              <svg className="h-4 w-4 text-app-text-secondary sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 relative z-10" data-chat-no-global-scroll>
          <MessageInput
            onSend={handleSendMessage}
            onSendFile={handleSendFile}
            disabled={!conversation}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            editingMessage={editingMessage}
            onCancelEdit={() => setEditingMessage(null)}
            attachmentsAllowed={canUploadChatAttachments}
            onAttachmentsNotAllowed={() =>
              openFreePlanBlockedDialog(alertDialog, navigate, canSeeSubscriptionNav())
            }
          />
        </div>
      </div>

      {/* Thread Panel */}
      {threadMessage && (
        <ThreadPanel
          parentMessage={threadMessage}
          onThreadReplyCreated={(reply, count) => {
            if (!conversation?._id || !threadMessage?._id) return;
            applyThreadReplyUpdate(conversation._id, threadMessage._id, reply, count);
            setThreadMessage((prev) =>
              prev ? { ...prev, threadCount: Number(count ?? prev.threadCount ?? 0) || 0 } : prev
            );
          }}
          onClose={() => setThreadMessage(null)}
        />
      )}
    </>
  );
};

export default ChatWindow;