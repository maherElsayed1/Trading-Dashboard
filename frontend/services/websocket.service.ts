import { Ticker } from '../../shared/types/ticker.types';

export type WebSocketEventType = 'price-update' | 'error' | 'connected' | 'disconnected';

export interface WebSocketEvent {
  type: WebSocketEventType;
  data?: any;
}

export interface PriceUpdateEvent {
  ticker?: Ticker;
  symbol?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  timestamp: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private url: string;
  private subscribers: Map<string, Set<(event: WebSocketEvent) => void>> = new Map();
  private subscribedSymbols: Set<string> = new Set();
  private isIntentionallyClosed = false;

  constructor() {
    this.url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.isIntentionallyClosed = false;
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit({ type: 'connected' });
        
        // Resubscribe to previously subscribed symbols
        if (this.subscribedSymbols.size > 0) {
          const symbols = Array.from(this.subscribedSymbols);
          this.sendMessage('subscribe', { symbols });
        }
        
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'price_update' && data.data) {
            // The data.data contains the price update with symbol, price, etc.
            this.emit({
              type: 'price-update',
              data: {
                ...data.data,
                timestamp: data.timestamp || new Date().toISOString()
              } as PriceUpdateEvent,
            });
          } else if (data.type === 'error') {
            this.emit({
              type: 'error',
              data: data.message || data.error || 'Unknown error',
            });
          } else if (data.type === 'connection') {
            console.log('WebSocket welcome message received:', data.data);
          } else if (data.type === 'subscription_confirmed') {
            console.log('Subscription confirmed:', data.data);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit({ type: 'error', data: 'WebSocket connection error' });
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.emit({ type: 'disconnected' });
        
        if (!this.isIntentionallyClosed) {
          this.attemptReconnect();
        }
      };
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  disconnect() {
    this.isIntentionallyClosed = true;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.subscribedSymbols.clear();
  }

  subscribe(symbol: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected. Will subscribe when connected.');
      this.subscribedSymbols.add(symbol);
      return;
    }

    this.subscribedSymbols.add(symbol);
    this.sendMessage('subscribe', { symbols: [symbol] });
  }

  unsubscribe(symbol: string) {
    this.subscribedSymbols.delete(symbol);
    
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.sendMessage('unsubscribe', { symbols: [symbol] });
  }

  private sendMessage(type: string, data: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return;
    }

    const message = JSON.stringify({ type, data });
    console.log('[WebSocket] Sending message:', message);
    this.ws.send(message);
  }

  on(event: WebSocketEventType, callback: (event: WebSocketEvent) => void) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(event)?.delete(callback);
    };
  }

  private emit(event: WebSocketEvent) {
    const callbacks = this.subscribers.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }

    // Also emit to 'all' subscribers for debugging
    const allCallbacks = this.subscribers.get('*' as WebSocketEventType);
    if (allCallbacks) {
      allCallbacks.forEach(callback => callback(event));
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getSubscribedSymbols(): string[] {
    return Array.from(this.subscribedSymbols);
  }
}

export const websocketService = new WebSocketService();