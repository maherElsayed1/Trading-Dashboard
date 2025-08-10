import { useEffect, useState, useCallback, useRef } from 'react';
import { websocketService, WebSocketEvent, PriceUpdateEvent } from '../services/websocket.service';

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cleanupFunctions = useRef<Array<() => void>>([]);

  useEffect(() => {
    const unsubscribeConnected = websocketService.on('connected', () => {
      setIsConnected(true);
      setError(null);
      onConnect?.();
    });

    const unsubscribeDisconnected = websocketService.on('disconnected', () => {
      setIsConnected(false);
      onDisconnect?.();
    });

    const unsubscribeError = websocketService.on('error', (event: WebSocketEvent) => {
      const errorMessage = event.data || 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
    });

    cleanupFunctions.current = [
      unsubscribeConnected,
      unsubscribeDisconnected,
      unsubscribeError,
    ];

    if (autoConnect) {
      websocketService.connect().catch(err => {
        setError(err.message || 'Failed to connect');
      });
    }

    return () => {
      cleanupFunctions.current.forEach(cleanup => cleanup());
    };
  }, [autoConnect, onConnect, onDisconnect, onError]);

  const connect = useCallback(() => {
    return websocketService.connect();
  }, []);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  const subscribe = useCallback((symbol: string) => {
    websocketService.subscribe(symbol);
  }, []);

  const unsubscribe = useCallback((symbol: string) => {
    websocketService.unsubscribe(symbol);
  }, []);

  const onPriceUpdate = useCallback((callback: (data: PriceUpdateEvent) => void) => {
    return websocketService.on('price-update', (event: WebSocketEvent) => {
      if (event.data) {
        callback(event.data as PriceUpdateEvent);
      }
    });
  }, []);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    onPriceUpdate,
  };
}