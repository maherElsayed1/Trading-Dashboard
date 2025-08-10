'use client';

import React from 'react';
import { Ticker } from '../../../shared/types/ticker.types';
import { TickerCard } from './TickerCard';

interface TickerListProps {
  tickers: Ticker[];
  selectedSymbol?: string;
  onSelectTicker?: (ticker: Ticker) => void;
  loading?: boolean;
  error?: string | null;
}

export const TickerList: React.FC<TickerListProps> = ({
  tickers,
  selectedSymbol,
  onSelectTicker,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-800 rounded-lg p-4 h-48">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
        <p className="font-medium">Error loading tickers</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (tickers.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">No tickers available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {tickers.map(ticker => (
        <TickerCard
          key={ticker.symbol}
          ticker={ticker}
          isSelected={ticker.symbol === selectedSymbol}
          onClick={() => onSelectTicker?.(ticker)}
        />
      ))}
    </div>
  );
};