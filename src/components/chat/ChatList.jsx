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
        <p className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
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
            className="w-10 h-10 rounded object-cover border border-gray-200 flex-shrink-0"
            loading="lazy"
          />
          <p className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
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
            className="w-10 h-10 rounded object-cover border border-gray-200 flex-shrink-0 bg-black"
            muted
            preload="metadata"
          />
          <p className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
            {message.fileName || tx('video')}
          </p>
        </div>
      );
    }

    return (
      <p className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
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
    <div className={`flex flex-col h-full bg-white relative overflow-hidden ${isRtl ? 'border-l' : 'border-r'} border-gray-200`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-20 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="p-2.5 bg-secondary text-white rounded-lg hover:bg-secondary-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
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
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
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
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
          <div className="mt-3 text-xs text-gray-500">
            {filteredConversations.length} {filteredConversations.length === 1 ? tx('conversation') : tx('conversations')}
            {searchQuery && ` ${tx('found')}`}
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent relative z-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner size="md" color="secondary" />
            <p className="mt-3 text-sm text-gray-500">{tx('loadingConversations')}</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            {searchQuery ? (
              <>
                <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-center font-medium text-gray-600 mb-2">{tx('noConversationsFound')}</p>
                <p className="text-center text-sm text-gray-500">{tx('tryDifferentKeyword')}</p>
              </>
            ) : (
              <>
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-secondary/10 rounded-full blur-xl"></div>
                  <svg className="w-20 h-20 text-secondary relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-700 mb-2">{tx('noConversationsYet')}</h3>
                <p className="text-center text-sm text-gray-500 mb-6 max-w-xs">
                  {tx('chatWithTeam')}
                </p>
                <button
                  onClick={onCreateNew}
                  className="px-6 py-2.5 bg-secondary text-white rounded-lg hover:bg-secondary-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  {tx('startConversation')}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
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
                      ? (isRtl ? 'bg-secondary/10 border-r-4 border-secondary' : 'bg-secondary/10 border-l-4 border-secondary')
                      : (isRtl ? 'hover:bg-gray-50 border-r-4 border-transparent' : 'hover:bg-gray-50 border-l-4 border-transparent')
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ${
                        isGroup 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                          : 'bg-gradient-to-br from-secondary to-secondary-700'
                      }`}>
                        {displayInitial}
                      </div>
                      {isGroup && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
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
                          <h3 className={`font-semibold truncate ${unreadCount > 0 ? 'text-gray-900' : 'text-gray-800'}`}>
                            {displayName}
                          </h3>
                          {isGroup && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                              {tx('group')}
                            </span>
                          )}
                        </div>
                        <span className={`text-xs flex-shrink-0 ml-2 ${unreadCount > 0 ? 'text-secondary font-medium' : 'text-gray-500'}`}>
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {renderLastMessagePreview(conversation, unreadCount)}
                        </div>
                        {unreadCount > 0 && (
                          <span className="bg-secondary text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center flex-shrink-0">
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