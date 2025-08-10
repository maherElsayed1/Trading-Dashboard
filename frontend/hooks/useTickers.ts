import { useState, useEffect, useCallback } from 'react';
import { Ticker } from '../../shared/types/ticker.types';
import { apiService } from '../services/api.service';
import { useWebSocket } from './useWebSocket';
import { PriceUpdateEvent } from '../services/websocket.service';

export function useTickers() {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { subscribe, unsubscribe, onPriceUpdate, isConnected } = useWebSocket();

  // Fetch initial ticker data
  useEffect(() => {
    const fetchTickers = async () => {
      try {
        setLoading(true);
        const data = await apiService.getTickers();
        setTickers(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tickers');
      } finally {
        setLoading(false);
      }
    };

    fetchTickers();
  }, []);

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (!isConnected || tickers.length === 0) return;

    // Subscribe to all tickers
    tickers.forEach(ticker => {
      subscribe(ticker.symbol);
    });

    // Handle price updates
    const unsubscribePriceUpdate = onPriceUpdate((event: PriceUpdateEvent) => {
      setTickers(prevTickers => 
        prevTickers.map(ticker => 
          ticker.symbol === event.ticker.symbol
            ? { ...ticker, ...event.ticker }
            : ticker
        )
      );
    });

    return () => {
      // Unsubscribe from all tickers
      tickers.forEach(ticker => {
        unsubscribe(ticker.symbol);
      });
      unsubscribePriceUpdate();
    };
  }, [isConnected, tickers.length, subscribe, unsubscribe, onPriceUpdate]);

  const refreshTickers = useCallback(async () => {
    try {
      const data = await apiService.getTickers();
      setTickers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh tickers');
    }
  }, []);

  return {
    tickers,
    loading,
    error,
    refreshTickers,
    isConnected,
  };
}