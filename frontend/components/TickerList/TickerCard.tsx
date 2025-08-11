'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { Ticker } from '../../../shared/types/ticker.types';

interface TickerCardProps {
  ticker: Ticker;
  isSelected?: boolean;
  onClick?: () => void;
}

export const TickerCard: React.FC<TickerCardProps> = ({ ticker, isSelected, onClick }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  // Flash effect when price updates
  useEffect(() => {
    setIsUpdating(true);
    const timer = setTimeout(() => setIsUpdating(false), 500);
    return () => clearTimeout(timer);
  }, [ticker.price]);
  const priceChangePercent = useMemo(() => {
    if (!ticker.previousClose || ticker.previousClose === 0) return 0;
    return ((ticker.price - ticker.previousClose) / ticker.previousClose) * 100;
  }, [ticker.price, ticker.previousClose]);

  const priceChange = useMemo(() => {
    if (!ticker.previousClose) return 0;
    return ticker.price - ticker.previousClose;
  }, [ticker.price, ticker.previousClose]);

  const isPositive = priceChange >= 0;

  const formatPrice = (price: number) => {
    if (ticker.symbol.includes('USD')) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: ticker.symbol.includes('BTC') || ticker.symbol.includes('ETH') ? 2 : 2,
      }).format(price);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative p-4 rounded-lg border transition-all duration-200 cursor-pointer
        ${isSelected 
          ? 'bg-blue-900/20 border-blue-500 shadow-lg shadow-blue-500/20' 
          : 'bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 hover:border-gray-700'
        }
        ${isUpdating ? 'ring-2 ring-yellow-500/50 bg-yellow-900/10' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-white">{ticker.symbol}</h3>
          <p className="text-sm text-gray-400">{ticker.name}</p>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          ticker.symbol.includes('-USD') 
            ? 'bg-purple-900/30 text-purple-400 border border-purple-800' 
            : 'bg-blue-900/30 text-blue-400 border border-blue-800'
        }`}>
          {ticker.symbol.includes('-USD') ? 'CRYPTO' : 'STOCK'}
        </div>
      </div>

      {/* Price and Change */}
      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold text-white">
              {formatPrice(ticker.price)}
            </div>
            <div className={`flex items-center space-x-2 text-sm ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              <span>{isPositive ? '▲' : '▼'}</span>
              <span>{isPositive ? '+' : ''}{priceChange.toFixed(2)}</span>
              <span>({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)</span>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800">
          <div>
            <p className="text-xs text-gray-500">High</p>
            <p className="text-sm font-medium text-gray-300">{formatPrice(ticker.high)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Low</p>
            <p className="text-sm font-medium text-gray-300">{formatPrice(ticker.low)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Volume</p>
            <p className="text-sm font-medium text-gray-300">{formatVolume(ticker.volume)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">24h High</p>
            <p className="text-sm font-medium text-gray-300">
              ${ticker.high.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Last Update Indicator */}
      <div className="absolute top-2 right-2">
        <div className={`w-2 h-2 rounded-full ${
          isUpdating 
            ? 'bg-yellow-500 animate-pulse' 
            : 'bg-green-500 animate-ping'
        }`} />
      </div>
    </div>
  );
};