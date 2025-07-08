.PHONY: help build up down logs restart clean test

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build all services
	docker-compose build

up: ## Start all services
	docker-compose up -d

dev: ## Start all services with logs
	docker-compose up

down: ## Stop all services
	docker-compose down

logs: ## Show logs for all services
	docker-compose logs -f

backend-logs: ## Show backend logs
	docker-compose logs -f backend

frontend-logs: ## Show frontend logs
	docker-compose logs -f frontend

restart: ## Restart all services
	docker-compose restart

clean: ## Remove all containers, images, and volumes
	docker-compose down -v --rmi all

reset-db: ## Reset the database
	docker-compose down
	docker volume rm island-rides-app-main_backend_data
	docker-compose up -d backend

test: ## Run tests
	docker-compose exec backend npm test

shell-backend: ## Access backend container shell
	docker-compose exec backend sh

shell-frontend: ## Access frontend container shell
	docker-compose exec frontend sh 