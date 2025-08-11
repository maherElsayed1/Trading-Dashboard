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
export interface WSMessage {
    type: WSMessageType;
    data?: any;
    error?: string;
    timestamp: string;
}
export declare enum WSMessageType {
    CONNECTION = "connection",
    SUBSCRIBE = "subscribe",
    UNSUBSCRIBE = "unsubscribe",
    PRICE_UPDATE = "price_update",
    ERROR = "error",
    HEARTBEAT = "heartbeat"
}
export interface SubscribeMessage {
    type: WSMessageType.SUBSCRIBE;
    symbols: string[];
}
export interface UnsubscribeMessage {
    type: WSMessageType.UNSUBSCRIBE;
    symbols: string[];
}
//# sourceMappingURL=ticker.types.d.ts.map