'use client';

import React, { useState } from 'react';
import { Layout } from '../Layout/Layout';
import { TickerList } from '../TickerList/TickerList';
import { useTickers } from '../../hooks/useTickers';
import { Ticker } from '../../../shared/types/ticker.types';

export const Dashboard: React.FC = () => {
  const { tickers, loading, error, isConnected } = useTickers();
  const [selectedTicker, setSelectedTicker] = useState<Ticker | null>(null);

  const handleSelectTicker = (ticker: Ticker) => {
    setSelectedTicker(ticker);
  };

  return (
    <Layout isConnected={isConnected}>
      <div className="space-y-6">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Market Overview</h2>
            <p className="text-gray-400 mt-1">
              Track real-time prices across stocks and cryptocurrencies
            </p>
          </div>
          
          {!loading && (
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {tickers.length} Markets
              </div>
              <div className="text-sm text-gray-500">
                Updates every 2s
              </div>
            </div>
          )}
        </div>

        {/* Market Stats */}
        {!loading && tickers.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <p className="text-gray-400 text-sm mb-1">Total Markets</p>
              <p className="text-2xl font-bold text-white">{tickers.length}</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <p className="text-gray-400 text-sm mb-1">Gainers</p>
              <p className="text-2xl font-bold text-green-400">
                {tickers.filter(t => t.price > (t.previousClose || 0)).length}
              </p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <p className="text-gray-400 text-sm mb-1">Losers</p>
              <p className="text-2xl font-bold text-red-400">
                {tickers.filter(t => t.price < (t.previousClose || 0)).length}
              </p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <p className="text-gray-400 text-sm mb-1">Unchanged</p>
              <p className="text-2xl font-bold text-gray-400">
                {tickers.filter(t => t.price === (t.previousClose || 0)).length}
              </p>
            </div>
          </div>
        )}

        {/* Selected Ticker Info */}
        {selectedTicker && (
          <div className="bg-blue-900/10 border border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm mb-1">Selected Market</p>
                <p className="text-xl font-bold text-white">
                  {selectedTicker.symbol} - {selectedTicker.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedTicker(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              Chart view will be available in Phase 6
            </p>
          </div>
        )}

        {/* Ticker List */}
        <TickerList
          tickers={tickers}
          selectedSymbol={selectedTicker?.symbol}
          onSelectTicker={handleSelectTicker}
          loading={loading}
          error={error}
        />

        {/* Connection Status */}
        {!isConnected && !loading && (
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 text-yellow-400">
            <p className="font-medium">WebSocket Disconnected</p>
            <p className="text-sm mt-1">
              Real-time updates are paused. Attempting to reconnect...
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};