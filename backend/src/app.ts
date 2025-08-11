import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import swaggerUi from 'swagger-ui-express';
import { MarketDataService } from './services/marketData.service';
import { WebSocketService } from './services/websocket.service';
import { createTickerRoutes } from './routes/ticker.routes';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/auth.routes';
import alertsRoutes from './routes/alerts.routes';
import { cacheService } from './services/cache.service';
import { alertsService } from './services/alerts.service';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();
const PORT = process.env.PORT || 3001;

// Initialize services
const marketDataService = new MarketDataService();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Trading Dashboard API',
  customfavIcon: '/favicon.ico'
}));

// Serve Swagger JSON
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     description: Check service health and status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 service:
 *                   type: string
 *                   example: trading-dashboard-backend
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 market:
 *                   $ref: '#/components/schemas/MarketStatus'
 *                 websocket:
 *                   type: object
 *                   properties:
 *                     totalConnections:
 *                       type: number
 *                     activeSubscriptions:
 *                       type: number
 */
app.get('/api/health', (_req: Request, res: Response) => {
  const wsStats = websocketService ? websocketService.getConnectionStats() : { totalConnections: 0, activeSubscriptions: 0 };
  const marketStatus = marketDataService.getMarketStatus();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'trading-dashboard-backend',
    version: '1.0.0',
    market: marketStatus,
    websocket: wsStats
  });
});

// API Routes
app.use('/api', createTickerRoutes(marketDataService));
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: any) => {
  logger.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString()
  });
});

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket service
const websocketService = new WebSocketService(server, marketDataService);

// Start market simulation automatically
marketDataService.startMarketSimulation();

// Start cache cleanup interval (every minute)
cacheService.startAutoCleanup(60000);

// Subscribe to market updates for alert checking
marketDataService.on('price-update', (ticker) => {
  alertsService.checkAlerts(ticker);
});

// Broadcast alert events through WebSocket
alertsService.on('alert-triggered', (event) => {
  websocketService.broadcastAlert(event);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  marketDataService.stopMarketSimulation();
  websocketService.shutdown();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  marketDataService.stopMarketSimulation();
  websocketService.shutdown();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, () => {
  logger.info(`Trading Dashboard Backend Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Server: http://localhost:${PORT}
📚 API Docs: http://localhost:${PORT}/api-docs
🔌 WebSocket: ws://localhost:${PORT}
📊 Environment: ${process.env.NODE_ENV}
📈 Market simulation: RUNNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Available endpoints:
  GET  /api/health
  GET  /api/tickers
  GET  /api/tickers/:symbol
  GET  /api/tickers/:symbol/history
  GET  /api/market/status
  POST /api/market/control
  
  Authentication:
  POST /api/auth/login
  GET  /api/auth/verify
  POST /api/auth/logout
  
  Alerts (requires auth):
  GET  /api/alerts
  POST /api/alerts
  DELETE /api/alerts/:id
  PATCH /api/alerts/:id/toggle
  
📖 Visit http://localhost:${PORT}/api-docs for interactive API documentation
  `);
});