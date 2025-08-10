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
    const now = new Date('2025-08-11T16:00:00'); // Today at market close
    
    TICKER_CONFIGS.forEach(config => {
      const history: HistoricalDataPoint[] = [];
      let currentPrice = config.basePrice;
      
      // Generate daily data for the past 30 days
      for (let day = 30; day > 1; day--) {
        const date = new Date(now);
        date.setDate(date.getDate() - day);
        date.setHours(9, 30, 0, 0); // Market open
        
        // Generate 4-hour candles for each day (9:30 AM to 4:00 PM)
        for (let hour = 0; hour < 7; hour += 4) {
          const candleTime = new Date(date);
          candleTime.setHours(9 + hour, 30, 0, 0);
          
          const dailyVolatility = config.volatility;
          const open = currentPrice;
          const close = this.generateNextPrice(currentPrice, config);
          const high = Math.max(open, close) * (1 + Math.random() * dailyVolatility * 0.5);
          const low = Math.min(open, close) * (1 - Math.random() * dailyVolatility * 0.5);
          const volume = Math.floor(config.baseVolume * (0.3 + Math.random() * 0.4));
          
          history.push({
            timestamp: candleTime.toISOString(),
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            volume
          });
          
          currentPrice = close;
        }
      }
      
      // Generate more granular data for today (15-minute candles)
      const today = new Date(now);
      today.setHours(9, 30, 0, 0);
      
      for (let minutes = 0; minutes < 390; minutes += 15) { // 6.5 hours of trading
        const candleTime = new Date(today);
        candleTime.setMinutes(candleTime.getMinutes() + minutes);
        
        const intraVolatility = config.volatility * 0.3;
        const open = currentPrice;
        const close = this.generateNextPrice(currentPrice, config);
        const high = Math.max(open, close) * (1 + Math.random() * intraVolatility);
        const low = Math.min(open, close) * (1 - Math.random() * intraVolatility);
        const volume = Math.floor(config.baseVolume * (0.1 + Math.random() * 0.2));
        
        history.push({
          timestamp: candleTime.toISOString(),
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume
        });
        
        currentPrice = close;
      }
      
      // Store the current price as the latest for real-time continuity
      const ticker = this.currentPrices.get(config.symbol);
      if (ticker) {
        ticker.price = currentPrice;
        ticker.previousClose = history[history.length - 2]?.close || currentPrice;
        ticker.high = Math.max(...history.slice(-26).map(h => h.high));
        ticker.low = Math.min(...history.slice(-26).map(h => h.low));
      }
      
      this.historicalData.set(config.symbol, history);
    });
  }

  private generateNextPrice(currentPrice: number, config: TickerConfig): number {
    // More realistic price movement with momentum
    const momentum = (Math.random() - 0.5) * 0.3; // Smaller, more realistic movements
    const noise = (Math.random() - 0.5) * 0.1; // Market noise
    const trendComponent = config.trend * 0.01; // Subtle trend
    
    // Calculate change as a percentage (more realistic for different price ranges)
    const changePercent = (momentum + noise + trendComponent) * config.volatility;
    const change = currentPrice * changePercent;
    
    let newPrice = currentPrice + change;
    
    // Apply mean reversion if price moves too far from base
    const deviation = (newPrice - config.basePrice) / config.basePrice;
    if (Math.abs(deviation) > 0.2) {
      // Pull back toward base price
      newPrice = newPrice - (deviation * config.basePrice * 0.05);
    }
    
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
    
    // Keep track of daily high/low
    const todayStart = new Date();
    todayStart.setHours(9, 30, 0, 0);
    
    // Update ticker with realistic changes
    ticker.price = newPrice;
    ticker.change = newPrice - ticker.previousClose;
    ticker.changePercent = (ticker.change / ticker.previousClose) * 100;
    ticker.high = Math.max(ticker.high, newPrice);
    ticker.low = Math.min(ticker.low, newPrice);
    ticker.volume += Math.floor(Math.random() * 100000 + 50000); // More realistic volume
    ticker.timestamp = new Date().toISOString();
    
    return ticker;
  }
}