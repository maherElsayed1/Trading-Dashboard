# Trading Dashboard Makefile
# Convenient commands for Docker operations

.PHONY: help
help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: build
build: ## Build Docker images for production
	docker-compose build

.PHONY: build-dev
build-dev: ## Build Docker images for development
	docker-compose -f docker-compose.dev.yml build

.PHONY: up
up: ## Start production containers
	docker-compose up -d

.PHONY: dev
dev: ## Start development containers with hot reload
	docker-compose -f docker-compose.dev.yml up

.PHONY: down
down: ## Stop and remove containers
	docker-compose down
	docker-compose -f docker-compose.dev.yml down

.PHONY: logs
logs: ## View container logs
	docker-compose logs -f

.PHONY: logs-backend
logs-backend: ## View backend container logs
	docker-compose logs -f backend

.PHONY: logs-frontend
logs-frontend: ## View frontend container logs
	docker-compose logs -f frontend

.PHONY: restart
restart: ## Restart all containers
	docker-compose restart

.PHONY: restart-backend
restart-backend: ## Restart backend container
	docker-compose restart backend

.PHONY: restart-frontend
restart-frontend: ## Restart frontend container
	docker-compose restart frontend

.PHONY: clean
clean: ## Remove containers, networks, and volumes
	docker-compose down -v
	docker-compose -f docker-compose.dev.yml down -v

.PHONY: prune
prune: ## Remove all unused Docker resources
	docker system prune -af --volumes

.PHONY: test-backend
test-backend: ## Run backend tests in container
	docker-compose -f docker-compose.dev.yml run --rm backend npm test

.PHONY: test-frontend
test-frontend: ## Run frontend tests in container
	docker-compose -f docker-compose.dev.yml run --rm frontend npm test

.PHONY: shell-backend
shell-backend: ## Open shell in backend container
	docker-compose exec backend sh

.PHONY: shell-frontend
shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend sh

.PHONY: status
status: ## Show status of containers
	docker-compose ps