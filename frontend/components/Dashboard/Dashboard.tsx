'use client';

import React, { useState, lazy, Suspense } from 'react';
import { Layout } from '../Layout/Layout';
import { TickerList } from '../TickerList/TickerList';
import { useTickers } from '../../hooks/useTickers';
import { useHistoricalData } from '../../hooks/useHistoricalData';
import { Ticker } from '../../../shared/types/ticker.types';

// Lazy load the chart component to prevent SSR issues
const ChartComponent = lazy(() => 
  import('../Chart/ChartComponent').then(module => ({ default: module.ChartComponent }))
);

export const Dashboard: React.FC = () => {
  const { tickers, loading, error, isConnected } = useTickers();
  const [selectedTicker, setSelectedTicker] = useState<Ticker | null>(null);
  const { data: historicalData, loading: historyLoading } = useHistoricalData(selectedTicker?.symbol || null);

  // Update selected ticker when it changes in the tickers array (real-time updates)
  React.useEffect(() => {
    if (selectedTicker && tickers.length > 0) {
      const updatedTicker = tickers.find(t => t.symbol === selectedTicker.symbol);
      if (updatedTicker && updatedTicker.price !== selectedTicker.price) {
        setSelectedTicker(updatedTicker);
      }
    }
  }, [tickers, selectedTicker]);

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

        {/* Chart Section */}
        {selectedTicker && (
          <div className="space-y-4">
            <div className="bg-blue-900/10 border border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
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
            </div>

            {/* Main Chart Component */}
            {historicalData.length > 0 && (
              <Suspense fallback={
                <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-8">
                  <div className="flex items-center justify-center">
                    <div className="text-gray-400">Loading chart...</div>
                  </div>
                </div>
              }>
                <ChartComponent
                  key={`${selectedTicker.symbol}-chart`}
                  symbol={selectedTicker.symbol}
                  data={historicalData}
                  currentPrice={selectedTicker.price}
                  height={500}
                />
              </Suspense>
            )}
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