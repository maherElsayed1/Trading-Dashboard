import { Router, Request, Response } from 'express';
import { MarketDataService } from '../services/marketData.service';

export function createTickerRoutes(marketDataService: MarketDataService): Router {
  const router = Router();

  /**
   * @swagger
   * /api/tickers:
   *   get:
   *     summary: Get all tickers
   *     description: Retrieve a list of all available tickers with current prices
   *     tags: [Tickers]
   *     responses:
   *       200:
   *         description: Successful response with ticker data
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Ticker'
   *                 count:
   *                   type: number
   *                   example: 8
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       500:
   *         description: Internal server error
   */
  router.get('/tickers', (_req: Request, res: Response) => {
    try {
      const tickers = marketDataService.getAllTickers();
      res.json({
        success: true,
        data: tickers,
        count: tickers.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching tickers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tickers',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * @swagger
   * /api/tickers/{symbol}:
   *   get:
   *     summary: Get specific ticker
   *     description: Retrieve detailed information for a specific ticker symbol
   *     tags: [Tickers]
   *     parameters:
   *       - in: path
   *         name: symbol
   *         required: true
   *         description: Ticker symbol (e.g., AAPL, TSLA, BTC-USD)
   *         schema:
   *           type: string
   *           example: AAPL
   *     responses:
   *       200:
   *         description: Successful response with ticker data
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Ticker'
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       404:
   *         description: Ticker not found
   *       500:
   *         description: Internal server error
   */
  router.get('/tickers/:symbol', (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      const ticker = marketDataService.getTicker(symbol.toUpperCase());
      
      if (!ticker) {
        res.status(404).json({
          success: false,
          error: `Ticker ${symbol} not found`,
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      res.json({
        success: true,
        data: ticker,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error fetching ticker ${req.params.symbol}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch ticker',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * @swagger
   * /api/tickers/{symbol}/history:
   *   get:
   *     summary: Get historical data
   *     description: Retrieve historical price data for a specific ticker
   *     tags: [Tickers]
   *     parameters:
   *       - in: path
   *         name: symbol
   *         required: true
   *         description: Ticker symbol
   *         schema:
   *           type: string
   *           example: AAPL
   *       - in: query
   *         name: days
   *         required: false
   *         description: Number of days of historical data (max 30)
   *         schema:
   *           type: integer
   *           default: 30
   *           minimum: 1
   *           maximum: 30
   *       - in: query
   *         name: interval
   *         required: false
   *         description: Data interval
   *         schema:
   *           type: string
   *           default: daily
   *           enum: [daily]
   *     responses:
   *       200:
   *         description: Successful response with historical data
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     symbol:
   *                       type: string
   *                     interval:
   *                       type: string
   *                     dataPoints:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/HistoricalDataPoint'
   *                 count:
   *                   type: number
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       404:
   *         description: Historical data not found
   *       500:
   *         description: Internal server error
   */
  router.get('/tickers/:symbol/history', (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      const { days = 30, interval = 'daily' } = req.query;
      
      const historicalData = marketDataService.getHistoricalData(symbol.toUpperCase());
      
      if (!historicalData || historicalData.length === 0) {
        res.status(404).json({
          success: false,
          error: `Historical data for ${symbol} not found`,
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // Limit data based on days parameter
      const daysLimit = Math.min(parseInt(days as string) || 30, 30);
      const limitedData = historicalData.slice(-daysLimit);
      
      res.json({
        success: true,
        data: {
          symbol: symbol.toUpperCase(),
          interval,
          dataPoints: limitedData
        },
        count: limitedData.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error fetching historical data for ${req.params.symbol}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch historical data',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * @swagger
   * /api/market/status:
   *   get:
   *     summary: Get market status
   *     description: Retrieve current market simulation status and statistics
   *     tags: [Market]
   *     responses:
   *       200:
   *         description: Successful response with market status
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/MarketStatus'
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       500:
   *         description: Internal server error
   */
  router.get('/market/status', (_req: Request, res: Response) => {
    try {
      const status = marketDataService.getMarketStatus();
      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching market status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch market status',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * @swagger
   * /api/market/control:
   *   post:
   *     summary: Control market simulation
   *     description: Control market simulation for testing purposes
   *     tags: [Market]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - action
   *             properties:
   *               action:
   *                 type: string
   *                 enum: [start, stop, open, close, setFrequency]
   *                 description: Market control action
   *                 example: start
   *               updateFrequency:
   *                 type: number
   *                 description: Update frequency in milliseconds (only for setFrequency action)
   *                 example: 3000
   *                 minimum: 1000
   *                 maximum: 10000
   *     responses:
   *       200:
   *         description: Action executed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 status:
   *                   $ref: '#/components/schemas/MarketStatus'
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       400:
   *         description: Invalid action
   *       500:
   *         description: Internal server error
   */
  router.post('/market/control', (req: Request, res: Response) => {
    try {
      const { action, updateFrequency } = req.body;
      
      switch (action) {
        case 'start':
          marketDataService.startMarketSimulation();
          break;
        case 'stop':
          marketDataService.stopMarketSimulation();
          break;
        case 'open':
          marketDataService.setMarketOpen(true);
          break;
        case 'close':
          marketDataService.setMarketOpen(false);
          break;
        case 'setFrequency':
          if (updateFrequency) {
            marketDataService.setUpdateFrequency(updateFrequency);
          }
          break;
        default:
          res.status(400).json({
            success: false,
            error: `Invalid action: ${action}`,
            timestamp: new Date().toISOString()
          });
          return;
      }
      
      res.json({
        success: true,
        message: `Market action '${action}' executed successfully`,
        status: marketDataService.getMarketStatus(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error controlling market:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to control market',
        timestamp: new Date().toISOString()
      });
    }
  });

  return router;
}