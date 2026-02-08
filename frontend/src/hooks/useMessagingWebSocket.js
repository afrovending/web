import { useState, useEffect, useRef, useCallback } from 'react';

const WS_RECONNECT_DELAY = 3000; // 3 seconds
const WS_PING_INTERVAL = 30000; // 30 seconds

/**
 * Custom hook for WebSocket connection to messaging system
 */
export const useMessagingWebSocket = (userId, onMessage) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);

  // Get WebSocket URL from backend URL
  const getWsUrl = useCallback(() => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    // Convert http(s) to ws(s)
    const wsProtocol = backendUrl.startsWith('https') ? 'wss' : 'ws';
    const wsHost = backendUrl.replace(/^https?:\/\//, '');
    return `${wsProtocol}://${wsHost}/api/ws/messages/${userId}`;
  }, [userId]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!userId) return;

    try {
      const wsUrl = getWsUrl();
      console.log('Connecting to WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);

        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, WS_PING_INTERVAL);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle pong (keep-alive response)
          if (data.type === 'pong') {
            return;
          }

          // Forward message to handler
          if (onMessage) {
            onMessage(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        cleanup();

        // Attempt reconnect unless it was a clean close
        if (event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, WS_RECONNECT_DELAY);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection error');
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionError('Failed to connect');
    }
  }, [userId, getWsUrl, onMessage]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    cleanup();
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    setIsConnected(false);
  }, [cleanup]);

  // Send typing indicator
  const sendTyping = useCallback((conversationId, isTyping) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        conversation_id: conversationId,
        is_typing: isTyping
      }));
    }
  }, []);

  // Send read receipt
  const sendReadReceipt = useCallback((conversationId, messageIds) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'read',
        conversation_id: conversationId,
        message_ids: messageIds
      }));
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId, connect, disconnect]);

  return {
    isConnected,
    connectionError,
    sendTyping,
    sendReadReceipt,
    disconnect
  };
};

export default useMessagingWebSocket;
