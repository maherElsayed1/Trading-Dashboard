# Trading Dashboard API Documentation

## Base URL
- Development: `http://localhost:3001/api`
- WebSocket: `ws://localhost:3001`

## REST API Endpoints

### Health Check

#### GET `/api/health`
Check service health and status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-10T12:00:00.000Z",
  "service": "trading-dashboard-backend",
  "version": "1.0.0",
  "market": {
    "isOpen": true,
    "updateFrequency": 2000,
    "totalSubscriptions": 5,
    "tickerCount": 8
  },
  "websocket": {
    "totalConnections": 2,
    "activeSubscriptions": 5
  }
}
```

### Tickers

#### GET `/api/tickers`
Get all available tickers with current prices.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "price": 180.50,
      "previousClose": 179.25,
      "change": 1.25,
      "changePercent": 0.697,
      "volume": 75234567,
      "high": 181.20,
      "low": 178.90,
      "timestamp": "2025-08-10T12:00:00.000Z"
    }
  ],
  "count": 8,
  "timestamp": "2025-08-10T12:00:00.000Z"
}
```

#### GET `/api/tickers/:symbol`
Get specific ticker details.

**Parameters:**
- `symbol` (string): Ticker symbol (e.g., AAPL, TSLA, BTC-USD)

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "price": 180.50,
    "previousClose": 179.25,
    "change": 1.25,
    "changePercent": 0.697,
    "volume": 75234567,
    "high": 181.20,
    "low": 178.90,
    "timestamp": "2025-08-10T12:00:00.000Z"
  },
  "timestamp": "2025-08-10T12:00:00.000Z"
}
```

#### GET `/api/tickers/:symbol/history`
Get historical price data for a ticker.

**Parameters:**
- `symbol` (string): Ticker symbol
- `days` (query, optional): Number of days (default: 30, max: 30)
- `interval` (query, optional): Data interval (default: "daily")

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "interval": "daily",
    "dataPoints": [
      {
        "timestamp": "2025-07-11T09:30:00.000Z",
        "open": 178.50,
        "high": 181.20,
        "low": 177.80,
        "close": 180.25,
        "volume": 72345678
      }
    ]
  },
  "count": 30,
  "timestamp": "2025-08-10T12:00:00.000Z"
}
```

### Market Control

#### GET `/api/market/status`
Get current market simulation status.

**Response:**
```json
{
  "success": true,
  "data": {
    "isOpen": true,
    "updateFrequency": 2000,
    "totalSubscriptions": 5,
    "tickerCount": 8
  },
  "timestamp": "2025-08-10T12:00:00.000Z"
}
```

#### POST `/api/market/control`
Control market simulation (for testing).

**Request Body:**
```json
{
  "action": "start|stop|open|close|setFrequency",
  "updateFrequency": 3000  // Optional, only for setFrequency action
}
```

**Response:**
```json
{
  "success": true,
  "message": "Market action 'start' executed successfully",
  "status": {
    "isOpen": true,
    "updateFrequency": 2000,
    "totalSubscriptions": 5,
    "tickerCount": 8
  },
  "timestamp": "2025-08-10T12:00:00.000Z"
}
```

## WebSocket API

### Connection
Connect to `ws://localhost:3001`

Upon connection, you'll receive:
```json
{
  "type": "connection",
  "data": {
    "message": "Connected to Trading Dashboard WebSocket",
    "availableTickers": ["AAPL", "TSLA", "BTC-USD", "ETH-USD", "GOOGL", "MSFT", "AMZN", "SPY"],
    "serverTime": "2025-08-10T12:00:00.000Z"
  },
  "timestamp": "2025-08-10T12:00:00.000Z"
}
```

### Message Types

#### Subscribe to Tickers
**Send:**
```json
{
  "type": "subscribe",
  "symbols": ["AAPL", "TSLA"]
}
```

**Receive:**
```json
{
  "type": "subscribe",
  "data": {
    "results": [
      { "symbol": "AAPL", "status": "subscribed" },
      { "symbol": "TSLA", "status": "subscribed" }
    ],
    "subscribedSymbols": ["AAPL", "TSLA"]
  },
  "timestamp": "2025-08-10T12:00:00.000Z"
}
```

#### Price Updates
**Receive (automatically after subscription):**
```json
{
  "type": "price_update",
  "data": {
    "symbol": "AAPL",
    "price": 180.75,
    "change": 1.50,
    "changePercent": 0.839,
    "volume": 75345678,
    "timestamp": "2025-08-10T12:00:05.000Z"
  },
  "timestamp": "2025-08-10T12:00:05.000Z"
}
```

#### Unsubscribe from Tickers
**Send:**
```json
{
  "type": "unsubscribe",
  "symbols": ["AAPL"]
}
```

**Receive:**
```json
{
  "type": "unsubscribe",
  "data": {
    "results": [
      { "symbol": "AAPL", "status": "unsubscribed" }
    ],
    "subscribedSymbols": ["TSLA"]
  },
  "timestamp": "2025-08-10T12:00:00.000Z"
}
```

#### Heartbeat
**Send:**
```json
{
  "type": "heartbeat"
}
```

**Receive:**
```json
{
  "type": "heartbeat",
  "data": {
    "serverTime": "2025-08-10T12:00:00.000Z"
  },
  "timestamp": "2025-08-10T12:00:00.000Z"
}
```

#### Error Messages
**Receive:**
```json
{
  "type": "error",
  "error": "Invalid message format",
  "timestamp": "2025-08-10T12:00:00.000Z"
}
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

## Rate Limits

- REST API: No rate limits in development
- WebSocket: Maximum 100 messages per second per connection
- Price Updates: Broadcast every 2 seconds by default

## Available Tickers

| Symbol | Name | Type |
|--------|------|------|
| AAPL | Apple Inc. | Stock |
| TSLA | Tesla Inc. | Stock |
| BTC-USD | Bitcoin | Cryptocurrency |
| ETH-USD | Ethereum | Cryptocurrency |
| GOOGL | Alphabet Inc. | Stock |
| MSFT | Microsoft Corp. | Stock |
| AMZN | Amazon.com Inc. | Stock |
| SPY | S&P 500 ETF | ETF |