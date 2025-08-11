'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  LineData, 
  ChartOptions, 
  DeepPartial, 
  IPriceLine,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  ColorType,
  Time
} from 'lightweight-charts';
import { HistoricalDataPoint } from '../../../shared/types/ticker.types';

interface ChartComponentProps {
  symbol: string;
  data: HistoricalDataPoint[];
  currentPrice?: number;
  onTimeframeChange?: (timeframe: string) => void;
  height?: number;
}

type ChartType = 'candlestick' | 'line' | 'area';
type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

export const ChartComponent: React.FC<ChartComponentProps> = ({
  symbol,
  data,
  currentPrice,
  onTimeframeChange,
  height = 400
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick' | 'Line' | 'Area'> | null>(null);
  const priceLineRef = useRef<IPriceLine | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const currentCandleRef = useRef<{ time: number; open: number; high: number; low: number; close: number } | null>(null);
  
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Convert data to TradingView format
  const formatDataForChart = (rawData: HistoricalDataPoint[]): (CandlestickData | LineData)[] => {
    return rawData.map(point => {
      // Ensure time is a number (Unix timestamp in seconds)
      const timestamp = Math.floor(new Date(point.timestamp).getTime() / 1000);
      
      if (chartType === 'candlestick') {
        return {
          time: timestamp,
          open: point.open,
          high: point.high,
          low: point.low,
          close: point.close,
        } as CandlestickData;
      } else {
        return {
          time: timestamp,
          value: point.close,
        } as LineData;
      }
    }).sort((a, b) => (a.time as number) - (b.time as number));
  };

  // Filter data based on timeframe
  const filterDataByTimeframe = (allData: HistoricalDataPoint[]): HistoricalDataPoint[] => {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeframe) {
      case '1D':
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case '1W':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'ALL':
      default:
        return allData;
    }
    
    return allData.filter(point => new Date(point.timestamp) >= cutoffDate);
  };

  // Initialize chart only once when component mounts
  useEffect(() => {
    if (!chartContainerRef.current) return;

    setIsLoading(true);

    const chartOptions: DeepPartial<ChartOptions> = {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: '#4b5563',
          style: 2,
        },
        horzLine: {
          width: 1,
          color: '#4b5563',
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
    };

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
      height: height,
    });
    
    chartRef.current = chart;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    setIsLoading(false);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]); // Only recreate if height changes

  // Update series when chart type or data changes
  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    // Reset current candle when changing chart type, symbol, or timeframe
    currentCandleRef.current = null;

    // Remove old series if exists
    if (seriesRef.current) {
      chartRef.current.removeSeries(seriesRef.current);
      seriesRef.current = null;
    }

    // Add new series based on chart type
    let series: ISeriesApi<'Candlestick' | 'Line' | 'Area'>;
    const filteredData = filterDataByTimeframe(data);
    const formattedData = formatDataForChart(filteredData);
    
    // Track the last data point time for real-time updates
    if (formattedData.length > 0) {
      const lastPoint = formattedData[formattedData.length - 1];
      lastUpdateTimeRef.current = lastPoint.time as number;
    }
    
    // Reset current candle when data changes
    currentCandleRef.current = null;

    switch (chartType) {
      case 'candlestick':
        series = chartRef.current.addSeries(CandlestickSeries, {
          upColor: '#10b981',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
        });
        break;
      case 'area':
        series = chartRef.current.addSeries(AreaSeries, {
          lineColor: '#3b82f6',
          topColor: 'rgba(59, 130, 246, 0.3)',
          bottomColor: 'rgba(59, 130, 246, 0.05)',
          lineWidth: 2,
        });
        break;
      case 'line':
      default:
        series = chartRef.current.addSeries(LineSeries, {
          color: '#3b82f6',
          lineWidth: 2,
        });
        break;
    }

    series.setData(formattedData);
    seriesRef.current = series;

    // Fit content
    chartRef.current.timeScale().fitContent();
  }, [data, chartType, timeframe]); // Remove currentPrice from deps to prevent recreation

  // Add real-time price updates to the chart - SIMPLIFIED WITH PROPER TIMESTAMPS
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || currentPrice === undefined || currentPrice === null) {
      return;
    }
    
    try {
      const now = Math.floor(Date.now() / 1000);
      
      if (chartType === 'candlestick') {
        const candleInterval = 15; // 15 second candles
        const currentPeriod = Math.floor(now / candleInterval) * candleInterval;
        
        // Initialize or update candle
        if (!currentCandleRef.current || currentCandleRef.current.time < currentPeriod) {
          // Need a new candle
          // New candle created
          
          currentCandleRef.current = {
            time: currentPeriod,
            open: currentPrice,
            high: currentPrice,
            low: currentPrice,
            close: currentPrice,
          };
          
          // Add new candle
          try {
            seriesRef.current.update({
              time: currentPeriod as Time,
              open: currentPrice,
              high: currentPrice,
              low: currentPrice,
              close: currentPrice,
            });
          } catch (err) {
            // Error adding new candle
          }
          
        } else if (currentCandleRef.current.time === currentPeriod) {
          // Update existing candle
          const oldHigh = currentCandleRef.current.high;
          const oldLow = currentCandleRef.current.low;
          const oldClose = currentCandleRef.current.close;
          
          currentCandleRef.current.high = Math.max(currentCandleRef.current.high, currentPrice);
          currentCandleRef.current.low = Math.min(currentCandleRef.current.low, currentPrice);
          currentCandleRef.current.close = currentPrice;
          
          // Only log and update if values changed
          if (oldHigh !== currentCandleRef.current.high || 
              oldLow !== currentCandleRef.current.low || 
              oldClose !== currentCandleRef.current.close) {
            // Update existing candle
            
            try {
              seriesRef.current.update({
                time: currentPeriod as Time,
                open: currentCandleRef.current.open,
                high: currentCandleRef.current.high,
                low: currentCandleRef.current.low,
                close: currentCandleRef.current.close,
              });
            } catch (err) {
              // Error updating candle
            }
          }
        }
        
      } else {
        // For line/area charts, add new point with unique timestamp
        const updateTime = Math.max(now, lastUpdateTimeRef.current + 1);
        lastUpdateTimeRef.current = updateTime;
        
        const lineData: LineData = {
          time: updateTime as Time,
          value: currentPrice,
        };
        seriesRef.current.update(lineData);
      }
      
      // Don't show price line indicators anymore
      // Just keep the price line reference clean
      if (priceLineRef.current) {
        try {
          seriesRef.current.removePriceLine(priceLineRef.current);
          priceLineRef.current = null;
        } catch {
          // Ignore if price line doesn't exist
        }
      }
      
      // Auto-scroll to the latest data and force a redraw
      if (chartRef.current) {
        chartRef.current.timeScale().scrollToRealTime();
        // Force the chart to recalculate its visible range
        chartRef.current.timeScale().fitContent();
      }
      
      // Flash update indicator
      setIsUpdating(true);
      setTimeout(() => setIsUpdating(false), 500);
      
    } catch {
      // Silently handle errors
    }
  }, [currentPrice, chartType]); // Update when price or chart type changes

  const handleTimeframeChange = (tf: Timeframe) => {
    setTimeframe(tf);
    onTimeframeChange?.(tf);
  };

  return (
    <div className="w-full bg-gray-900/50 rounded-lg border border-gray-800 p-4">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div>
            <h3 className="text-lg font-bold text-white">{symbol} Chart</h3>
            <p className="text-sm text-gray-400">
              {currentPrice && `Current: $${currentPrice.toFixed(2)}`}
            </p>
          </div>
          {/* Live Update Indicator */}
          <div className={`transition-all duration-500 ${isUpdating ? 'opacity-100' : 'opacity-0'}`}>
            <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
              LIVE UPDATE
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Chart Type Selector */}
          <div className="flex items-center space-x-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setChartType('candlestick')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                chartType === 'candlestick'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Candles
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                chartType === 'line'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                chartType === 'area'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Area
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center space-x-1 bg-gray-800 rounded-lg p-1">
            {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded">
            <div className="text-gray-400">Loading chart...</div>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full" />
      </div>

      {/* Chart Legend */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>O: {data[data.length - 1]?.open.toFixed(2)}</span>
          <span>H: {data[data.length - 1]?.high.toFixed(2)}</span>
          <span>L: {data[data.length - 1]?.low.toFixed(2)}</span>
          <span>C: {data[data.length - 1]?.close.toFixed(2)}</span>
        </div>
        <div>
          Volume: {data[data.length - 1]?.volume.toLocaleString()}
        </div>
      </div>
    </div>
  );
};