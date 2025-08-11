# Trading Dashboard - Deployment Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Deployment](#development-deployment)
- [Production Deployment](#production-deployment)
- [Docker Configuration](#docker-configuration)
- [Environment Variables](#environment-variables)
- [Health Monitoring](#health-monitoring)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

## Prerequisites

### Required Software
- Docker Desktop 20.10+ or Docker Engine 20.10+
- Docker Compose 2.0+
- Node.js 18+ (for local development)
- Make (optional, for using Makefile commands)

### System Requirements
- Minimum 4GB RAM
- 2GB free disk space
- Ports 3000 and 3001 available

## Quick Start

### Using Make Commands (Recommended)
```bash
# Clone the repository
git clone https://github.com/yourusername/trading-dashboard.git
cd trading-dashboard

# Copy environment variables
cp .env.example .env

# Build and start production containers
make build
make up

# Or start development environment with hot reload
make dev
```

### Using Docker Compose Directly
```bash
# Production deployment
docker-compose build
docker-compose up -d

# Development deployment
docker-compose -f docker-compose.dev.yml up
```

### Using Deployment Script
```bash
# Make script executable
chmod +x scripts/deploy.sh

# Deploy to production
./scripts/deploy.sh production

# Deploy to development
./scripts/deploy.sh development
```

## Development Deployment

### Features
- Hot reload for both frontend and backend
- Volume mounting for live code changes
- Debug logging enabled
- Source maps available

### Commands
```bash
# Start development environment
make dev

# View logs
make logs

# Open shell in container
make shell-backend
make shell-frontend

# Run tests
make test-backend
make test-frontend
```

### Accessing Services
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api-docs
- WebSocket: ws://localhost:3001

## Production Deployment

### Build Optimization
- Multi-stage Docker builds
- Production dependencies only
- Minified frontend assets
- Non-root user execution
- Health checks enabled

### Deployment Steps

1. **Set Environment Variables**
```bash
# Create production environment file
cp .env.example .env.production

# Edit with production values
nano .env.production
```

2. **Build Images**
```bash
docker-compose build --no-cache
```

3. **Start Services**
```bash
docker-compose up -d
```

4. **Verify Deployment**
```bash
# Check container status
docker-compose ps

# Check health endpoints
curl http://localhost:3001/api/health
curl http://localhost:3000/api/health

# View logs
docker-compose logs -f
```

## Docker Configuration

### Architecture
```
┌─────────────────────────────────────────────┐
│                   Frontend                   │
│                (Next.js App)                 │
│                 Port: 3000                   │
└─────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                   Backend                    │
│              (Express + WebSocket)           │
│                 Port: 3001                   │
└─────────────────────────────────────────────┘
```

### Container Configuration

#### Frontend Container
- Base image: node:18-alpine
- Exposed port: 3000
- Health check: /api/health
- Restart policy: unless-stopped

#### Backend Container
- Base image: node:18-alpine
- Exposed port: 3001
- Health check: /api/health
- Restart policy: unless-stopped

### Networks
- `trading-network`: Bridge network for inter-container communication

### Volumes (Development)
- `backend_node_modules`: Persistent backend dependencies
- `frontend_node_modules`: Persistent frontend dependencies
- `frontend_next`: Next.js build cache

## Environment Variables

### Required Variables
```bash
# Backend
NODE_ENV=production
PORT=3001
JWT_SECRET=your-secure-jwt-secret
CORS_ORIGIN=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Optional Variables
```bash
# Logging
LOG_LEVEL=info|debug|error|warn

# External APIs (future enhancement)
ALPHA_VANTAGE_API_KEY=your-api-key
FINNHUB_API_KEY=your-api-key

# Database (future enhancement)
DATABASE_URL=postgresql://user:password@localhost:5432/trading_db
REDIS_URL=redis://localhost:6379

# Monitoring (future enhancement)
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-license-key
```

## Health Monitoring

### Health Endpoints

#### Backend Health Check
```bash
curl http://localhost:3001/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-11T10:00:00.000Z",
  "uptime": 3600,
  "services": {
    "marketData": true,
    "websocket": true
  },
  "environment": "production",
  "version": "1.0.0"
}
```

#### Frontend Health Check
```bash
curl http://localhost:3000/api/health
```

### Monitoring Commands
```bash
# View container resource usage
docker stats

# Check container logs
docker-compose logs -f --tail=100

# Monitor specific service
docker-compose logs -f backend
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000
lsof -i :3001

# Kill process
kill -9 <PID>
```

#### Container Won't Start
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild images
docker-compose build --no-cache

# Remove volumes and restart
docker-compose down -v
docker-compose up
```

#### WebSocket Connection Issues
- Ensure CORS_ORIGIN is correctly set
- Check firewall rules for port 3001
- Verify NEXT_PUBLIC_WS_URL in frontend

#### Memory Issues
```bash
# Increase Docker memory allocation
# Docker Desktop: Preferences > Resources > Memory

# Or use resource limits in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug docker-compose up

# Interactive container shell
docker-compose exec backend sh
docker-compose exec frontend sh

# View running processes
docker-compose exec backend ps aux
```

## Security Considerations

### Production Checklist
- [ ] Change default JWT_SECRET
- [ ] Use HTTPS in production (reverse proxy)
- [ ] Implement rate limiting
- [ ] Enable CORS for specific domains only
- [ ] Use secrets management (Docker Secrets, Vault)
- [ ] Regular security updates
- [ ] Container scanning for vulnerabilities
- [ ] Network isolation
- [ ] Read-only file systems where possible
- [ ] Non-root user execution

### SSL/TLS Setup (Production)
```nginx
# Example Nginx reverse proxy configuration
server {
    listen 443 ssl http2;
    server_name trading.yourdomain.com;

    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Cloud Deployment

### AWS ECS Deployment
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URI
docker tag trading-backend:latest $ECR_URI/trading-backend:latest
docker push $ECR_URI/trading-backend:latest
```

### Kubernetes Deployment
```yaml
# Example deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: trading-dashboard
spec:
  replicas: 3
  selector:
    matchLabels:
      app: trading-dashboard
  template:
    metadata:
      labels:
        app: trading-dashboard
    spec:
      containers:
      - name: frontend
        image: trading-frontend:latest
        ports:
        - containerPort: 3000
      - name: backend
        image: trading-backend:latest
        ports:
        - containerPort: 3001
```

### Docker Swarm Deployment
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml trading-dashboard

# Scale services
docker service scale trading-dashboard_backend=3
```

## Backup and Recovery

### Data Backup (Future Enhancement)
```bash
# Backup database (when implemented)
docker exec trading-db pg_dump -U postgres trading > backup.sql

# Restore database
docker exec -i trading-db psql -U postgres trading < backup.sql
```

### Container Backup
```bash
# Save container state
docker commit trading-backend trading-backend-backup:$(date +%Y%m%d)

# Export container
docker export trading-backend > trading-backend-backup.tar
```

## Performance Optimization

### Docker Optimization
- Use Alpine Linux base images
- Multi-stage builds
- Layer caching
- .dockerignore files
- Volume mounts for node_modules

### Application Optimization
- Enable production mode
- Minify assets
- Enable gzip compression
- Implement caching strategies
- Use CDN for static assets

## Maintenance

### Updates
```bash
# Update dependencies
docker-compose exec backend npm update
docker-compose exec frontend npm update

# Rebuild after updates
docker-compose build --no-cache
docker-compose up -d
```

### Logs Management
```bash
# Rotate logs
docker-compose logs --tail=1000 > logs/app-$(date +%Y%m%d).log

# Clean old logs
find logs/ -name "*.log" -mtime +30 -delete
```

### Cleanup
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Complete cleanup
make prune
```

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review container logs: `docker-compose logs`
3. Check health endpoints
4. Open an issue on GitHub

## License

This project is licensed under the MIT License.