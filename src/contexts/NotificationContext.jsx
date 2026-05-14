import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socketService';
import { getStoredLanguage } from '../i18n';
import { decodeJwtPayload } from '../utils/jwt';

const NotificationContext = createContext();

const NOTIFICATION_TEXT = {
  en: {
    newTicketTitle: 'New Ticket',
    newTicketMessage: (ticketNo, sender) => `New ticket ${ticketNo} from ${sender}`,
    ticketReplyTitle: 'New Reply',
    ticketReplyMessage: (ticketNo, sender) => `New reply on ticket ${ticketNo} from ${sender}`,
    ticketReplyMessageCc: (ticketNo) => `New reply on ticket ${ticketNo} (CC)`,
    ticketAssignedTitle: 'Ticket Assigned',
    ticketAssignedMessage: (ticketNo) => `You have been assigned to ticket ${ticketNo}`,
    ticketCcTitle: 'Ticket CC',
    ticketCcMessage: (ticketNo) => `You have been CC'd on ticket ${ticketNo}`,
    newMessageTitle: 'New Message',
    newMessage: 'New message',
    image: 'Image',
    video: 'Video',
    voiceMessage: 'Voice message',
    file: 'File',
    someone: 'Someone',
  },
  ar: {
    newTicketTitle: 'تذكرة جديدة',
    newTicketMessage: (ticketNo, sender) => `تذكرة جديدة ${ticketNo} من ${sender}`,
    ticketReplyTitle: 'رد جديد',
    ticketReplyMessage: (ticketNo, sender) => `رد جديد على التذكرة ${ticketNo} من ${sender}`,
    ticketReplyMessageCc: (ticketNo) => `رد جديد على التذكرة ${ticketNo} (نسخة)`,
    ticketAssignedTitle: 'تم إسناد تذكرة',
    ticketAssignedMessage: (ticketNo) => `تم إسنادك إلى التذكرة ${ticketNo}`,
    ticketCcTitle: 'إشعار نسخة',
    ticketCcMessage: (ticketNo) => `تم إضافتك كنسخة في التذكرة ${ticketNo}`,
    newMessageTitle: 'رسالة جديدة',
    newMessage: 'رسالة جديدة',
    image: 'صورة',
    video: 'فيديو',
    voiceMessage: 'رسالة صوتية',
    file: 'ملف',
    someone: 'شخص',
  },
};

const getTx = () => {
  const lang = getStoredLanguage();
  return NOTIFICATION_TEXT[lang] || NOTIFICATION_TEXT.en;
};

const withLocalizedTicket = (type, data) => {
  const tx = getTx();
  const ticketNo = data.ticket?.ticket || '-';
  const sender = data.ticket?.requested_from || data.reply?.user || tx.someone;

  if (type === 'new_ticket') {
    return {
      title: tx.newTicketTitle,
      message: tx.newTicketMessage(ticketNo, sender),
    };
  }

  if (type === 'ticket_reply') {
    const isCcMessage = String(data.message || '').toLowerCase().includes('(cc)');
    return {
      title: tx.ticketReplyTitle,
      message: isCcMessage
        ? tx.ticketReplyMessageCc(ticketNo)
        : tx.ticketReplyMessage(ticketNo, sender),
    };
  }

  if (type === 'ticket_assigned') {
    return {
      title: tx.ticketAssignedTitle,
      message: tx.ticketAssignedMessage(ticketNo),
    };
  }

  if (type === 'ticket_cc') {
    return {
      title: tx.ticketCcTitle,
      message: tx.ticketCcMessage(ticketNo),
    };
  }

  return {
    title: data.title || '',
    message: data.message || '',
  };
};

