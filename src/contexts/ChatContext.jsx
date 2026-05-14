import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { useAuth } from './AuthContext';
import { chatAPI } from '../services/api';
import socketService from '../services/socketService';

const ChatContext = createContext();

const debugChatSocket =
  typeof import.meta !== 'undefined' &&
  String(import.meta.env?.VITE_DEBUG_CHAT_SOCKET || '').toLowerCase() === 'true';

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

/** Normalize conversation id from socket payloads (ObjectId, string, nested). */
const normalizeConversationIdFromSocket = (data) => {
  if (!data || typeof data !== 'object') return '';
  const raw =
    data.conversationId ??
    data.conversation_id ??
    data.message?.conversation ??
    data.message?.conversationId;
  if (raw == null || raw === '') return '';
  return String(raw).trim();
};

const normalizeMessageIdFromSocket = (message) => {
  if (!message || typeof message !== 'object') return '';
  const raw = message._id ?? message.id;
  if (raw == null || raw === '') return '';
  return String(raw).trim();
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const loadConversations = useCallback(async (opts) => {
    const silent = opts && opts.silent === true;
    try {
      if (!silent) setLoading(true);
      const response = await chatAPI.getConversations();
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Load conversations error:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId) => {
    const cid = String(conversationId);
    try {
      const response = await chatAPI.getMessages(conversationId);
      setMessages((prev) => ({
        ...prev,
        [cid]: response.data.messages || [],
      }));
      setConversations((prev) =>
        prev.map((c) =>
          String(c._id ?? c.id) === cid ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (error) {
      console.error('Load messages error:', error);
    }
  }, []);

  const markAsRead = useCallback((conversationId) => {
    const cid = String(conversationId);
    setConversations((prev) =>
      prev.map((c) =>
        String(c._id ?? c.id) === cid ? { ...c, unreadCount: 0 } : c
      )
    );
  }, []);

  const handleConversationsChanged = useCallback(() => {
    loadConversations({ silent: true });
  }, [loadConversations]);

  const handleNewMessage = useCallback((data) => {
    const receivedConvId = normalizeConversationIdFromSocket(data);
    const newMsgId = normalizeMessageIdFromSocket(data?.message);
    if (!receivedConvId) return;
    if (!newMsgId) {
      if (debugChatSocket) {
        // eslint-disable-next-line no-console
        console.warn('[SOCKET RECEIVED] new_chat_message missing message id — skip state merge', data);
      }
      return;
    }

    if (debugChatSocket) {
      // eslint-disable-next-line no-console
      console.log('[SOCKET RECEIVED] new_chat_message', {
        conversationId: receivedConvId,
        messageId: newMsgId,
      });
    }

    setMessages((prev) => {
      const existingMessages = prev[receivedConvId] || [];
      const messageExists = existingMessages.some((msg) => {
        const msgId = normalizeMessageIdFromSocket(msg);
        return msgId === newMsgId;
      });
      if (messageExists) {
        return prev;
      }
      const newMessages = [...existingMessages, data.message];
      return {
        ...prev,
        [receivedConvId]: newMessages,
      };
    });

    loadConversations({ silent: true });
  }, [loadConversations]);

  const handleMessageUpdated = useCallback((data) => {
    const { conversationId, message } = data;
    const convId = conversationId != null ? String(conversationId) : '';
    const mid = normalizeMessageIdFromSocket(message);
    if (!convId || !mid) return;

    if (debugChatSocket) {
      // eslint-disable-next-line no-console
      console.log('[SOCKET RECEIVED] message_updated', { conversationId: convId, messageId: mid });
    }

    setMessages((prev) => {
      const existingMessages = prev[convId] || [];
      const updatedMessages = existingMessages.map((msg) =>
        normalizeMessageIdFromSocket(msg) === mid ? { ...msg, ...message } : msg
      );
      return {
        ...prev,
        [convId]: updatedMessages,
      };
    });
  }, []);

  const handleMessageDeleted = useCallback((data) => {
    const { conversationId, messageId } = data;
    const convId = conversationId != null ? String(conversationId) : '';
    const mid = messageId != null ? String(messageId) : '';
    if (!convId || !mid) return;

    if (debugChatSocket) {
      // eslint-disable-next-line no-console
      console.log('[SOCKET RECEIVED] message_deleted', { conversationId: convId, messageId: mid });
    }

    setMessages((prev) => {
      const existingMessages = prev[convId] || [];
      const updatedMessages = existingMessages.map((msg) =>
        normalizeMessageIdFromSocket(msg) === mid
          ? {
              ...msg,
              isDeleted: true,
              content: 'This message was deleted',
              type: 'text',
              fileUrl: null,
              reactions: [],
            }
          : msg
      );
      return {
        ...prev,
        [convId]: updatedMessages,
      };
    });
  }, []);

  const handleReactionUpdated = useCallback((data) => {
    const { conversationId, messageId, reactions } = data;
    const convId = conversationId != null ? String(conversationId) : '';
    const mid = messageId != null ? String(messageId) : '';
    if (!convId || !mid) return;

    if (debugChatSocket) {
      // eslint-disable-next-line no-console
      console.log('[SOCKET RECEIVED] message_reaction_updated', { conversationId: convId, messageId: mid });
    }

    setMessages((prev) => {
      const existingMessages = prev[convId] || [];
      const updatedMessages = existingMessages.map((msg) =>
        normalizeMessageIdFromSocket(msg) === mid ? { ...msg, reactions } : msg
      );
      return {
        ...prev,
        [convId]: updatedMessages,
      };
    });
  }, []);

  const applyThreadReplyUpdate = useCallback((conversationId, parentMessageId, threadMessage, threadCount) => {
    const convId = conversationId != null ? String(conversationId) : '';
    const parentId = parentMessageId != null ? String(parentMessageId) : '';
    if (!convId || !parentId) return;

    setMessages((prev) => {
      const existingMessages = prev[convId] || [];
      if (!existingMessages.length) return prev;

      const updatedMessages = existingMessages.map((msg) => {
        const msgId = normalizeMessageIdFromSocket(msg);
        if (msgId !== parentId) return msg;

        const previousReplies = Array.isArray(msg.threadReplies) ? msg.threadReplies : [];
        const incomingReplyId = normalizeMessageIdFromSocket(threadMessage);
        const alreadyIncluded = incomingReplyId
          ? previousReplies.some((r) => normalizeMessageIdFromSocket(r) === incomingReplyId)
          : false;

        const nextReplies = alreadyIncluded
          ? previousReplies
          : threadMessage
            ? [...previousReplies, threadMessage]
            : previousReplies;

        return {
          ...msg,
          threadCount: Number(threadCount ?? msg.threadCount ?? nextReplies.length) || 0,
          threadReplies: nextReplies,
        };
      });

      return {
        ...prev,
        [convId]: updatedMessages,
      };
    });
  }, []);

  const handleThreadReply = useCallback((data) => {
    if (!data) return;
    if (debugChatSocket) {
      // eslint-disable-next-line no-console
      console.log('[SOCKET RECEIVED] thread_reply', {
        conversationId: data.conversationId,
        parentMessageId: data.parentMessageId,
      });
    }
    applyThreadReplyUpdate(data.conversationId, data.parentMessageId, data.message, data.threadCount);
  }, [applyThreadReplyUpdate]);

  const handleConversationsChangedStable = useCallback(() => {
    loadConversations({ silent: true });
  }, [loadConversations]);

  const handlersRef = useRef({
    handleNewMessage,
    handleMessageUpdated,
    handleMessageDeleted,
    handleReactionUpdated,
    handleThreadReply,
    handleConversationsChanged: handleConversationsChangedStable,
  });

  useEffect(() => {
    handlersRef.current = {
      handleNewMessage,
      handleMessageUpdated,
      handleMessageDeleted,
      handleReactionUpdated,
      handleThreadReply,
      handleConversationsChanged: handleConversationsChangedStable,
    };
  }, [
    handleNewMessage,
    handleMessageUpdated,
    handleMessageDeleted,
    handleReactionUpdated,
    handleThreadReply,
    handleConversationsChangedStable,
  ]);

  useEffect(() => {
    if (!user) return undefined;

    loadConversations();

    const token = localStorage.getItem('token');
    if (!token) return undefined;

    const onNewChatMessage = (data) => {
      handlersRef.current.handleNewMessage(data);
    };
    const onMessageUpdated = (data) => {
      handlersRef.current.handleMessageUpdated(data);
    };
    const onMessageDeleted = (data) => {
      handlersRef.current.handleMessageDeleted(data);
    };
    const onReactionUpdated = (data) => {
      handlersRef.current.handleReactionUpdated(data);
    };
    const onThreadReply = (data) => {
      handlersRef.current.handleThreadReply(data);
    };
    const onConversationsChanged = () => {
      handlersRef.current.handleConversationsChanged();
    };

    const attachChatSocketHandlers = () => {
      socketService.off('new_chat_message', onNewChatMessage);
      socketService.off('message_updated', onMessageUpdated);
      socketService.off('message_deleted', onMessageDeleted);
      socketService.off('message_reaction_updated', onReactionUpdated);
      socketService.off('thread_reply', onThreadReply);
      socketService.off('chat_conversations_changed', onConversationsChanged);

      socketService.on('new_chat_message', onNewChatMessage);
      socketService.on('message_updated', onMessageUpdated);
      socketService.on('message_deleted', onMessageDeleted);
      socketService.on('message_reaction_updated', onReactionUpdated);
      socketService.on('thread_reply', onThreadReply);
      socketService.on('chat_conversations_changed', onConversationsChanged);
    };

    const socket = socketService.connect(token);
    socketService.attachChatDebugLogging();
    attachChatSocketHandlers();
    if (socket) {
      socket.on('connect', attachChatSocketHandlers);
    }

    return () => {
      if (socket) {
        socket.off('connect', attachChatSocketHandlers);
      }
      socketService.off('new_chat_message', onNewChatMessage);
      socketService.off('message_updated', onMessageUpdated);
      socketService.off('message_deleted', onMessageDeleted);
      socketService.off('message_reaction_updated', onReactionUpdated);
      socketService.off('thread_reply', onThreadReply);
      socketService.off('chat_conversations_changed', onConversationsChanged);
    };
  }, [user, loadConversations]);

  useEffect(() => {
    if (!user) {
      socketService.disconnect();
    }
  }, [user]);

  const sendMessage = useCallback(async (conversationId, content, replyTo = null, mentions = []) => {
    try {
      const response = await chatAPI.sendMessage(conversationId, content, replyTo, mentions);
      const newMessage = response.data.message;
      const cid = String(conversationId);

      setMessages((prev) => ({
        ...prev,
        [cid]: [...(prev[cid] || []), newMessage],
      }));

      setConversations((prev) =>
        prev.map((conv) => {
          const id = String(conv._id ?? conv.id);
          if (id !== cid) return conv;
          return {
            ...conv,
            lastMessage: newMessage,
            lastMessageAt: newMessage.createdAt || new Date().toISOString(),
          };
        })
      );

      return newMessage;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }, []);

  const sendFileMessage = useCallback(async (conversationId, type, file, replyTo = null) => {
    try {
      const response = await chatAPI.sendFileMessage(conversationId, type, file, replyTo);
      const newMessage = response.data.message;
      const cid = String(conversationId);

      setMessages((prev) => ({
        ...prev,
        [cid]: [...(prev[cid] || []), newMessage],
      }));

      setConversations((prev) =>
        prev.map((conv) => {
          const id = String(conv._id ?? conv.id);
          if (id !== cid) return conv;
          return {
            ...conv,
            lastMessage: newMessage,
            lastMessageAt: newMessage.createdAt || new Date().toISOString(),
          };
        })
      );

      return newMessage;
    } catch (error) {
      console.error('Send file message error:', error);
      throw error;
    }
  }, []);

  const selectConversation = useCallback(async (conversation) => {
    const rawId = conversation?._id ?? conversation?.id;
    if (!conversation || rawId == null || rawId === '') {
      console.error('Invalid conversation object:', conversation);
      return;
    }
    const convId = String(rawId);
    setActiveConversation(conversation);
    markAsRead(convId);

    if (!messages[convId] || messages[convId].length === 0) {
      await loadMessages(rawId);
    }
  }, [messages, loadMessages, markAsRead]);

  const getOrCreateConversation = useCallback(async (participantId) => {
    try {
      const response = await chatAPI.getOrCreateConversation(participantId);
      const conversation = response.data.conversation;

      setConversations((prev) => {
        const nid = String(conversation._id ?? conversation.id);
        const exists = prev.some((c) => String(c._id ?? c.id) === nid);
        if (exists) return prev;
        return [conversation, ...prev];
      });

      return conversation;
    } catch (error) {
      console.error('Get or create conversation error:', error);
      throw error;
    }
  }, []);

  const getProjectConversation = useCallback(async (projectId) => {
    try {
      const response = await chatAPI.getProjectConversation(projectId);
      const conversation = response.data.conversation;

      setConversations((prev) => {
        const nid = String(conversation._id ?? conversation.id);
        const exists = prev.some((c) => String(c._id ?? c.id) === nid);
        if (exists) return prev;
        return [conversation, ...prev];
      });

      await selectConversation(conversation);

      return conversation;
    } catch (error) {
      console.error('Get project conversation error:', error);
      throw error;
    }
  }, [selectConversation]);

  const activeMessages = useMemo(() => {
    if (!activeConversation) return [];
    const rawId = activeConversation._id ?? activeConversation.id;
    if (rawId == null || rawId === '') return [];
    const convId = String(rawId);
    return messages[convId] || [];
  }, [activeConversation, messages]);

  const contextValue = useMemo(
    () => ({
      conversations,
      activeConversation,
      messages: activeMessages,
      loading,
      isOpen,
      setIsOpen,
      loadConversations,
      loadMessages,
      markAsRead,
      sendMessage,
      sendFileMessage,
      selectConversation,
      getOrCreateConversation,
      getProjectConversation,
      setActiveConversation,
      applyThreadReplyUpdate,
    }),
    [
      conversations,
      activeConversation,
      activeMessages,
      loading,
      isOpen,
      loadConversations,
      loadMessages,
      markAsRead,
      sendMessage,
      sendFileMessage,
      selectConversation,
      getOrCreateConversation,
      getProjectConversation,
      applyThreadReplyUpdate,
    ]
  );

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>;
};
