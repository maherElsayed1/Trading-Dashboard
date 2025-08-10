# CLAUDE.md - Trading Dashboard Project Guide

## Project Overview
Real-time trading dashboard with WebSocket streaming, interactive charts, and microservices architecture. This document serves as the AI assistant's guide for understanding project context, current status, and implementation decisions.

## Project Requirements
- **Frontend**: React-based dashboard with real-time price updates and interactive charts
- **Backend**: Microservice for market data simulation and WebSocket streaming
- **Architecture**: Clean microservices structure demonstrating separation of concerns
- **Real-time**: WebSocket bi-directional communication for live price updates
- **Testing**: Comprehensive unit and integration tests
- **Deployment**: Docker containerization with optional Kubernetes

## Current Status
- **Phase**: Phase 5 - Real-time Integration
- **Completion**: 45%
- **Last Updated**: 2025-08-10
- **Next Action**: Test and complete WebSocket real-time integration

## Architecture Decisions

### Folder Structure
**Decision**: Separate `/frontend` and `/backend` folders at root level
**Rationale**: 
- Clear demonstration of microservices architecture
- Independent deployment and scaling
- Better separation of concerns
- Easier CI/CD pipeline configuration

### Technology Stack

#### Frontend
- **Framework**: Next.js 15.4.6 with TypeScript
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS 4
- **Charts**: TradingView Lightweight Charts
  - Rationale: Purpose-built for financial data, superior performance, professional appearance
- **WebSocket Client**: socket.io-client or native WebSocket API
- **State Management**: React Context + custom hooks
- **Testing**: Jest, React Testing Library

#### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **WebSocket**: ws library (native WebSocket)
- **Testing**: Jest, Supertest
- **Data**: In-memory with mock generation (no database required)

#### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose (dev), Kubernetes (optional production)
- **Development**: Hot reload for both services

## Project Structure
```
trading-dashboard/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API and WebSocket services
│   ├── types/              # TypeScript definitions
│   ├── utils/              # Utility functions
│   └── package.json
├── backend/                 # Node.js backend service
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── models/         # Data models
│   │   ├── websocket/      # WebSocket handlers
│   │   └── app.ts          # Express app
│   ├── tests/              # Backend tests
│   └── package.json
├── shared/                  # Shared TypeScript types
│   └── types/
├── docs/                    # Documentation
│   ├── instructions.md     # Original requirements
│   └── api.md             # API documentation
├── docker-compose.yml       # Local development
├── CLAUDE.md               # This file
├── PROJECT_STATUS.md       # Progress tracking
└── README.md               # Project overview
```

## Implementation Phases

### Phase Progress Tracker
- [✅] Phase 1: Project Structure & Setup
- [✅] Phase 2: Backend Core - Market Data Service
- [✅] Phase 3: Backend WebSocket Implementation (merged with Phase 2)
- [✅] Phase 4: Frontend Foundation
- [🔄] Phase 5: Real-time Integration
- [ ] Phase 6: Charts Implementation
- [ ] Phase 7: Bonus Features (Authentication, Alerts, Caching)
- [ ] Phase 8: Testing & Quality
- [ ] Phase 9: Docker & Deployment

## Development Workflow

### MCP Server Integration
**IMPORTANT**: Before implementing any new feature:
1. **Use Context7 MCP** (`mcp__context7`) to fetch latest framework documentation
   - Get React/Next.js patterns for frontend work
   - Get Express/WebSocket patterns for backend work
   - Get TradingView Lightweight Charts docs for charting
2. **Use Sequential MCP** (`mcp__sequential`) for complex multi-step thinking
   - Architecture planning
   - Complex feature implementation
   - Performance optimization strategies

### Phase Checkpoints
1. After each phase implementation:
   - First checkpoint: "Is this what you expected?"
   - Second checkpoint: "Should we commit and push?"
   - Documentation update: PROJECT_STATUS.md

### Git Strategy
- Branch: `main` (or feature branches as needed)
- Commit after each approved phase
- Meaningful commit messages: "Phase X: [Description]"

### Testing Strategy
- Unit tests for business logic
- Integration tests for APIs
- WebSocket connection tests
- E2E tests for critical user flows
- Target: 80% coverage on critical paths

## Available Tickers
The system will simulate real-time data for:
- AAPL (Apple Inc.)
- TSLA (Tesla Inc.)
- BTC-USD (Bitcoin)
- ETH-USD (Ethereum)
- GOOGL (Alphabet Inc.)
- MSFT (Microsoft Corp.)
- AMZN (Amazon.com Inc.)
- SPY (S&P 500 ETF)

## API Endpoints

### REST API (Backend - Port 3001)
- `GET /api/tickers` - List all available tickers
- `GET /api/tickers/:symbol` - Get specific ticker details
- `GET /api/tickers/:symbol/history` - Get historical data (30 days)
- `GET /api/health` - Health check endpoint

### WebSocket Events (Port 3001)
- `connection` - Client connects
- `subscribe` - Subscribe to ticker updates
- `unsubscribe` - Unsubscribe from ticker
- `price-update` - Real-time price broadcast
- `error` - Error messages

## Performance Targets
- WebSocket latency: < 100ms
- UI response time: < 50ms
- Chart update rate: 60 fps
- Memory usage: < 200MB (frontend)
- CPU usage: < 30% average

## Known Decisions & Trade-offs

### Implemented
- Mock data instead of real API (simplicity, no API keys needed)
- In-memory data storage (no database complexity)
- TradingView charts over generic libraries (professional appearance)

### Pending Decisions
- Authentication mechanism (if bonus feature)
- Caching strategy (Redis vs in-memory)
- Alert notification method
- Chart indicators to include

## Commands Reference

### Development
```bash
# Frontend (from /frontend)
npm run dev          # Start development server
npm run build        # Production build
npm run test         # Run tests
npm run lint         # Lint code

# Backend (from /backend)
npm run dev          # Start with nodemon
npm run build        # TypeScript compilation
npm run start        # Production start
npm run test         # Run tests

# Full stack (from root)
docker-compose up    # Start both services
```

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Backend (.env)
```
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## Quality Checklist
- [ ] TypeScript strict mode enabled
- [ ] ESLint configuration
- [ ] Prettier formatting
- [ ] Git hooks (husky) for pre-commit
- [ ] Error boundaries in React
- [ ] Graceful WebSocket reconnection
- [ ] Loading states for all async operations
- [ ] Responsive design (mobile-first)
- [ ] Accessibility (ARIA labels)
- [ ] Performance monitoring

## Troubleshooting Guide

### Common Issues
1. **WebSocket connection fails**: Check CORS settings and ports
2. **Chart not updating**: Verify data format and subscription
3. **High CPU usage**: Check update frequency and React renders
4. **Memory leaks**: Ensure proper cleanup in useEffect hooks

## Notes for Future Development
- Consider adding more sophisticated price simulation algorithms
- Implement real market data integration (Alpha Vantage, Yahoo Finance)
- Add more chart types and technical indicators
- Consider server-sent events (SSE) as WebSocket alternative
- Implement data persistence layer if needed

## Contact & Resources
- Original Requirements: `/docs/instructions.md`
- Project Status: `/PROJECT_STATUS.md`
- API Documentation: `/docs/api.md` (to be created)