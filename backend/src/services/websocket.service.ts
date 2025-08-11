import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { MarketDataService } from './marketData.service';
import { WSMessage, WSMessageType, SubscribeMessage, UnsubscribeMessage } from '../../../shared/types/ticker.types';

export class WebSocketService {
  private wss: WebSocketServer;
  private marketDataService: MarketDataService;
  private clients: Map<WebSocket, Set<string>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(server: HTTPServer, marketDataService: MarketDataService) {
    this.marketDataService = marketDataService;
    this.wss = new WebSocketServer({ server });
    this.initialize();
  }

  private initialize(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      this.handleConnection(ws);
    });

    // Start heartbeat to detect stale connections
    this.startHeartbeat();
    
    console.log('🔌 WebSocket service initialized');
  }

  private handleConnection(ws: WebSocket): void {
    console.log('New WebSocket connection established');
    
    // Initialize client subscription tracking
    this.clients.set(ws, new Set());

    // Send welcome message
    const welcomeMessage: WSMessage = {
      type: WSMessageType.CONNECTION,
      data: {
        message: 'Connected to Trading Dashboard WebSocket',
        availableTickers: this.marketDataService.getAllTickers().map(t => t.symbol),
        serverTime: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };
    
    ws.send(JSON.stringify(welcomeMessage));

    // Setup event handlers
    ws.on('message', (data) => this.handleMessage(ws, data));
    ws.on('close', () => this.handleDisconnect(ws));
    ws.on('error', (error) => this.handleError(ws, error));
    ws.on('pong', () => this.handlePong(ws));
  }

  private handleMessage(ws: WebSocket, data: any): void {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case WSMessageType.SUBSCRIBE:
          this.handleSubscribe(ws, message as SubscribeMessage);
          break;
          
        case WSMessageType.UNSUBSCRIBE:
          this.handleUnsubscribe(ws, message as UnsubscribeMessage);
          break;
          
        case WSMessageType.HEARTBEAT:
          this.handleHeartbeat(ws);
          break;
          
        default:
          this.sendError(ws, `Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
      this.sendError(ws, 'Invalid message format');
    }
  }

  private handleSubscribe(ws: WebSocket, message: any): void {
    // Handle both formats: { symbols: [...] } and { data: { symbols: [...] } }
    const symbols = message.symbols || message.data?.symbols || [];
    console.log('Received subscription request for symbols:', symbols);
    
    const clientSubscriptions = this.clients.get(ws);
    
    if (!clientSubscriptions) {
      console.error('Client not found in subscription tracking');
      return;
    }
    
    const results: any[] = [];
    
    symbols.forEach((symbol: string) => {
      const success = this.marketDataService.subscribe(symbol, ws);
      
      if (success) {
        clientSubscriptions.add(symbol);
        results.push({ symbol, status: 'subscribed' });
        console.log(`✅ Client subscribed to ${symbol}`);
      } else {
        results.push({ symbol, status: 'failed', reason: 'Invalid symbol' });
        console.log(`❌ Failed to subscribe to ${symbol}`);
      }
    });
    
    // Send subscription confirmation
    const response: WSMessage = {
      type: WSMessageType.SUBSCRIBE,
      data: {
        results,
        subscribedSymbols: Array.from(clientSubscriptions)
      },
      timestamp: new Date().toISOString()
    };
    
    ws.send(JSON.stringify(response));
  }

  private handleUnsubscribe(ws: WebSocket, message: UnsubscribeMessage): void {
    const { symbols } = message;
    const clientSubscriptions = this.clients.get(ws);
    
    if (!clientSubscriptions) return;
    
    const results: any[] = [];
    
    symbols.forEach(symbol => {
      const success = this.marketDataService.unsubscribe(symbol, ws);
      
      if (success) {
        clientSubscriptions.delete(symbol);
        results.push({ symbol, status: 'unsubscribed' });
      } else {
        results.push({ symbol, status: 'failed', reason: 'Not subscribed' });
      }
    });
    
    // Send unsubscription confirmation
    const response: WSMessage = {
      type: WSMessageType.UNSUBSCRIBE,
      data: {
        results,
        subscribedSymbols: Array.from(clientSubscriptions)
      },
      timestamp: new Date().toISOString()
    };
    
    ws.send(JSON.stringify(response));
  }

  private handleHeartbeat(ws: WebSocket): void {
    const message: WSMessage = {
      type: WSMessageType.HEARTBEAT,
      data: { serverTime: new Date().toISOString() },
      timestamp: new Date().toISOString()
    };
    
    ws.send(JSON.stringify(message));
  }

  private handlePong(ws: WebSocket): void {
    // Mark connection as alive
    (ws as any).isAlive = true;
  }

  private handleDisconnect(ws: WebSocket): void {
    console.log('WebSocket connection closed');
    
    // Unsubscribe from all tickers
    this.marketDataService.unsubscribeAll(ws);
    
    // Remove client tracking
    this.clients.delete(ws);
  }

  private handleError(ws: WebSocket, error: Error): void {
    console.error('WebSocket error:', error);
    this.sendError(ws, 'Connection error occurred');
  }

  private sendError(ws: WebSocket, message: string): void {
    if (ws.readyState === WebSocket.OPEN) {
      const errorMessage: WSMessage = {
        type: WSMessageType.ERROR,
        error: message,
        timestamp: new Date().toISOString()
      };
      
      ws.send(JSON.stringify(errorMessage));
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: any) => {
        if (ws.isAlive === false) {
          ws.terminate();
          return;
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }

  public broadcastAlert(event: any): void {
    const alertMessage: WSMessage = {
      type: WSMessageType.ALERT,
      data: {
        alert: event.alert,
        ticker: event.ticker,
        message: event.message
      },
      timestamp: new Date().toISOString()
    };

    // Broadcast to all connected clients
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(alertMessage));
      }
    });

    console.log(`📢 Alert broadcast to ${this.wss.clients.size} clients`);
  }

  public getConnectionStats() {
    return {
      totalConnections: this.wss.clients.size,
      activeSubscriptions: Array.from(this.clients.values()).reduce((sum, subs) => sum + subs.size, 0)
    };
  }

  public shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.wss.clients.forEach((ws) => {
      ws.close();
    });
    
    this.wss.close();
  }
}