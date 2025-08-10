/**
 * @swagger
 * components:
 *   schemas:
 *     WebSocketConnection:
 *       type: object
 *       description: WebSocket connection information
 *       properties:
 *         url:
 *           type: string
 *           example: ws://localhost:3001
 *         protocol:
 *           type: string
 *           example: WebSocket
 *     
 *     WebSocketSubscribe:
 *       type: object
 *       description: Subscribe to ticker updates
 *       properties:
 *         type:
 *           type: string
 *           enum: [subscribe]
 *           example: subscribe
 *         symbols:
 *           type: array
 *           items:
 *             type: string
 *           example: ["AAPL", "TSLA"]
 *     
 *     WebSocketUnsubscribe:
 *       type: object
 *       description: Unsubscribe from ticker updates
 *       properties:
 *         type:
 *           type: string
 *           enum: [unsubscribe]
 *           example: unsubscribe
 *         symbols:
 *           type: array
 *           items:
 *             type: string
 *           example: ["AAPL"]
 *     
 *     WebSocketPriceUpdate:
 *       type: object
 *       description: Real-time price update message
 *       properties:
 *         type:
 *           type: string
 *           enum: [price_update]
 *         data:
 *           $ref: '#/components/schemas/PriceUpdate'
 *         timestamp:
 *           type: string
 *           format: date-time
 * 
 * /websocket:
 *   get:
 *     summary: WebSocket Documentation
 *     description: |
 *       ## WebSocket Connection
 *       
 *       Connect to `ws://localhost:3001` to receive real-time price updates.
 *       
 *       ### Connection Example
 *       ```javascript
 *       const ws = new WebSocket('ws://localhost:3001');
 *       
 *       ws.onopen = () => {
 *         console.log('Connected to Trading Dashboard');
 *         
 *         // Subscribe to tickers
 *         ws.send(JSON.stringify({
 *           type: 'subscribe',
 *           symbols: ['AAPL', 'TSLA']
 *         }));
 *       };
 *       
 *       ws.onmessage = (event) => {
 *         const message = JSON.parse(event.data);
 *         
 *         if (message.type === 'price_update') {
 *           console.log('Price update:', message.data);
 *         }
 *       };
 *       ```
 *       
 *       ### Message Types
 *       
 *       #### 1. Connection (Received on connect)
 *       ```json
 *       {
 *         "type": "connection",
 *         "data": {
 *           "message": "Connected to Trading Dashboard WebSocket",
 *           "availableTickers": ["AAPL", "TSLA", "BTC-USD", ...],
 *           "serverTime": "2025-08-10T12:00:00.000Z"
 *         },
 *         "timestamp": "2025-08-10T12:00:00.000Z"
 *       }
 *       ```
 *       
 *       #### 2. Subscribe (Send to server)
 *       ```json
 *       {
 *         "type": "subscribe",
 *         "symbols": ["AAPL", "TSLA"]
 *       }
 *       ```
 *       
 *       #### 3. Price Update (Received from server)
 *       ```json
 *       {
 *         "type": "price_update",
 *         "data": {
 *           "symbol": "AAPL",
 *           "price": 180.75,
 *           "change": 1.50,
 *           "changePercent": 0.839,
 *           "volume": 75345678,
 *           "timestamp": "2025-08-10T12:00:05.000Z"
 *         },
 *         "timestamp": "2025-08-10T12:00:05.000Z"
 *       }
 *       ```
 *       
 *       #### 4. Unsubscribe (Send to server)
 *       ```json
 *       {
 *         "type": "unsubscribe",
 *         "symbols": ["AAPL"]
 *       }
 *       ```
 *       
 *       #### 5. Heartbeat
 *       Send periodically to keep connection alive:
 *       ```json
 *       {
 *         "type": "heartbeat"
 *       }
 *       ```
 *       
 *       ### Available Tickers
 *       - AAPL (Apple Inc.)
 *       - TSLA (Tesla Inc.)
 *       - BTC-USD (Bitcoin)
 *       - ETH-USD (Ethereum)
 *       - GOOGL (Alphabet Inc.)
 *       - MSFT (Microsoft Corp.)
 *       - AMZN (Amazon.com Inc.)
 *       - SPY (S&P 500 ETF)
 *     tags: [WebSocket]
 *     responses:
 *       200:
 *         description: WebSocket documentation
 */

export const websocketDocs = {};