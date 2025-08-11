'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api.service';
import { Ticker } from '../../../shared/types/ticker.types';

interface Alert {
  id: string;
  symbol: string;
  type: 'above' | 'below';
  threshold: number;
  active: boolean;
  triggeredAt?: string;
  createdAt: string;
}

interface AlertsPanelProps {
  tickers: Ticker[];
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ tickers }) => {
  const { isAuthenticated } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [alertType, setAlertType] = useState<'above' | 'below'>('above');
  const [threshold, setThreshold] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchAlerts();
    }
  }, [isAuthenticated]);

  // Add demo alerts in a separate effect
  useEffect(() => {
    if (isAuthenticated && alerts.length === 0 && tickers.length > 0) {
      const timer = setTimeout(() => {
        const demoAlerts: Alert[] = [
          {
            id: 'demo-1',
            symbol: 'AAPL',
            type: 'above',
            threshold: 185.00,
            active: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'demo-2',
            symbol: 'BTC-USD',
            type: 'below',
            threshold: 44000,
            active: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'demo-3',
            symbol: 'TSLA',
            type: 'above',
            threshold: 255.00,
            active: false,
            createdAt: new Date().toISOString(),
          },
        ];
        setAlerts(demoAlerts);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, alerts.length, tickers.length]);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getAlerts();
      setAlerts(data);
    } catch {
      setError('Failed to fetch alerts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSymbol || !threshold) return;

    try {
      const newAlert = await apiService.createAlert(
        selectedSymbol,
        alertType,
        parseFloat(threshold)
      );
      setAlerts([...alerts, newAlert]);
      setShowCreateForm(false);
      setSelectedSymbol('');
      setThreshold('');
    } catch {
      setError('Failed to create alert');
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await apiService.deleteAlert(alertId);
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch {
      setError('Failed to delete alert');
    }
  };

  const handleToggleAlert = async (alertId: string) => {
    try {
      const updatedAlert = await apiService.toggleAlert(alertId);
      setAlerts(alerts.map(a => a.id === alertId ? updatedAlert : a));
    } catch {
      setError('Failed to toggle alert');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Price Alerts</h3>
        <p className="text-gray-400">Please login to manage price alerts</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center">
            <span className="mr-2">🔔</span>
            Price Alerts
          </h3>
          <p className="text-sm text-gray-400 mt-1">Monitor price movements and get notified</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium rounded-lg transition-all transform hover:scale-105 shadow-lg"
        >
          {showCreateForm ? '✕ Cancel' : '+ New Alert'}
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-900/20 border border-red-800 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {showCreateForm && (
        <form onSubmit={handleCreateAlert} className="mb-6 p-5 bg-gradient-to-r from-gray-800/50 to-gray-800/30 rounded-xl border border-gray-700/50 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="px-4 py-2.5 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:bg-gray-900/70 transition-all"
              required
            >
              <option value="">Select ticker</option>
              {tickers.map(ticker => (
                <option key={ticker.symbol} value={ticker.symbol}>
                  {ticker.symbol}
                </option>
              ))}
            </select>

            <select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value as 'above' | 'below')}
              className="px-4 py-2.5 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:bg-gray-900/70 transition-all"
            >
              <option value="above">↗ Above</option>
              <option value="below">↘ Below</option>
            </select>

            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="Price threshold"
              step="0.01"
              className="px-4 py-2.5 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-gray-900/70 transition-all"
              required
            />

            <button
              type="submit"
              className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg transition-all transform hover:scale-105 shadow-lg"
            >
              ✓ Create Alert
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-gray-400">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="text-gray-400">No alerts configured</div>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => {
            const ticker = tickers.find(t => t.symbol === alert.symbol);
            const currentPrice = ticker?.price || 0;
            const distance = currentPrice - alert.threshold;
            const percentAway = Math.abs(distance) / alert.threshold * 100;
            const isNearThreshold = percentAway < 2;
            const isVeryClose = percentAway < 0.5;
            const willTrigger = alert.type === 'above' ? currentPrice >= alert.threshold : currentPrice <= alert.threshold;
            
            return (
              <div
                key={alert.id}
                className={`relative overflow-hidden rounded-xl transition-all duration-300 transform hover:scale-[1.02] ${
                  willTrigger
                    ? 'bg-gradient-to-r from-green-900/40 to-green-800/30 border-green-500/50 shadow-lg shadow-green-500/20'
                    : alert.triggeredAt
                    ? 'bg-gradient-to-r from-gray-800/40 to-gray-800/30 border-green-800/50 opacity-75'
                    : alert.active
                    ? isVeryClose
                      ? 'bg-gradient-to-r from-yellow-900/40 to-yellow-800/30 border-yellow-500/50 shadow-lg shadow-yellow-500/20'
                      : isNearThreshold
                      ? 'bg-gradient-to-r from-gray-800/40 to-gray-800/30 border-yellow-800/50'
                      : 'bg-gradient-to-r from-gray-800/40 to-gray-800/30 border-gray-700/50'
                    : 'bg-gray-900/30 border-gray-800/50 opacity-50'
                } border backdrop-blur-sm`}
              >
                {/* Animated Background for Active Alerts */}
                {willTrigger && (
                  <div className="absolute inset-0 bg-green-500/10 animate-pulse" />
                )}
                {isVeryClose && !willTrigger && alert.active && (
                  <div className="absolute inset-0 bg-yellow-500/10 animate-pulse" />
                )}
                
                <div className="relative p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Symbol and Type Badge */}
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          alert.type === 'above'
                            ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30'
                            : 'bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30'
                        }`}>
                          <span className={`text-lg ${alert.type === 'above' ? 'text-blue-400' : 'text-red-400'}`}>
                            {alert.type === 'above' ? '↗' : '↘'}
                          </span>
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-lg">{alert.symbol}</span>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                              alert.type === 'above'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}>
                              {alert.type === 'above' ? 'ABOVE' : 'BELOW'} ${alert.threshold.toFixed(2)}
                            </span>
                          </div>
                    
                          <p className="text-xs text-gray-400 mt-0.5">
                            Created {new Date(alert.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {ticker && (
                        <div className="flex items-center space-x-4 flex-1">
                          {/* Current Price */}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="text-xs text-gray-400">Current Price</span>
                                <div className={`font-mono font-bold text-lg ${
                                  willTrigger ? 'text-green-400' : 
                                  isVeryClose ? 'text-yellow-400' : 
                                  'text-white'
                                }`}>
                                  ${currentPrice.toFixed(2)}
                                </div>
                              </div>
                              
                              <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                                willTrigger ? 'bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse' :
                                isVeryClose ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse' :
                                isNearThreshold ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                'bg-gray-800/50 text-gray-400 border border-gray-700/30'
                              }`}>
                                {willTrigger ? '🎯 TRIGGERED!' :
                                 `${percentAway.toFixed(1)}% away`}
                              </div>
                            </div>
                            
                            {/* Visual Progress Bar */}
                            {!willTrigger && alert.active && (
                              <div className="relative mt-2">
                                <div className="flex justify-between mb-1">
                                  <span className="text-xs text-gray-500">0%</span>
                                  <span className="text-xs text-gray-500">Threshold</span>
                                </div>
                                <div className="h-2 bg-gray-800/50 rounded-full overflow-hidden border border-gray-700/30">
                                  <div 
                                    className={`h-full transition-all duration-500 ${
                                      isVeryClose ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 animate-pulse' :
                                      isNearThreshold ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                                      'bg-gradient-to-r from-blue-500 to-blue-400'
                                    }`}
                                    style={{ 
                                      width: `${Math.max(0, Math.min(100, 100 - percentAway))}%` 
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {alert.triggeredAt && (
                        <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg">
                          <span className="text-xs font-semibold text-green-400">✓ Triggered</span>
                          <span className="text-xs text-green-300">
                            {new Date(alert.triggeredAt).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleAlert(alert.id)}
                        className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all transform hover:scale-105 ${
                          alert.active
                            ? 'bg-gradient-to-r from-blue-600/80 to-blue-700/80 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg'
                            : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 border border-gray-700/50'
                        }`}
                      >
                        <span className="flex items-center space-x-1">
                          {alert.active ? (
                            <>
                              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                              <span>Paused</span>
                            </>
                          )}
                        </span>
                      </button>
                      
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="px-4 py-2 bg-gradient-to-r from-red-600/30 to-red-700/30 hover:from-red-600/50 hover:to-red-700/50 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 text-sm font-medium rounded-lg transition-all transform hover:scale-105"
                      >
                        <span className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete</span>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};