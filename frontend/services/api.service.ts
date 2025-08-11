import { Ticker, TickerHistory, MarketStatus, HistoricalDataPoint } from '../../shared/types/ticker.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiService {
  private authToken: string | null = null;

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private async fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
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

  async getTickerHistory(symbol: string, days: number = 30): Promise<any> {
    const response = await this.fetchJson<{ 
      success: boolean; 
      data: {
        symbol: string;
        interval: string;
        dataPoints: HistoricalDataPoint[];
      };
      count: number;
    }>(
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

  // Authentication methods
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const response = await this.fetchJson<{ success: boolean; data: { token: string; user: any } }>(
      `${API_BASE_URL}/auth/login`,
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    return response.data;
  }

  async verifyToken(): Promise<{ user: any }> {
    const response = await this.fetchJson<{ success: boolean; data: { user: any } }>(
      `${API_BASE_URL}/auth/verify`
    );
    return response.data;
  }

  async logout(): Promise<void> {
    await this.fetchJson(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
    });
  }

  // Alert methods
  async getAlerts(): Promise<any[]> {
    const response = await this.fetchJson<{ success: boolean; data: any[] }>(
      `${API_BASE_URL}/alerts`
    );
    return response.data;
  }

  async createAlert(symbol: string, type: 'above' | 'below', threshold: number): Promise<any> {
    const response = await this.fetchJson<{ success: boolean; data: any }>(
      `${API_BASE_URL}/alerts`,
      {
        method: 'POST',
        body: JSON.stringify({ symbol, type, threshold }),
      }
    );
    return response.data;
  }

  async deleteAlert(alertId: string): Promise<void> {
    await this.fetchJson(`${API_BASE_URL}/alerts/${alertId}`, {
      method: 'DELETE',
    });
  }

  async toggleAlert(alertId: string): Promise<any> {
    const response = await this.fetchJson<{ success: boolean; data: any }>(
      `${API_BASE_URL}/alerts/${alertId}/toggle`,
      {
        method: 'PATCH',
      }
    );
    return response.data;
  }
}

export const apiService = new ApiService();