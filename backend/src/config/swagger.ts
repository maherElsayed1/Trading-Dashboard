import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Trading Dashboard API',
      version,
      description: 'Real-time trading dashboard with live ticker prices and WebSocket support',
      contact: {
        name: 'API Support',
        email: 'support@tradingdashboard.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'http://localhost:3001',
        description: 'Docker development server'
      }
    ],
    components: {
      schemas: {
        Ticker: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Ticker symbol',
              example: 'AAPL'
            },
            name: {
              type: 'string',
              description: 'Company name',
              example: 'Apple Inc.'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Current price',
              example: 180.50
            },
            previousClose: {
              type: 'number',
              format: 'float',
              description: 'Previous closing price',
              example: 179.25
            },
            change: {
              type: 'number',
              format: 'float',
              description: 'Price change',
              example: 1.25
            },
            changePercent: {
              type: 'number',
              format: 'float',
              description: 'Price change percentage',
              example: 0.697
            },
            volume: {
              type: 'number',
              description: 'Trading volume',
              example: 75234567
            },
            high: {
              type: 'number',
              format: 'float',
              description: 'Daily high price',
              example: 181.20
            },
            low: {
              type: 'number',
              format: 'float',
              description: 'Daily low price',
              example: 178.90
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
              example: '2025-08-10T12:00:00.000Z'
            }
          }
        },
        HistoricalDataPoint: {
          type: 'object',
          properties: {
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Data point timestamp',
              example: '2025-08-10T09:30:00.000Z'
            },
            open: {
              type: 'number',
              format: 'float',
              description: 'Opening price',
              example: 178.50
            },
            high: {
              type: 'number',
              format: 'float',
              description: 'High price',
              example: 181.20
            },
            low: {
              type: 'number',
              format: 'float',
              description: 'Low price',
              example: 177.80
            },
            close: {
              type: 'number',
              format: 'float',
              description: 'Closing price',
              example: 180.25
            },
            volume: {
              type: 'number',
              description: 'Trading volume',
              example: 72345678
            }
          }
        },
        MarketStatus: {
          type: 'object',
          properties: {
            isOpen: {
              type: 'boolean',
              description: 'Market open status',
              example: true
            },
            updateFrequency: {
              type: 'number',
              description: 'Price update frequency in milliseconds',
              example: 2000
            },
            totalSubscriptions: {
              type: 'number',
              description: 'Total active WebSocket subscriptions',
              example: 5
            },
            tickerCount: {
              type: 'number',
              description: 'Number of available tickers',
              example: 8
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Operation success status',
              example: true
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            error: {
              type: 'string',
              description: 'Error message if operation failed'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Response timestamp',
              example: '2025-08-10T12:00:00.000Z'
            }
          }
        },
        WebSocketMessage: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['connection', 'subscribe', 'unsubscribe', 'price_update', 'error', 'heartbeat'],
              description: 'Message type'
            },
            data: {
              type: 'object',
              description: 'Message payload'
            },
            error: {
              type: 'string',
              description: 'Error message for error type'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Message timestamp'
            }
          }
        },
        PriceUpdate: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Ticker symbol',
              example: 'AAPL'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Updated price',
              example: 180.75
            },
            change: {
              type: 'number',
              format: 'float',
              description: 'Price change',
              example: 1.50
            },
            changePercent: {
              type: 'number',
              format: 'float',
              description: 'Change percentage',
              example: 0.839
            },
            volume: {
              type: 'number',
              description: 'Current volume',
              example: 75345678
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Update timestamp'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Tickers',
        description: 'Ticker data endpoints'
      },
      {
        name: 'Market',
        description: 'Market control endpoints'
      },
      {
        name: 'WebSocket',
        description: 'WebSocket documentation (not REST endpoints)'
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/app.ts', './src/config/websocket-docs.ts'] // Path to files with JSDoc comments
};

export const swaggerSpec = swaggerJsdoc(options);