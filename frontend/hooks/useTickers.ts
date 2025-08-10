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
    console.log('[useTickers] Subscribing to tickers:', tickers.map(t => t.symbol));
    tickers.forEach(ticker => {
      console.log(`[useTickers] Subscribing to ${ticker.symbol}`);
      subscribe(ticker.symbol);
    });

    // Handle price updates
    const unsubscribePriceUpdate = onPriceUpdate((event: PriceUpdateEvent) => {
      // Handle both possible formats from WebSocket
      const symbol = event.ticker?.symbol || event.symbol;
      const price = event.ticker?.price || event.price;
      
      if (symbol && price) {
        console.log('Price update received:', symbol, '@', price);
        
        setTickers(prevTickers => 
          prevTickers.map(ticker => {
            if (ticker.symbol === symbol) {
              // If we have a full ticker object, use it, otherwise update specific fields
              if (event.ticker) {
                return { ...ticker, ...event.ticker };
              } else {
                return {
                  ...ticker,
                  price: event.price || ticker.price,
                  change: event.change !== undefined ? event.change : ticker.change,
                  changePercent: event.changePercent !== undefined ? event.changePercent : ticker.changePercent,
                  volume: event.volume || ticker.volume,
                  timestamp: event.timestamp || ticker.timestamp
                };
              }
            }
            return ticker;
          })
        );
      }
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