import { Ticker, TickerHistory, MarketStatus } from '../../shared/types/ticker.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiService {
  private async fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getHealth(): Promise<{
    status: string;
    timestamp: string;
    service: string;
    version: string;
    market: MarketStatus;
    websocket: {
      totalConnections: number;
      activeSubscriptions: number;
    };
  }> {
    return this.fetchJson(`${API_BASE_URL}/health`);
  }

  async getTickers(): Promise<Ticker[]> {
    const response = await this.fetchJson<{ success: boolean; data: Ticker[] }>(
      `${API_BASE_URL}/tickers`
    );
    return response.data;
  }

  async getTicker(symbol: string): Promise<Ticker> {
    const response = await this.fetchJson<{ success: boolean; data: Ticker }>(
      `${API_BASE_URL}/tickers/${symbol}`
    );
    return response.data;
  }

  async getTickerHistory(symbol: string, days: number = 30): Promise<TickerHistory[]> {
    const response = await this.fetchJson<{ success: boolean; data: TickerHistory[] }>(
      `${API_BASE_URL}/tickers/${symbol}/history?days=${days}`
    );
    return response.data;
  }

  async getMarketStatus(): Promise<MarketStatus> {
    const response = await this.fetchJson<{ success: boolean; data: MarketStatus }>(
      `${API_BASE_URL}/market/status`
    );
    return response.data;
  }

  async controlMarket(action: 'start' | 'stop' | 'reset'): Promise<MarketStatus> {
    const response = await this.fetchJson<{ success: boolean; data: MarketStatus }>(
      `${API_BASE_URL}/market/control`,
      {
        method: 'POST',
        body: JSON.stringify({ action }),
      }
    );
    return response.data;
  }
}

export const apiService = new ApiService();