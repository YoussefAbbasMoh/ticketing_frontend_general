import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log('Socket already connected, reusing...');
      return this.socket;
    }

    if (!token) {
      console.error('No token provided for socket connection');
      return null;
    }

    console.log('Attempting socket connection with token:', token.substring(0, 20) + '...');

    // Use the same domain - Socket.io will use /socket.io/ path
    // If Nginx is configured correctly, this will work
    const SOCKET_URL = 'https://tickets.absai.dev';
    
    this.socket = io(SOCKET_URL, {
      path: '/socket.io/', // Socket.io default path
      auth: {
        token: token
      },
      transports: ['polling', 'websocket'], // Try polling first (more reliable), then upgrade to websocket
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity, // Keep trying to reconnect
      forceNew: false,
      upgrade: true,
      rememberUpgrade: true, // Remember websocket upgrade
      timeout: 20000, // 20 second timeout
     // Limit reconnection attempts
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected, reason:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      console.error('Error details:', {
        message: error.message,
        type: error.type,
        description: error.description
      });
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error event:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      // If socket not created yet, create it first
      const token = localStorage.getItem('token');
      if (token) {
        this.connect(token);
        if (this.socket) {
          this.socket.on(event, callback);
        }
      }
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }
}

export default new SocketService();

