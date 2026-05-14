import { io } from 'socket.io-client';

const isDev = import.meta.env?.DEV;

/** Same host as REST API by default; override with VITE_SOCKET_URL if socket is on another origin. */
function resolveSocketBaseUrl() {
  const explicit = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOCKET_URL;
  if (explicit && String(explicit).trim()) {
    return String(explicit).trim().replace(/\/$/, '');
  }
  const api = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL;
  if (api && String(api).trim()) {
    try {
      const u = new URL(String(api).trim().replace(/\/api\/?$/i, ''));
      return u.origin;
    } catch {
      /* fall through */
    }
  }
  return 'https://tickets.absai.dev';
}

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket?.connected) {
      if (isDev) console.log('Socket already connected, reusing...');
      return this.socket;
    }

    if (!token) {
      if (isDev) console.error('No token provided for socket connection');
      return null;
    }

    if (isDev) console.log('Attempting socket connection…');

    const SOCKET_URL = resolveSocketBaseUrl();

    this.socket = io(SOCKET_URL, {
      path: '/socket.io/',
      auth: {
        token: token,
      },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      forceNew: false,
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      if (isDev) console.log('Socket connected');
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      if (isDev) console.log('Socket disconnected, reason:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      const message = error?.message || '';
      const lower = message.toLowerCase();
      const authDenied =
        /not found|unauthorized|forbidden|invalid token|jwt|authentication/i.test(lower) ||
        error?.description === 400;

      if (authDenied && this.socket) {
        try {
          this.socket.io.opts.reconnection = false;
        } catch {
          /* ignore */
        }
        this.socket.disconnect();
        this.socket = null;
        this.isConnected = false;
        return;
      }

      if (isDev) {
        console.error('Socket connection error:', error);
      }
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      if (isDev) console.error('Socket error event:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      try {
        this.socket.io.opts.reconnection = false;
      } catch {
        /* ignore */
      }
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
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
