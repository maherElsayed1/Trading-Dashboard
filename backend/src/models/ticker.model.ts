import { Ticker, HistoricalDataPoint } from '../../../shared/types/ticker.types';

export interface TickerConfig {
  symbol: string;
  name: string;
  basePrice: number;
  volatility: number; // Daily volatility percentage (e.g., 0.02 for 2%)
  trend: number; // Trend bias (-1 to 1, 0 being neutral)
  minPrice: number;
  maxPrice: number;
  baseVolume: number;
}

export const TICKER_CONFIGS: TickerConfig[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    basePrice: 180.00,
    volatility: 0.015,
    trend: 0.1,
    minPrice: 150,
    maxPrice: 220,
    baseVolume: 75000000
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    basePrice: 250.00,
    volatility: 0.035,
    trend: 0.05,
    minPrice: 180,
    maxPrice: 320,
    baseVolume: 100000000
  },
  {
    symbol: 'BTC-USD',
    name: 'Bitcoin',
    basePrice: 45000.00,
    volatility: 0.04,
    trend: 0.15,
    minPrice: 30000,
    maxPrice: 70000,
    baseVolume: 25000000000
  },
  {
    symbol: 'ETH-USD',
    name: 'Ethereum',
    basePrice: 2500.00,
    volatility: 0.045,
    trend: 0.1,
    minPrice: 1500,
    maxPrice: 4000,
    baseVolume: 15000000000
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    basePrice: 140.00,
    volatility: 0.018,
    trend: 0.08,
    minPrice: 120,
    maxPrice: 170,
    baseVolume: 25000000
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    basePrice: 380.00,
    volatility: 0.012,
    trend: 0.12,
    minPrice: 340,
    maxPrice: 430,
    baseVolume: 30000000
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    basePrice: 150.00,
    volatility: 0.022,
    trend: 0.06,
    minPrice: 120,
    maxPrice: 180,
    baseVolume: 60000000
  },
  {
    symbol: 'SPY',
    name: 'S&P 500 ETF',
    basePrice: 450.00,
    volatility: 0.008,
    trend: 0.07,
    minPrice: 420,
    maxPrice: 480,
    baseVolume: 80000000
  }
];

export class TickerModel {
  private currentPrices: Map<string, Ticker> = new Map();
  private historicalData: Map<string, HistoricalDataPoint[]> = new Map();

  constructor() {
    this.initializeTickers();
    this.generateHistoricalData();
  }

  private initializeTickers(): void {
    TICKER_CONFIGS.forEach(config => {
      const ticker: Ticker = {
        symbol: config.symbol,
        name: config.name,
        price: config.basePrice,
        previousClose: config.basePrice * (1 - Math.random() * 0.02),
        change: 0,
        changePercent: 0,
        volume: Math.floor(config.baseVolume * (0.8 + Math.random() * 0.4)),
        high: config.basePrice * 1.01,
        low: config.basePrice * 0.99,
        timestamp: new Date().toISOString()
      };
      
      ticker.change = ticker.price - ticker.previousClose;
      ticker.changePercent = (ticker.change / ticker.previousClose) * 100;
      
      this.currentPrices.set(config.symbol, ticker);
    });
  }

  private generateHistoricalData(): void {
    const days = 30;
    const now = new Date();
    
    TICKER_CONFIGS.forEach(config => {
      const history: HistoricalDataPoint[] = [];
      let currentPrice = config.basePrice;
      
      for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(9, 30, 0, 0); // Market open
        
        // Generate daily OHLC data
        const dailyVolatility = config.volatility;
        const open = currentPrice;
        const close = this.generateNextPrice(currentPrice, config);
        const high = Math.max(open, close) * (1 + Math.random() * dailyVolatility);
        const low = Math.min(open, close) * (1 - Math.random() * dailyVolatility);
        const volume = Math.floor(config.baseVolume * (0.5 + Math.random()));
        
        history.push({
          timestamp: date.toISOString(),
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume
        });
        
        currentPrice = close;
      }
      
      this.historicalData.set(config.symbol, history);
    });
  }

  private generateNextPrice(currentPrice: number, config: TickerConfig): number {
    const randomWalk = (Math.random() - 0.5) * 2;
    const trendComponent = config.trend * config.volatility;
    const change = currentPrice * config.volatility * (randomWalk + trendComponent);
    
    let newPrice = currentPrice + change;
    
    // Apply bounds
    newPrice = Math.max(config.minPrice, Math.min(config.maxPrice, newPrice));
    
    return parseFloat(newPrice.toFixed(2));
  }

  getAllTickers(): Ticker[] {
    return Array.from(this.currentPrices.values());
  }

  getTicker(symbol: string): Ticker | undefined {
    return this.currentPrices.get(symbol);
  }

  getHistoricalData(symbol: string): HistoricalDataPoint[] {
    return this.historicalData.get(symbol) || [];
  }

  updatePrice(symbol: string): Ticker | undefined {
    const ticker = this.currentPrices.get(symbol);
    const config = TICKER_CONFIGS.find(c => c.symbol === symbol);
    
    if (!ticker || !config) return undefined;
    
    const oldPrice = ticker.price;
    const newPrice = this.generateNextPrice(oldPrice, config);
    
    ticker.previousClose = oldPrice;
    ticker.price = newPrice;
    ticker.change = newPrice - oldPrice;
    ticker.changePercent = (ticker.change / oldPrice) * 100;
    ticker.high = Math.max(ticker.high, newPrice);
    ticker.low = Math.min(ticker.low, newPrice);
    ticker.volume += Math.floor(Math.random() * 1000000);
    ticker.timestamp = new Date().toISOString();
    
    return ticker;
  }
}