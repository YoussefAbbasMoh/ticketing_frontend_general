import React, { useEffect, useMemo, useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { chatAPI, getImageUrl } from '../../services/api';
import Spinner from '../ui/Spinner';
import { getStoredLanguage } from '../../i18n';

const TEXT = {
  en: {
    noMessagesYet: 'No messages yet',
    youPrefix: 'You: ',
    message: 'Message',
    photo: '📷 Photo',
    video: '🎥 Video',
    voiceMessage: '🎤 Voice message',
    file: 'File',
    justNow: 'Just now',
    yesterday: 'Yesterday',
    messages: 'Messages',
    projectProcessed: 'Project conversations processed:\nCreated: {{created}}\nUpdated: {{updated}}\nExisting: {{existing}}',
    createProjectError: 'Error creating project conversations. Check console for details.',
    createProjectConversations: 'Create missing project conversations',
    newConversation: 'New conversation',
    startNewConversation: 'Start new conversation',
    searchConversations: 'Search conversations...',
    clearSearch: 'Clear search',
    conversation: 'conversation',
    conversations: 'conversations',
    found: 'found',
    loadingConversations: 'Loading conversations...',
    noConversationsFound: 'No conversations found',
    tryDifferentKeyword: 'Try searching with a different keyword',
    noConversationsYet: 'No conversations yet',
    chatWithTeam: 'Start chatting with your colleagues and collaborators',
    startConversation: 'Start a conversation',
    projectGroup: 'Project Group',
    unknownUser: 'Unknown User',
    group: 'Group',
  },
  ar: {
    noMessagesYet: 'لا توجد رسائل بعد',
    youPrefix: 'أنت: ',
    message: 'رسالة',
    photo: '📷 صورة',
    video: '🎥 فيديو',
    voiceMessage: '🎤 رسالة صوتية',
    file: 'ملف',
    justNow: 'الآن',
    yesterday: 'أمس',
    messages: 'الرسائل',
    projectProcessed: 'تمت معالجة محادثات المشاريع:\nتم الإنشاء: {{created}}\nتم التحديث: {{updated}}\nموجودة مسبقًا: {{existing}}',
    createProjectError: 'حدث خطأ أثناء إنشاء محادثات المشاريع. راجع الـ console.',
    createProjectConversations: 'إنشاء محادثات المشاريع الناقصة',
    newConversation: 'محادثة جديدة',
    startNewConversation: 'ابدأ محادثة جديدة',
    searchConversations: 'ابحث في المحادثات...',
    clearSearch: 'مسح البحث',
    conversation: 'محادثة',
    conversations: 'محادثات',
    found: 'نتيجة',
    loadingConversations: 'جارٍ تحميل المحادثات...',
    noConversationsFound: 'لا توجد محادثات مطابقة',
    tryDifferentKeyword: 'جرّب كلمة بحث مختلفة',
    noConversationsYet: 'لا توجد محادثات بعد',
    chatWithTeam: 'ابدأ الدردشة مع زملائك والمتعاونين',
    startConversation: 'ابدأ محادثة',
    projectGroup: 'مجموعة المشروع',
    unknownUser: 'مستخدم غير معروف',
    group: 'مجموعة',
  },
};

const ChatList = ({ onSelectConversation, onCreateNew }) => {
  const { user, isAdmin } = useAuth();
  const { conversations, loading, activeConversation, loadConversations } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingConversations, setCreatingConversations] = useState(false);
  const [lang, setLang] = useState(getStoredLanguage());
  const isRtl = lang === 'ar';
  const tx = (key, vars = {}) => {
    const template = TEXT[lang]?.[key] || TEXT.en[key] || key;
    return Object.entries(vars).reduce(
      (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
      template
    );
  };

  useEffect(() => {
    const onLanguageChanged = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLanguageChanged);
    return () => window.removeEventListener('language-changed', onLanguageChanged);
  }, []);

  const getOtherParticipant = (conversation) => {
    if (!conversation.participants || conversation.participants.length === 0) return null;
    
    // Get current user ID (handle both _id and id properties)
    const currentUserId = user?._id?.toString() || user?.id?.toString() || user?._id || user?.id;
    
    if (!currentUserId) {
      return conversation.participants[0];
    }
    
    // Find the participant that is NOT the current user
    const other = conversation.participants.find(p => {
      // Handle both populated objects and IDs
      const participantId = p?._id?.toString() || p?._id || p?.toString() || p;
      const matches = participantId && participantId.toString() === currentUserId?.toString();
      return !matches;
    });
    
    // Fallback logic
    if (!other && conversation.participants.length > 1) {
      return conversation.participants.find(p => {
        const participantId = p?._id?.toString() || p?._id || p?.toString() || p;
        return participantId && participantId.toString() !== currentUserId?.toString();
      }) || conversation.participants[0];
    }
    
    return other || (conversation.participants.length === 1 ? conversation.participants[0] : null);
  };

  const formatLastMessage = (conversation) => {
    if (!conversation.lastMessage) return tx('noMessagesYet');
    
    const message = conversation.lastMessage;
    const isSentByMe = message.sender?._id?.toString() === user?._id?.toString() || 
                        message.sender?.toString() === user?._id?.toString();
    const prefix = isSentByMe ? tx('youPrefix') : '';

    switch (message.type) {
      case 'text':
        return `${prefix}${message.content || tx('message')}`;
      case 'image':
        return `${prefix}${tx('photo')}`;
      case 'video':
        return `${prefix}${tx('video')}`;
      case 'voice':
        return `${prefix}${tx('voiceMessage')}`;
      case 'file':
        return `${prefix}📎 ${message.fileName || tx('file')}`;
      default:
        return `${prefix}${tx('message')}`;
    }
  };

  const renderLastMessagePreview = (conversation, unreadCount) => {
    if (!conversation.lastMessage) {
      return (
        <p className={`truncate text-sm ${unreadCount > 0 ? 'font-medium text-app-text' : 'text-app-text-secondary'}`}>
          {tx('noMessagesYet')}
        </p>
      );
    }

    const message = conversation.lastMessage;
    const previewUrl = message.fileUrl ? getImageUrl(message.fileUrl) : '';

    if (message.type === 'image' && previewUrl) {
      return (
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={previewUrl}
            alt={message.fileName || 'Image'}
            className="h-10 w-10 flex-shrink-0 rounded border border-app-border object-cover"
            loading="lazy"
          />
          <p className={`truncate text-sm ${unreadCount > 0 ? 'font-medium text-app-text' : 'text-app-text-secondary'}`}>
            {message.fileName || tx('photo')}
          </p>
        </div>
      );
    }

    if (message.type === 'video' && previewUrl) {
      return (
        <div className="flex items-center gap-2 min-w-0">
          <video
            src={previewUrl}
            className="h-10 w-10 flex-shrink-0 rounded border border-app-border bg-black object-cover"
            muted
            preload="metadata"
          />
          <p className={`truncate text-sm ${unreadCount > 0 ? 'font-medium text-app-text' : 'text-app-text-secondary'}`}>
            {message.fileName || tx('video')}
          </p>
        </div>
      );
    }

    return (
      <p className={`truncate text-sm ${unreadCount > 0 ? 'font-medium text-app-text' : 'text-app-text-secondary'}`}>
        {formatLastMessage(conversation)}
      </p>
    );
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? tx('justNow') : `${minutes}m`;
    } else if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (days === 1) {
      return tx('yesterday');
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Memoize filtered conversations for better performance
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    
    const searchLower = searchQuery.toLowerCase();
    return conversations.filter(conv => {
      // For project groups, search by project name
      if (conv.isGroup && conv.project) {
        return (
          conv.groupName?.toLowerCase().includes(searchLower) ||
          conv.project?.project_name?.toLowerCase().includes(searchLower) ||
          conv.lastMessage?.content?.toLowerCase().includes(searchLower)
        );
      }
      // For 1-on-1 chats, search by participant name/email
      const other = getOtherParticipant(conv);
      return (
        other?.name?.toLowerCase().includes(searchLower) ||
        other?.email?.toLowerCase().includes(searchLower) ||
        conv.lastMessage?.content?.toLowerCase().includes(searchLower)
      );
    });
  }, [conversations, searchQuery, user]);

  // Get active conversation ID for highlighting
  const activeConversationId = activeConversation?._id;

  return (
    <div className={`relative flex h-full flex-col overflow-hidden bg-app-surface ${isRtl ? 'border-l' : 'border-r'} border-app-divider`}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex-shrink-0 border-b border-app-divider bg-app-surface p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-app-text">
            <svg className="h-6 w-6 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {tx('messages')}
          </h2>
          <div className="flex items-center gap-2">
            {isAdmin() && (
              <button
                onClick={async () => {
                  try {
                    setCreatingConversations(true);
                    const response = await chatAPI.createProjectConversations();
                    alert(
                      tx('projectProcessed', {
                        created: response.data.created,
                        updated: response.data.updated,
                        existing: response.data.existing,
                      })
                    );
                    loadConversations();
                  } catch (error) {
                    console.error('Error creating project conversations:', error);
                    alert(tx('createProjectError'));
                  } finally {
                    setCreatingConversations(false);
                  }
                }}
                disabled={creatingConversations}
                className="rounded-lg bg-app-info p-2 text-white shadow-app-soft transition-all duration-200 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                title={tx('createProjectConversations')}
                aria-label={tx('createProjectConversations')}
              >
                {creatingConversations ? (
                  <Spinner size="sm" color="white" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                )}
              </button>
            )}
            <button
              onClick={onCreateNew}
              className="rounded-lg bg-orange p-2.5 text-white shadow-app-soft transition-all duration-200 hover:opacity-95 active:scale-95 transform hover:scale-105"
              title={tx('newConversation')}
              aria-label={tx('startNewConversation')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <svg 
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-app-text-tertiary" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={tx('searchConversations')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-app-input border border-app-border bg-app-surface py-2.5 pl-10 pr-4 text-app-text transition-all duration-200 focus:border-app-primary focus:outline-none focus:ring-2 focus:ring-[#080936]/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 transform text-app-text-tertiary hover:text-app-text"
              aria-label={tx('clearSearch')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Conversations count */}
        {!loading && filteredConversations.length > 0 && (
          <div className="mt-3 text-xs text-app-text-tertiary">
            {filteredConversations.length} {filteredConversations.length === 1 ? tx('conversation') : tx('conversations')}
            {searchQuery && ` ${tx('found')}`}
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="relative z-0 flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-app-border">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner size="md" color="primary" />
            <p className="mt-3 text-sm text-app-text-secondary">{tx('loadingConversations')}</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-app-text-secondary">
            {searchQuery ? (
              <>
                <svg className="mb-4 h-16 w-16 text-app-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="mb-2 text-center font-medium text-app-text">{tx('noConversationsFound')}</p>
                <p className="text-center text-sm text-app-text-secondary">{tx('tryDifferentKeyword')}</p>
              </>
            ) : (
              <>
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-full bg-orange/15 blur-xl" />
                  <svg className="relative h-20 w-20 text-app-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="mb-2 font-semibold text-app-text">{tx('noConversationsYet')}</h3>
                <p className="mb-6 max-w-xs text-center text-sm text-app-text-secondary">
                  {tx('chatWithTeam')}
                </p>
                <button
                  type="button"
                  onClick={onCreateNew}
                  className="min-h-[40px] transform rounded-app-btn bg-app-primary px-6 py-2.5 text-app-on-primary shadow-app-soft transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 hover:shadow-app-card"
                >
                  {tx('startConversation')}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-app-divider">
            {filteredConversations.map((conversation) => {
              const isGroup = conversation.isGroup && conversation.project;
              const displayName = isGroup 
                ? (conversation.project?.project_name || conversation.groupName || tx('projectGroup'))
                : (getOtherParticipant(conversation)?.name || tx('unknownUser'));
              const displayInitial = isGroup 
                ? (conversation.project?.project_name?.charAt(0)?.toUpperCase() || conversation.groupName?.charAt(0)?.toUpperCase() || 'P')
                : (getOtherParticipant(conversation)?.name?.charAt(0)?.toUpperCase() || '?');
              const unreadCount = conversation.unreadCount || 0;
              const isActive = conversation._id === activeConversationId;

              return (
                <button
                  key={conversation._id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`
                    w-full p-4 transition-all duration-200 ${isRtl ? 'text-right' : 'text-left'}
                    ${isActive 
                      ? (isRtl ? 'border-r-4 border-app-primary bg-app-primary/10' : 'border-l-4 border-app-primary bg-app-primary/10')
                      : (isRtl ? 'border-r-4 border-transparent hover:bg-app-surface-variant' : 'border-l-4 border-transparent hover:bg-app-surface-variant')
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white shadow-app-soft ${
                        isGroup 
                          ? 'bg-app-info' 
                          : 'bg-app-primary'
                      }`}>
                        {displayInitial}
                      </div>
                      {isGroup && (
                        <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-app-info">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <h3 className={`truncate font-semibold ${unreadCount > 0 ? 'text-app-text' : 'text-app-text-secondary'}`}>
                            {displayName}
                          </h3>
                          {isGroup && (
                            <span className="flex-shrink-0 rounded-full bg-app-surface-variant px-2 py-0.5 text-xs text-app-text-secondary">
                              {tx('group')}
                            </span>
                          )}
                        </div>
                        <span className={`ml-2 flex-shrink-0 text-xs ${unreadCount > 0 ? 'font-medium text-orange' : 'text-app-text-tertiary'}`}>
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {renderLastMessagePreview(conversation, unreadCount)}
                        </div>
                        {unreadCount > 0 && (
                          <span className="flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full bg-orange px-1.5 text-xs font-bold text-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;