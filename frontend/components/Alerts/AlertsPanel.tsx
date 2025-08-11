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
    <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Price Alerts</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {showCreateForm ? 'Cancel' : '+ New Alert'}
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-900/20 border border-red-800 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {showCreateForm && (
        <form onSubmit={handleCreateAlert} className="mb-6 p-4 bg-gray-800 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
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
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>

            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="Price threshold"
              step="0.01"
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            />

            <button
              type="submit"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              Create Alert
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
                className={`p-3 rounded-lg border transition-all duration-300 ${
                  willTrigger
                    ? 'bg-green-900/30 border-green-500 animate-pulse'
                    : alert.triggeredAt
                    ? 'bg-green-900/20 border-green-800'
                    : alert.active
                    ? isVeryClose
                      ? 'bg-yellow-900/30 border-yellow-600 animate-pulse'
                      : isNearThreshold
                      ? 'bg-yellow-900/20 border-yellow-800'
                      : 'bg-gray-800 border-gray-700'
                    : 'bg-gray-900 border-gray-800 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <span className="font-bold text-white">{alert.symbol}</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${
                        alert.type === 'above'
                          ? 'bg-blue-900/50 text-blue-400'
                          : 'bg-red-900/50 text-red-400'
                      }`}>
                        {alert.type} ${alert.threshold.toFixed(2)}
                      </span>
                    </div>
                    
                    {ticker && (
                      <div className="flex items-center space-x-3">
                        <div className="text-sm">
                          <span className="text-gray-400">Current:</span>
                          <span className={`ml-1 font-mono font-bold ${
                            willTrigger ? 'text-green-400' : 
                            isVeryClose ? 'text-yellow-400' : 
                            'text-white'
                          }`}>
                            ${currentPrice.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className={`text-sm px-2 py-1 rounded ${
                          willTrigger ? 'bg-green-900/50 text-green-400' :
                          isVeryClose ? 'bg-yellow-900/50 text-yellow-400 animate-pulse' :
                          isNearThreshold ? 'bg-yellow-900/50 text-yellow-400' :
                          'bg-gray-900 text-gray-400'
                        }`}>
                          {willTrigger ? '🎯 TRIGGERED!' :
                           `${percentAway.toFixed(1)}% away`}
                        </div>
                        
                        {/* Visual Progress Bar */}
                        {!willTrigger && alert.active && (
                          <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                isVeryClose ? 'bg-yellow-400 animate-pulse' :
                                isNearThreshold ? 'bg-yellow-400' :
                                'bg-blue-400'
                              }`}
                              style={{ 
                                width: `${Math.max(0, Math.min(100, 100 - percentAway))}%` 
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {alert.triggeredAt && (
                      <span className="text-xs text-green-400">
                        Triggered
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleAlert(alert.id)}
                      className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                        alert.active
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                      }`}
                    >
                      {alert.active ? 'Active' : 'Inactive'}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="px-3 py-1 bg-red-900/50 hover:bg-red-900 text-red-400 text-sm font-medium rounded transition-colors"
                    >
                      Delete
                    </button>
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