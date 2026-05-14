import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { chatAPI } from '../services/api';
import socketService from '../services/socketService';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
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
      // GET /messages marks read server-side; mirror in list state so badges clear without a full refetch.
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
    const receivedConvId = data.conversationId?.toString();
    const newMsgId = (data?.message?._id ?? data?.message?.id)?.toString();
    if (!receivedConvId || !newMsgId) return;

    setMessages((prev) => {
      const existingMessages = prev[receivedConvId] || [];
      const messageExists = existingMessages.some((msg) => {
        const msgId = (msg._id ?? msg.id)?.toString();
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

    // Refresh previews + unread without toggling global chat loading (avoids list flicker).
    loadConversations({ silent: true });
  }, [loadConversations]);


  const handleMessageUpdated = useCallback((data) => {
    const { conversationId, message } = data;
    const convId = conversationId?.toString();
    const mid = (message?._id ?? message?.id)?.toString();
    if (!convId || !mid) return;

    setMessages((prev) => {
      const existingMessages = prev[convId] || [];
      const updatedMessages = existingMessages.map((msg) =>
        (msg._id ?? msg.id)?.toString() === mid ? { ...msg, ...message } : msg
      );
      return {
        ...prev,
        [convId]: updatedMessages,
      };
    });
  }, []);

  const handleMessageDeleted = useCallback((data) => {
    const { conversationId, messageId } = data;
    const convId = conversationId?.toString();
    const mid = messageId?.toString();
    if (!convId || !mid) return;

    setMessages((prev) => {
      const existingMessages = prev[convId] || [];
      const updatedMessages = existingMessages.map((msg) =>
        (msg._id ?? msg.id)?.toString() === mid
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
    const convId = conversationId?.toString();
    const mid = messageId?.toString();
    if (!convId || !mid) return;

    setMessages((prev) => {
      const existingMessages = prev[convId] || [];
      const updatedMessages = existingMessages.map((msg) =>
        (msg._id ?? msg.id)?.toString() === mid ? { ...msg, reactions } : msg
      );
      return {
        ...prev,
        [convId]: updatedMessages,
      };
    });
  }, []);

  const applyThreadReplyUpdate = useCallback((conversationId, parentMessageId, threadMessage, threadCount) => {
    const convId = conversationId?.toString();
    const parentId = parentMessageId?.toString();
    if (!convId || !parentId) return;

    setMessages(prev => {
      const existingMessages = prev[convId] || [];
      if (!existingMessages.length) return prev;

      const updatedMessages = existingMessages.map((msg) => {
        const msgId = (msg?._id ?? msg?.id)?.toString();
        if (msgId !== parentId) return msg;

        const previousReplies = Array.isArray(msg.threadReplies) ? msg.threadReplies : [];
        const incomingReplyId = (threadMessage?._id ?? threadMessage?.id)?.toString();
        const alreadyIncluded = incomingReplyId
          ? previousReplies.some((r) => (r?._id ?? r?.id)?.toString() === incomingReplyId)
          : false;

        const nextReplies = alreadyIncluded
          ? previousReplies
          : (threadMessage ? [...previousReplies, threadMessage] : previousReplies);

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
    applyThreadReplyUpdate(data.conversationId, data.parentMessageId, data.message, data.threadCount);
  }, [applyThreadReplyUpdate]);

  useEffect(() => {
    if (!user) return undefined;

    loadConversations();

    const token = localStorage.getItem('token');
    if (!token) return undefined;

    const attachChatSocketHandlers = () => {
      socketService.off('new_chat_message', handleNewMessage);
      socketService.off('message_updated', handleMessageUpdated);
      socketService.off('message_deleted', handleMessageDeleted);
      socketService.off('message_reaction_updated', handleReactionUpdated);
      socketService.off('thread_reply', handleThreadReply);
      socketService.off('chat_conversations_changed', handleConversationsChanged);

      socketService.on('new_chat_message', handleNewMessage);
      socketService.on('message_updated', handleMessageUpdated);
      socketService.on('message_deleted', handleMessageDeleted);
      socketService.on('message_reaction_updated', handleReactionUpdated);
      socketService.on('thread_reply', handleThreadReply);
      socketService.on('chat_conversations_changed', handleConversationsChanged);
    };

    const socket = socketService.connect(token);
    attachChatSocketHandlers();
    if (socket) {
      socket.on('connect', attachChatSocketHandlers);
    }

    return () => {
      if (socket) {
        socket.off('connect', attachChatSocketHandlers);
      }
      socketService.off('new_chat_message', handleNewMessage);
      socketService.off('message_updated', handleMessageUpdated);
      socketService.off('message_deleted', handleMessageDeleted);
      socketService.off('message_reaction_updated', handleReactionUpdated);
      socketService.off('thread_reply', handleThreadReply);
      socketService.off('chat_conversations_changed', handleConversationsChanged);
    };
  }, [
    user,
    loadConversations,
    handleNewMessage,
    handleMessageUpdated,
    handleMessageDeleted,
    handleReactionUpdated,
    handleThreadReply,
    handleConversationsChanged,
  ]);

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

      // Add message to local state
      setMessages((prev) => ({
        ...prev,
        [cid]: [...(prev[cid] || []), newMessage],
      }));

      // Update conversation preview locally to avoid full-list refetch on each send.
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

      // Add message to local state
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

    // Load messages if not already loaded (ChatWindow also loads on open — avoids empty state flash).
    if (!messages[convId] || messages[convId].length === 0) {
      await loadMessages(rawId);
    }
  }, [messages, loadMessages, markAsRead]);

  const getOrCreateConversation = useCallback(async (participantId) => {
    try {
      const response = await chatAPI.getOrCreateConversation(participantId);
      const conversation = response.data.conversation;

      // Add to conversations if not exists
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

      // Add to conversations if not exists
      setConversations((prev) => {
        const nid = String(conversation._id ?? conversation.id);
        const exists = prev.some((c) => String(c._id ?? c.id) === nid);
        if (exists) return prev;
        return [conversation, ...prev];
      });

      // Select the conversation
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

  const contextValue = useMemo(() => ({
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
    applyThreadReplyUpdate
  }), [
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
    applyThreadReplyUpdate
  ]);

  return (
    <ChatContext.Provider
      value={contextValue}
    >
      {children}
    </ChatContext.Provider>
  );
};

