# Real-Time Trading Dashboard

A modern, real-time trading dashboard built with Next.js and Node.js, featuring live price updates via WebSocket and interactive financial charts.

## 🚀 Features

- **Real-time Price Updates**: Live ticker prices streamed via WebSocket
- **Interactive Charts**: Professional financial charts using TradingView Lightweight Charts
- **Microservices Architecture**: Clean separation between frontend and backend
- **TypeScript**: Full type safety across the stack
- **Docker Support**: Containerized development and deployment

## 📊 Supported Tickers

- AAPL (Apple Inc.)
- TSLA (Tesla Inc.)
- BTC-USD (Bitcoin)
- ETH-USD (Ethereum)
- GOOGL (Alphabet Inc.)
- MSFT (Microsoft Corp.)
- AMZN (Amazon.com Inc.)
- SPY (S&P 500 ETF)

## 🏗️ Architecture

```
trading-dashboard/
├── frontend/          # Next.js React application
├── backend/           # Node.js Express API & WebSocket server
├── shared/            # Shared TypeScript types
└── docs/              # Documentation
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.4.6** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript** - Type safety
- **TradingView Lightweight Charts** - Financial charts
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **WebSocket (ws)** - Real-time communication
- **TypeScript** - Type safety

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose (optional)

### Installation

#### Option 1: Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd trading-dashboard
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

4. **Start Backend Server**
```bash
cd ../backend
npm run dev
```
Backend will run on http://localhost:3001

5. **Start Frontend Application**
In a new terminal:
```bash
cd frontend
npm run dev
```
Frontend will run on http://localhost:3000

#### Option 2: Docker Compose

1. **Clone the repository**
```bash
git clone <repository-url>
cd trading-dashboard
```

2. **Build and start services**
```bash
docker-compose up --build
```

This will start:
- Frontend on http://localhost:3000
- Backend on http://localhost:3001

## 📡 API Documentation

### Interactive Swagger UI
Visit **http://localhost:3001/api-docs** for interactive API documentation with:
- Live API testing interface
- Complete endpoint documentation
- Request/response schemas
- WebSocket documentation

### REST API Endpoints
- `GET /api/health` - Health check
- `GET /api/tickers` - List all tickers
- `GET /api/tickers/:symbol` - Get ticker details
- `GET /api/tickers/:symbol/history` - Get historical data
- `GET /api/market/status` - Market status
- `POST /api/market/control` - Control simulation

### WebSocket Events
- `connection` - Initial connection
- `subscribe` - Subscribe to ticker updates
- `unsubscribe` - Unsubscribe from ticker
- `price_update` - Real-time price updates

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📈 Performance Targets

- WebSocket latency: < 100ms
- UI response time: < 50ms
- Chart update rate: 60 fps
- Bundle size: < 500KB initial load

## 📝 Documentation

- [Project Status](PROJECT_STATUS.md) - Current development progress
- [AI Assistant Guide](CLAUDE.md) - Context for AI development
- [API Documentation](docs/api.md) - Detailed API specs
- [Requirements](docs/instructions.md) - Original project requirements

## 🤝 Contributing

1. Check [PROJECT_STATUS.md](PROJECT_STATUS.md) for current progress
2. Review [CLAUDE.md](CLAUDE.md) for architecture decisions
3. Follow the established patterns and conventions
4. Ensure all tests pass before submitting

## 📄 License

MIT

## 🎯 Roadmap

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for detailed phase breakdown and progress tracking.

---
*Built with ❤️ using Next.js, Node.js, and TradingView Lightweight Charts*
