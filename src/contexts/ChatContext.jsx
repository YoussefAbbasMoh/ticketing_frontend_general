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

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getConversations();
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Load conversations error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId) => {
    try {
      setLoading(true);
      const response = await chatAPI.getMessages(conversationId);
      setMessages(prev => ({
        ...prev,
        [conversationId]: response.data.messages || []
      }));
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNewMessage = useCallback((data) => {
    const receivedConvId = data.conversationId?.toString();
    if (!receivedConvId || !data?.message?._id) return;

    setMessages(prev => {
      const existingMessages = prev[receivedConvId] || [];
      const messageExists = existingMessages.some(msg => {
        const msgId = msg._id?.toString();
        const newMsgId = data.message._id?.toString();
        return msgId === newMsgId;
      });
      if (messageExists) {
        return prev;
      }
      const newMessages = [...existingMessages, data.message];
      return {
        ...prev,
        [receivedConvId]: newMessages
      };
    });

    // Keep conversation list fresh for unread counts + last message preview.
    loadConversations();
  }, [loadConversations]);


  const handleMessageUpdated = useCallback((data) => {
    const { conversationId, message } = data;
    const convId = conversationId?.toString();
    if (!convId || !message?._id) return;

    setMessages(prev => {
      const existingMessages = prev[convId] || [];
      const updatedMessages = existingMessages.map(msg =>
        msg._id === message._id ? { ...msg, ...message } : msg
      );
      return {
        ...prev,
        [convId]: updatedMessages
      };
    });
  }, []);

  const handleMessageDeleted = useCallback((data) => {
    const { conversationId, messageId } = data;
    const convId = conversationId?.toString();
    if (!convId || !messageId) return;

    setMessages(prev => {
      const existingMessages = prev[convId] || [];
      const updatedMessages = existingMessages.map(msg =>
        msg._id === messageId ? { ...msg, isDeleted: true, content: 'This message was deleted', type: 'text', fileUrl: null, reactions: [] } : msg
      );
      return {
        ...prev,
        [convId]: updatedMessages
      };
    });
  }, []);

  const handleReactionUpdated = useCallback((data) => {
    const { conversationId, messageId, reactions } = data;
    const convId = conversationId?.toString();
    if (!convId || !messageId) return;

    setMessages(prev => {
      const existingMessages = prev[convId] || [];
      const updatedMessages = existingMessages.map(msg =>
        msg._id === messageId ? { ...msg, reactions } : msg
      );
      return {
        ...prev,
        [convId]: updatedMessages
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

      const updatedMessages = existingMessages.map(msg => {
        const msgId = msg?._id?.toString();
        if (msgId !== parentId) return msg;

        const previousReplies = Array.isArray(msg.threadReplies) ? msg.threadReplies : [];
        const incomingReplyId = threadMessage?._id?.toString();
        const alreadyIncluded = incomingReplyId
          ? previousReplies.some((r) => r?._id?.toString() === incomingReplyId)
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
    if (user) {
      loadConversations();

      const token = localStorage.getItem('token');
      if (token) {
        const socket = socketService.connect(token);

        const setupListener = () => {
          socketService.on('new_chat_message', handleNewMessage);
          socketService.on('message_updated', handleMessageUpdated);
          socketService.on('message_deleted', handleMessageDeleted);
          socketService.on('message_reaction_updated', handleReactionUpdated);
          socketService.on('thread_reply', handleThreadReply);
        };

        setupListener();

        if (socket) {
          socket.on('connect', () => {
            console.log('Chat socket connected');
            setupListener();
          });
        }
      }

      return () => {
        socketService.off('new_chat_message', handleNewMessage);
        socketService.off('message_updated', handleMessageUpdated);
        socketService.off('message_deleted', handleMessageDeleted);
        socketService.off('message_reaction_updated', handleReactionUpdated);
        socketService.off('thread_reply', handleThreadReply);
      };
    }
  }, [user, loadConversations, handleNewMessage, handleMessageUpdated, handleMessageDeleted, handleReactionUpdated, handleThreadReply]);

  useEffect(() => {
    if (!user) {
      socketService.disconnect();
    }
  }, [user]);

  const sendMessage = useCallback(async (conversationId, content, replyTo = null, mentions = []) => {
    try {
      const response = await chatAPI.sendMessage(conversationId, content, replyTo, mentions);
      const newMessage = response.data.message;

      // Add message to local state
      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), newMessage]
      }));

      // Update conversation preview locally to avoid full-list refetch on each send.
      setConversations(prev => prev.map((conv) => {
        if (conv._id?.toString() !== conversationId?.toString()) return conv;
        return {
          ...conv,
          lastMessage: newMessage,
          lastMessageAt: newMessage.createdAt || new Date().toISOString(),
        };
      }));

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

      // Add message to local state
      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), newMessage]
      }));

      setConversations(prev => prev.map((conv) => {
        if (conv._id?.toString() !== conversationId?.toString()) return conv;
        return {
          ...conv,
          lastMessage: newMessage,
          lastMessageAt: newMessage.createdAt || new Date().toISOString(),
        };
      }));

      return newMessage;
    } catch (error) {
      console.error('Send file message error:', error);
      throw error;
    }
  }, []);

  const selectConversation = useCallback(async (conversation) => {
    // Ensure we have the full conversation object with _id
    if (conversation && conversation._id) {
      setActiveConversation(conversation);

      // Load messages if not already loaded
      const convId = conversation._id.toString();
      if (!messages[convId] || messages[convId].length === 0) {
        await loadMessages(conversation._id);
      }
    } else {
      console.error('Invalid conversation object:', conversation);
    }
  }, [messages, loadMessages]);

  const getOrCreateConversation = useCallback(async (participantId) => {
    try {
      const response = await chatAPI.getOrCreateConversation(participantId);
      const conversation = response.data.conversation;

      // Add to conversations if not exists
      setConversations(prev => {
        const exists = prev.find(c => c._id === conversation._id);
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
      setConversations(prev => {
        const exists = prev.find(c => c._id === conversation._id);
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

  // Get messages for active conversation - use useMemo to ensure reference changes when messages update
  // Create a key based on the messages array length and last message ID to detect changes
  const messagesKey = useMemo(() => {
    if (!activeConversation?._id) return '';
    const convId = activeConversation._id.toString();
    const convMessages = messages[convId] || [];
    return `${convId}-${convMessages.length}-${convMessages[convMessages.length - 1]?._id?.toString() || ''}`;
  }, [activeConversation?._id, messages]);

  const activeMessages = useMemo(() => {
    if (!activeConversation?._id) return [];
    const convId = activeConversation._id.toString();
    return messages[convId] || [];
  }, [activeConversation?._id, messagesKey]);

  const contextValue = useMemo(() => ({
    conversations,
    activeConversation,
    messages: activeMessages,
    loading,
    isOpen,
    setIsOpen,
    loadConversations,
    loadMessages,
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

