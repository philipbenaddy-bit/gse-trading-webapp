import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

let socket: Socket | null = null;
let socketInitializationFailed = false;

export function getMarketSocket(): Socket | null {
  // If previous initialization failed, don't try again
  if (socketInitializationFailed) {
    return null;
  }

  if (!socket) {
    const { accessToken, isTokenValid, logout } = useAuthStore.getState();
    
    // Ensure we have a valid token before connecting
    if (!accessToken) {
      console.warn('No access token available for socket connection');
      socketInitializationFailed = true;
      return null;
    }
    
    if (!isTokenValid()) {
      console.warn('Access token is expired');
      logout();
      socketInitializationFailed = true;
      return null;
    }

    socket = io('/market', {
      auth: { token: accessToken },
      transports: ['websocket'],
      autoConnect: true,
      timeout: 10000, // 10 second connection timeout
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Market socket connected successfully');
    });

    socket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('Market socket disconnected:', reason);
      
      // If disconnected due to auth issues, logout user
      if (reason === 'io server disconnect') {
        console.warn('Socket disconnected by server, likely auth issue');
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      
      // If connection fails due to auth, logout user
      if (err.message.includes('Authentication')) {
        console.warn('Socket authentication failed, logging out user');
        logout();
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error.message);
      
      // Handle authentication errors
      if (error.message.includes('Authentication') || error.message.includes('Not authenticated')) {
        console.warn('Socket authentication error, logging out user');
        logout();
        disconnectSocket();
      }
    });

    // Handle reconnection with fresh token
    socket.on('reconnect_attempt', () => {
      const currentState = useAuthStore.getState();
      if (currentState.accessToken && currentState.isTokenValid()) {
        socket!.auth = { token: currentState.accessToken };
      } else {
        console.warn('No valid token for reconnection, logging out');
        logout();
        disconnectSocket();
      }
    });
  }
  
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected and cleared');
  }
  // Reset the initialization flag so socket can be recreated on next login
  socketInitializationFailed = false;
}

// Reconnect socket with new token (useful after token refresh or login)
export function reconnectSocket() {
  // Reset the initialization flag
  socketInitializationFailed = false;
  
  if (socket) {
    const { accessToken, isTokenValid } = useAuthStore.getState();
    if (accessToken && isTokenValid()) {
      socket.auth = { token: accessToken };
      socket.connect();
    }
  } else {
    // Try to create a new socket connection
    return getMarketSocket();
  }
}
