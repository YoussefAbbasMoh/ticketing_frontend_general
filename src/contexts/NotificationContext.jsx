import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socketService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const audioRef = useRef(null);
  const chatAudioRef = useRef(null);

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
          const notification = {
            id: Date.now(),
            type: 'new_ticket',
            title: 'New Ticket',
            message: data.message || `New ticket ${data.ticket?.ticket} from ${data.ticket?.requested_from}`,
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
                  icon: '/absai-logo.png',
                  badge: '/absai-logo.png',
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
                icon: '/absai-logo.png',
                badge: '/absai-logo.png',
                tag: `ticket-${data.ticket?._id}`,
                requireInteraction: false
              });
            }
          }
        });

        // Listen for ticket reply notifications
        socketService.on('ticket_reply', (data) => {
          const notification = {
            id: Date.now(),
            type: 'ticket_reply',
            title: 'New Reply',
            message: data.message || `New reply on ticket ${data.ticket?.ticket}`,
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
                  icon: '/absai-logo.png',
                  badge: '/absai-logo.png',
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
                icon: '/absai-logo.png',
                badge: '/absai-logo.png',
                tag: `reply-${data.ticket?._id}`,
                requireInteraction: false
              });
            }
          }
        });

        // Listen for ticket assignment notifications
        socketService.on('ticket_assigned', (data) => {
          const notification = {
            id: Date.now(),
            type: 'ticket_assigned',
            title: 'Ticket Assigned',
            message: data.message || `You have been assigned to ticket ${data.ticket?.ticket}`,
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
                  icon: '/absai-logo.png',
                  badge: '/absai-logo.png',
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
                icon: '/absai-logo.png',
                badge: '/absai-logo.png',
                tag: `assigned-${data.ticket?._id}`,
                requireInteraction: false
              });
            }
          }
        });

        // Listen for ticket CC notifications
        socketService.on('ticket_cc', (data) => {
          const notification = {
            id: Date.now(),
            type: 'ticket_cc',
            title: 'Ticket CC',
            message: data.message || `You have been CC'd on ticket ${data.ticket?.ticket}`,
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
                  icon: '/absai-logo.png',
                  badge: '/absai-logo.png',
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
                icon: '/absai-logo.png',
                badge: '/absai-logo.png',
                tag: `cc-${data.ticket?._id}`,
                requireInteraction: false
              });
            }
          }
        });

        // Listen for new chat message notifications
        socketService.on('new_chat_message', (data) => {
          // Don't notify if user sent the message themselves (shouldn't happen, but just in case)
          const currentUserEmail = user?.email?.toLowerCase();
          const senderEmail = data.message?.sender?.email?.toLowerCase();
          if (currentUserEmail && senderEmail === currentUserEmail) {
            return; // Don't notify for own messages
          }

          // Get message content based on type
          let messageContent = '';
          if (data.message?.type === 'text') {
            messageContent = data.message?.content || 'New message';
          } else if (data.message?.type === 'image') {
            messageContent = '📷 Image';
          } else if (data.message?.type === 'video') {
            messageContent = '🎥 Video';
          } else if (data.message?.type === 'voice') {
            messageContent = '🎤 Voice message';
          } else if (data.message?.type === 'file') {
            messageContent = `📎 ${data.message?.fileName || 'File'}`;
          } else {
            messageContent = 'New message';
          }

          const notification = {
            id: Date.now(),
            type: 'chat_message',
            title: 'New Message',
            message: `${data.message?.sender?.name || 'Someone'}: ${messageContent}`,
            conversationId: data.conversationId,
            sender: data.message?.sender,
            timestamp: data.timestamp || new Date(),
            read: false
          };

          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Play chat notification sound (different from ticket sound)
          playChatNotificationSound();

          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            // Use service worker registration if available (for background notifications)
            if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
              navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(notification.title, {
                  body: notification.message,
                  icon: '/absai-logo.png',
                  badge: '/absai-logo.png',
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
              // Fallback to regular notification
              new Notification(notification.title, {
                body: notification.message,
                icon: '/absai-logo.png',
                badge: '/absai-logo.png',
                tag: `chat-${data.conversationId}`,
                requireInteraction: false
              });
            }
          }
        });
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
      socketService.off('new_chat_message');
    };
  }, [user]);

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