const getLocalizedChatMessage = (message) => {
  const tx = getTx();
  const sender = message?.sender?.name || tx.someone;
  const messageType = message?.type;

  let content = tx.newMessage;
  if (messageType === 'text') content = message?.content || tx.newMessage;
  if (messageType === 'image') content = `📷 ${tx.image}`;
  if (messageType === 'video') content = `🎥 ${tx.video}`;
  if (messageType === 'voice') content = `🎤 ${tx.voiceMessage}`;
  if (messageType === 'file') content = `📎 ${message?.fileName || tx.file}`;

  return {
    title: tx.newMessageTitle,
    message: `${sender}: ${content}`,
  };
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const audioRef = useRef(null);
  const chatAudioRef = useRef(null);
  /** Must `off` with the same function reference */
  const chatMessageSocketHandlerRef = useRef(null);
  const removedFromCompanyHandlerRef = useRef(null);

  useEffect(() => {
    // Create audio element for notification sound (tickets)
    audioRef.current = new Audio();
    audioRef.current.src = '/notification-sound.mp3';
    audioRef.current.preload = 'auto';
    
    // Create audio element for chat notification sound
    // Use the same sound file since chat-notification-sound.mp3 doesn't exist
    chatAudioRef.current = new Audio();
    chatAudioRef.current.src = '/notification-sound.mp3';
    chatAudioRef.current.preload = 'auto';
    
    // Handle errors gracefully if sound file fails to load
    audioRef.current.onerror = () => {
      console.warn('Failed to load notification sound');
    };
    chatAudioRef.current.onerror = () => {
      console.warn('Failed to load chat notification sound');
    };
    
    // Fallback: Use Web Audio API for a simple beep if file doesn't exist
    const createBeepSound = (frequency = 800) => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };

    // Play notification sound for tickets
    const playNotificationSound = async () => {
      try {
        if (audioRef.current) {
          audioRef.current.volume = 0.5;
          await audioRef.current.play().catch(() => {
            createBeepSound(800);
          });
        } else {
          createBeepSound(800);
        }
      } catch (error) {
        console.log('Sound play error, using beep:', error);
        createBeepSound(800);
      }
    };

    // Play chat notification sound (different sound)
    const playChatNotificationSound = async () => {
      try {
        if (chatAudioRef.current) {
          chatAudioRef.current.volume = 0.5;
          await chatAudioRef.current.play().catch(() => {
            // Different frequency for chat (higher pitch)
            createBeepSound(1000);
          });
        } else {
          createBeepSound(1000);
        }
      } catch (error) {
        console.log('Chat sound play error, using beep:', error);
        createBeepSound(1000);
      }
    };

    // Connect to socket when user is logged in
    if (user) {
      const token = localStorage.getItem('token');
      if (token) {
        socketService.connect(token);

        // Listen for new ticket notifications
        socketService.on('new_ticket', (data) => {
          const localized = withLocalizedTicket('new_ticket', data);
          const notification = {
            id: Date.now(),
            type: 'new_ticket',
            title: localized.title,
            message: localized.message,
            ticket: data.ticket,
            timestamp: data.timestamp || new Date(),
            read: false
          };

          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Play sound
          playNotificationSound();

          // Show browser notification if permission granted (for mobile/web app)
          if ('Notification' in window && Notification.permission === 'granted') {
            // Use service worker registration if available (for background notifications)
            if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
              navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(notification.title, {
                  body: notification.message,
                  icon: '/logo4.webp',
                  badge: '/logo4.webp',
                  tag: `ticket-${data.ticket?._id}`,
                  requireInteraction: false,
                  data: {
                    type: 'new_ticket',
                    ticketId: data.ticket?._id,
                    url: data.ticket?._id ? `/ticket/${data.ticket._id}` : '/'
                  }
                });
              });
            } else {
              // Fallback to regular notification
              new Notification(notification.title, {
                body: notification.message,
                icon: '/logo4.webp',
                badge: '/logo4.webp',
                tag: `ticket-${data.ticket?._id}`,
                requireInteraction: false
              });
            }
          }
        });

        // Listen for ticket reply notifications
        socketService.on('ticket_reply', (data) => {
          const localized = withLocalizedTicket('ticket_reply', data);
          const notification = {
            id: Date.now(),
            type: 'ticket_reply',
            title: localized.title,
            message: localized.message,
            ticket: data.ticket,
            reply: data.reply,
            timestamp: data.timestamp || new Date(),
            read: false
          };

          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Play sound
          playNotificationSound();

          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            // Use service worker registration if available (for background notifications)
            if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
              navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(notification.title, {
                  body: notification.message,
                  icon: '/logo4.webp',
                  badge: '/logo4.webp',
                  tag: `reply-${data.ticket?._id}`,
                  requireInteraction: false,
                  data: {
                    type: 'ticket_reply',
                    ticketId: data.ticket?._id,
                    url: data.ticket?._id ? `/ticket/${data.ticket._id}` : '/'
                  }
                });
              });
            } else {
              // Fallback to regular notification
              new Notification(notification.title, {
                body: notification.message,
                icon: '/logo4.webp',
                badge: '/logo4.webp',
                tag: `reply-${data.ticket?._id}`,
                requireInteraction: false
              });
            }
          }
        });

        // Listen for ticket assignment notifications
        socketService.on('ticket_assigned', (data) => {
          const localized = withLocalizedTicket('ticket_assigned', data);
          const notification = {
            id: Date.now(),
            type: 'ticket_assigned',
            title: localized.title,
            message: localized.message,
            ticket: data.ticket,
            timestamp: data.timestamp || new Date(),
            read: false
          };

          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Play sound
          playNotificationSound();

          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            // Use service worker registration if available (for background notifications)
            if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
              navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(notification.title, {
                  body: notification.message,
                  icon: '/logo4.webp',
                  badge: '/logo4.webp',
                  tag: `assigned-${data.ticket?._id}`,
                  requireInteraction: false,
                  data: {
                    type: 'ticket_assigned',
                    ticketId: data.ticket?._id,
                    url: data.ticket?._id ? `/ticket/${data.ticket._id}` : '/'
                  }
                });
              });
            } else {
              // Fallback to regular notification
              new Notification(notification.title, {
                body: notification.message,
                icon: '/logo4.webp',
                badge: '/logo4.webp',
                tag: `assigned-${data.ticket?._id}`,
                requireInteraction: false
              });
            }
          }
        });

        // Listen for ticket CC notifications
        socketService.on('ticket_cc', (data) => {
          const localized = withLocalizedTicket('ticket_cc', data);
          const notification = {
            id: Date.now(),
            type: 'ticket_cc',
            title: localized.title,
            message: localized.message,
            ticket: data.ticket,
            timestamp: data.timestamp || new Date(),
            read: false
          };

          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Play sound
          playNotificationSound();

          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            // Use service worker registration if available (for background notifications)
            if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
              navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(notification.title, {
                  body: notification.message,
                  icon: '/logo4.webp',
                  badge: '/logo4.webp',
                  tag: `cc-${data.ticket?._id}`,
                  requireInteraction: false,
                  data: {
                    type: 'ticket_cc',
                    ticketId: data.ticket?._id,
                    url: data.ticket?._id ? `/ticket/${data.ticket._id}` : '/'
                  }
                });
              });
            } else {
              // Fallback to regular notification
              new Notification(notification.title, {
                body: notification.message,
                icon: '/logo4.webp',
                badge: '/logo4.webp',
                tag: `cc-${data.ticket?._id}`,
                requireInteraction: false
              });
            }
          }
        });

        // Listen for new chat message notifications (scoped off so ChatProvider handlers stay registered)
        const onNewChatMessageNotification = (data) => {
          const currentUserId = user?._id != null ? String(user._id) : user?.id != null ? String(user.id) : '';
          const senderId = data.message?.sender?._id != null
            ? String(data.message.sender._id)
            : data.message?.sender?.id != null
              ? String(data.message.sender.id)
              : '';
          if (currentUserId && senderId && currentUserId === senderId) {
            return;
          }
          const currentUserEmail = user?.email?.toLowerCase();
          const senderEmail = data.message?.sender?.email?.toLowerCase();
          if (currentUserEmail && senderEmail === currentUserEmail) {
            return;
          }

          const localized = getLocalizedChatMessage(data.message);

          const notification = {
            id: Date.now(),
            type: 'chat_message',
            title: localized.title,
            message: localized.message,
            conversationId: data.conversationId,
            sender: data.message?.sender,
            timestamp: data.timestamp || new Date(),
            read: false
          };

          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);

          playChatNotificationSound();

          if ('Notification' in window && Notification.permission === 'granted') {
            if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
              navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(notification.title, {
                  body: notification.message,
                  icon: '/logo4.webp',
                  badge: '/logo4.webp',
                  tag: `chat-${data.conversationId}`,
                  requireInteraction: false,
                  data: {
                    type: 'new_chat_message',
                    conversationId: data.conversationId,
                    url: data.conversationId ? `/chat?conversation=${data.conversationId}` : '/chat'
                  }
                });
              });
            } else {
              new Notification(notification.title, {
                body: notification.message,
                icon: '/logo4.webp',
                badge: '/logo4.webp',
                tag: `chat-${data.conversationId}`,
                requireInteraction: false
              });
            }
          }
        };

        if (chatMessageSocketHandlerRef.current) {
          socketService.off('new_chat_message', chatMessageSocketHandlerRef.current);
        }
        chatMessageSocketHandlerRef.current = onNewChatMessageNotification;
        socketService.on('new_chat_message', onNewChatMessageNotification);

        const onRemovedFromCompany = (data) => {
          const cid = data?.companyId != null ? String(data.companyId) : '';
          if (!cid) return;
          let active = '';
          try {
            const tok = localStorage.getItem('token');
            const p = decodeJwtPayload(tok);
            if (p?.companyId != null) active = String(p.companyId);
          } catch {
            /* ignore */
          }
          if (!active && user?.activeCompanyId) {
            active = String(user.activeCompanyId);
          }
          if (active && cid === active) {
            logout();
            const path = (window.location.pathname || '').toLowerCase();
            if (!path.includes('/login')) {
              window.location.href = '/login';
            }
          }
        };
        if (removedFromCompanyHandlerRef.current) {
          socketService.off('removed_from_company', removedFromCompanyHandlerRef.current);
        }
        removedFromCompanyHandlerRef.current = onRemovedFromCompany;
        socketService.on('removed_from_company', onRemovedFromCompany);
      }
    }

    // Request notification permission on mount (for mobile web apps)
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }

    // Cleanup on unmount
    return () => {
      socketService.off('new_ticket');
      socketService.off('ticket_reply');
      socketService.off('ticket_assigned');
      socketService.off('ticket_cc');
      if (chatMessageSocketHandlerRef.current) {
        socketService.off('new_chat_message', chatMessageSocketHandlerRef.current);
        chatMessageSocketHandlerRef.current = null;
      }
      if (removedFromCompanyHandlerRef.current) {
        socketService.off('removed_from_company', removedFromCompanyHandlerRef.current);
        removedFromCompanyHandlerRef.current = null;
      }
    };
  }, [user, logout]);

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

