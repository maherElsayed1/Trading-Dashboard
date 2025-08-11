// Shared types for ticker data used by both frontend and backend

export interface Ticker {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  timestamp: string;
}

export interface TickerHistory {
  symbol: string;
  data: HistoricalDataPoint[];
}

export interface MarketStatus {
  isOpen: boolean;
  updateFrequency: number;
  totalSubscriptions: number;
  tickerCount: number;
}

export interface HistoricalDataPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

// WebSocket message types
export interface WSMessage {
  type: WSMessageType;
  data?: any;
  error?: string;
  timestamp: string;
}

export enum WSMessageType {
  CONNECTION = 'connection',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  PRICE_UPDATE = 'price_update',
  ERROR = 'error',
  HEARTBEAT = 'heartbeat',
  ALERT = 'alert'
}

export interface SubscribeMessage {
  type: WSMessageType.SUBSCRIBE;
  symbols: string[];
}

export interface UnsubscribeMessage {
  type: WSMessageType.UNSUBSCRIBE;
  symbols: string[];
}