#!/bin/bash

# Trading Dashboard Deployment Script
# Usage: ./scripts/deploy.sh [production|staging|development]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default environment
ENVIRONMENT=${1:-production}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Trading Dashboard Deployment${NC}"
echo -e "${GREEN}Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "${GREEN}========================================${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"

# Load environment variables
if [ -f .env.$ENVIRONMENT ]; then
    echo -e "\n${YELLOW}Loading environment variables from .env.$ENVIRONMENT${NC}"
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
elif [ -f .env ]; then
    echo -e "\n${YELLOW}Loading environment variables from .env${NC}"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "\n${YELLOW}Warning: No environment file found. Using defaults.${NC}"
fi

# Build images
echo -e "\n${YELLOW}Building Docker images...${NC}"
if [ "$ENVIRONMENT" = "development" ]; then
    docker-compose -f docker-compose.dev.yml build
else
    docker-compose build
fi
echo -e "${GREEN}✓ Images built successfully${NC}"

# Stop existing containers
echo -e "\n${YELLOW}Stopping existing containers...${NC}"
if [ "$ENVIRONMENT" = "development" ]; then
    docker-compose -f docker-compose.dev.yml down
else
    docker-compose down
fi
echo -e "${GREEN}✓ Existing containers stopped${NC}"

# Start new containers
echo -e "\n${YELLOW}Starting new containers...${NC}"
if [ "$ENVIRONMENT" = "development" ]; then
    docker-compose -f docker-compose.dev.yml up -d
else
    docker-compose up -d
fi
echo -e "${GREEN}✓ Containers started${NC}"

# Wait for services to be healthy
echo -e "\n${YELLOW}Waiting for services to be healthy...${NC}"
sleep 5

# Check backend health
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health || echo "000")
if [ "$BACKEND_HEALTH" = "200" ]; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed (HTTP $BACKEND_HEALTH)${NC}"
fi

# Check frontend health
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
if [ "$FRONTEND_HEALTH" = "200" ]; then
    echo -e "${GREEN}✓ Frontend is healthy${NC}"
else
    echo -e "${RED}✗ Frontend health check failed (HTTP $FRONTEND_HEALTH)${NC}"
fi

# Show container status
echo -e "\n${YELLOW}Container Status:${NC}"
docker-compose ps

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nAccess the application at:"
echo -e "  Frontend: ${YELLOW}http://localhost:3000${NC}"
echo -e "  Backend API: ${YELLOW}http://localhost:3001${NC}"
echo -e "  API Docs: ${YELLOW}http://localhost:3001/api-docs${NC}"
echo -e "\nView logs with: ${YELLOW}docker-compose logs -f${NC}"
echo -e "Stop services with: ${YELLOW}docker-compose down${NC}"