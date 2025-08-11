import { Router, Request, Response } from 'express';
import { marketDataService } from '../services/marketData.service';
import { websocketService } from '../services/websocket.service';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the backend service
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
 *                 uptime:
 *                   type: number
 *                   description: Uptime in seconds
 *                 services:
 *                   type: object
 *                   properties:
 *                     marketData:
 *                       type: boolean
 *                     websocket:
 *                       type: boolean
 *       503:
 *         description: Service is unhealthy
 */
router.get('/', (_req: Request, res: Response) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      marketData: marketDataService.getMarketStatus().isOpen !== undefined,
      websocket: websocketService.getConnectionCount() >= 0
    },
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };

  // Check if any service is down
  const isHealthy = Object.values(healthCheck.services).every(status => status === true);

  if (isHealthy) {
    res.status(200).json(healthCheck);
  } else {
    res.status(503).json({
      ...healthCheck,
      status: 'unhealthy'
    });
  }
});

/**
 * @swagger
 * /api/health/live:
 *   get:
 *     summary: Liveness probe
 *     description: Simple liveness check for Kubernetes
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 *       503:
 *         description: Service is not alive
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

/**
 * @swagger
 * /api/health/ready:
 *   get:
 *     summary: Readiness probe
 *     description: Readiness check for Kubernetes
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
router.get('/ready', (_req: Request, res: Response) => {
  // Check if services are ready
  const isReady = marketDataService.getMarketStatus().isOpen !== undefined;
  
  if (isReady) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});

export default router;