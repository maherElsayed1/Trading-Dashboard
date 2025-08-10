import { useState, useEffect } from 'react';
import { HistoricalDataPoint, TickerHistory } from '../../shared/types/ticker.types';
import { apiService } from '../services/api.service';

export function useHistoricalData(symbol: string | null) {
  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setData([]);
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getTickerHistory(symbol);
        
        // Handle the different possible response formats
        if (response) {
          if ('dataPoints' in (response as any)) {
            // Response format: { symbol, interval, dataPoints: [...] }
            setData((response as any).dataPoints || []);
          } else if (Array.isArray(response)) {
            // Direct array of data points
            setData(response as any);
          } else if ('data' in (response as any)) {
            // Wrapped in data property
            setData((response as any).data || []);
          } else {
            setData([]);
          }
        } else {
          setData([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch historical data');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [symbol]);

  return { data, loading, error };
}