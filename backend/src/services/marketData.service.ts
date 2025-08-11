import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import { TickerModel } from '../models/ticker.model';
import { PriceUpdate, WSMessage, WSMessageType } from '../../../shared/types/ticker.types';
import { logger } from '../utils/logger';

export class MarketDataService extends EventEmitter {
  private tickerModel: TickerModel;
  private updateInterval: NodeJS.Timeout | null = null;
  private subscribers: Map<string, Set<WebSocket>> = new Map();
  private isMarketOpen: boolean = true;
  private updateFrequency: number = 2000; // 2 seconds default

  constructor() {
    super();
    this.tickerModel = new TickerModel();
    this.initializeSubscriptions();
  }

  private initializeSubscriptions(): void {
    // Initialize subscription sets for each ticker
    const tickers = this.tickerModel.getAllTickers();
    tickers.forEach(ticker => {
      this.subscribers.set(ticker.symbol, new Set());
    });
  }

  startMarketSimulation(): void {
    if (this.updateInterval) {
      return; // Already running
    }

    logger.info('Starting market simulation...');
    
    this.updateInterval = setInterval(() => {
      if (this.isMarketOpen) {
        this.updateAllPrices();
      }
    }, this.updateFrequency);
  }

  stopMarketSimulation(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      logger.info('Market simulation stopped');
    }
  }

  private updateAllPrices(): void {
    const tickers = this.tickerModel.getAllTickers();
    
    tickers.forEach(ticker => {
      // Update more frequently - 80% chance each cycle
      if (Math.random() > 0.2) {
        const updated = this.tickerModel.updatePrice(ticker.symbol);
        if (updated) {
          this.broadcastPriceUpdate(ticker.symbol, updated);
          // Emit event for alert checking
          this.emit('price-update', updated);
        }
      }
    });
  }

  private broadcastPriceUpdate(symbol: string, ticker: any): void {
    const subscribers = this.subscribers.get(symbol);
    if (!subscribers || subscribers.size === 0) return;

    const priceUpdate: PriceUpdate = {
      symbol: ticker.symbol,
      price: ticker.price,
      change: ticker.change,
      changePercent: ticker.changePercent,
      volume: ticker.volume,
      timestamp: ticker.timestamp
    };

    const message: WSMessage = {
      type: WSMessageType.PRICE_UPDATE,
      data: priceUpdate,
      timestamp: new Date().toISOString()
    };

    const messageStr = JSON.stringify(message);
    
    // Broadcasting price update
    
    subscribers.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      } else {
        // Remove closed connections
        subscribers.delete(ws);
      }
    });
  }

  subscribe(symbol: string, ws: WebSocket): boolean {
    const subscribers = this.subscribers.get(symbol);
    if (!subscribers) {
      logger.warn(`Invalid ticker symbol: ${symbol}`);
      return false;
    }

    subscribers.add(ws);
    // Client subscribed
    
    // Send current price immediately
    const ticker = this.tickerModel.getTicker(symbol);
    if (ticker) {
      const priceUpdate: PriceUpdate = {
        symbol: ticker.symbol,
        price: ticker.price,
        change: ticker.change,
        changePercent: ticker.changePercent,
        volume: ticker.volume,
        timestamp: ticker.timestamp
      };

      const message: WSMessage = {
        type: WSMessageType.PRICE_UPDATE,
        data: priceUpdate,
        timestamp: new Date().toISOString()
      };

      ws.send(JSON.stringify(message));
    }

    return true;
  }

  unsubscribe(symbol: string, ws: WebSocket): boolean {
    const subscribers = this.subscribers.get(symbol);
    if (!subscribers) {
      return false;
    }

    const removed = subscribers.delete(ws);
    if (removed) {
      // Client unsubscribed
    }
    
    return removed;
  }

  unsubscribeAll(ws: WebSocket): void {
    this.subscribers.forEach((subscriberSet) => {
      if (subscriberSet.has(ws)) {
        subscriberSet.delete(ws);
        // Client removed from subscribers
      }
    });
  }

  getAllTickers() {
    return this.tickerModel.getAllTickers();
  }

  getTicker(symbol: string) {
    return this.tickerModel.getTicker(symbol);
  }

  getHistoricalData(symbol: string) {
    return this.tickerModel.getHistoricalData(symbol);
  }

  setUpdateFrequency(ms: number): void {
    this.updateFrequency = Math.max(1000, Math.min(10000, ms)); // Between 1-10 seconds
    
    // Restart simulation with new frequency if running
    if (this.updateInterval) {
      this.stopMarketSimulation();
      this.startMarketSimulation();
    }
  }

  setMarketOpen(isOpen: boolean): void {
    this.isMarketOpen = isOpen;
    logger.info(`Market is now ${isOpen ? 'OPEN' : 'CLOSED'}`);
  }

  getMarketStatus() {
    return {
      isOpen: this.isMarketOpen,
      updateFrequency: this.updateFrequency,
      totalSubscriptions: Array.from(this.subscribers.values()).reduce((sum, set) => sum + set.size, 0),
      tickerCount: this.subscribers.size
    };
  }
}