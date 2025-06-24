# Scrollr Development Environment
# =================================

.PHONY: help dev-up dev-down dev-status dev-logs dev-clean install-deps check-deps container-down container-status create-tables prod-up prod-down prod-status prod-logs prod-build prod-clean prod-restart

# Default target
help:
	@echo "Scrollr Development Commands"
	@echo "============================"
	@echo ""
	@echo "Backend Development (Node.js):"
	@echo "  make dev-up      - Start all backend services (accounts, finance, sports)"
	@echo "  make dev-down    - Stop all backend services gracefully"
	@echo "  make dev-status  - Check status of running services"
	@echo "  make dev-logs    - Tail logs from all services"
	@echo "  make dev-clean   - Clean logs and reset environment"
	@echo ""
	@echo "Production (Docker):"
	@echo "  make prod-build  - Build all Docker images"
	@echo "  make prod-up     - Start production environment with Docker"
	@echo "  make prod-down   - Stop production environment"
	@echo "  make prod-status - Check production container status"
	@echo "  make prod-logs   - View production logs"
	@echo "  make prod-clean  - Clean production environment and images"
	@echo "  make prod-restart- Restart production environment"
	@echo ""
	@echo "Container Management:"
	@echo "  make container-down   - Stop and remove all containers"
	@echo "  make container-status - Show container status"
	@echo ""
	@echo "Dependencies:"
	@echo "  make install-deps - Install dependencies for all backend services"
	@echo "  make check-deps   - Check if dependencies are installed"
	@echo ""
	@echo "Database:"
	@echo "  make create-tables - Create all database tables for backend services"
	@echo ""
	@echo "Frontend (WXT Extension):"
	@echo "  npm run dev       - Start extension development server"
	@echo "  npm run build     - Build extension for production"
	@echo ""

# Check if dependencies are installed
check-deps:
	@echo "🔍 Checking backend dependencies..."
	@if [ ! -d "backend/accounts/node_modules" ]; then \
		echo "❌ Accounts service dependencies missing"; \
		exit 1; \
	fi
	@if [ ! -d "backend/finance/node_modules" ]; then \
		echo "❌ Finance service dependencies missing"; \
		exit 1; \
	fi
	@if [ ! -d "backend/sports/node_modules" ]; then \
		echo "❌ Sports service dependencies missing"; \
		exit 1; \
	fi
	@echo "✅ All backend dependencies are installed"

# Install dependencies for all backend services
install-deps:
	@echo "📦 Installing backend dependencies..."
	@echo "Installing accounts service dependencies..."
	@cd backend/accounts && npm install
	@echo "Installing finance service dependencies..."
	@cd backend/finance && npm install
	@echo "Installing sports service dependencies..."
	@cd backend/sports && npm install
	@echo "✅ All backend dependencies installed"

# Start all backend services
dev-up: check-deps
	@echo "🚀 Starting Scrollr backend services..."
	@if pgrep -f "node.*start-all\.js" > /dev/null 2>&1; then \
		echo "⚠️  Backend services are already running"; \
		echo "   Use 'make dev-down' to stop them first"; \
		exit 1; \
	fi
	@echo "📝 Logs will be written to: backend/logs/"
	@echo "🔧 Starting in background... Use 'make dev-logs' to monitor"
	@cd backend && nohup node start-all.js > /dev/null 2>&1 & echo $$! > .dev-pid
	@sleep 3
	@if pgrep -f "node.*start-all.js" > /dev/null; then \
		echo "✅ Backend services started successfully"; \
		echo ""; \
		echo "🌐 Service URLs:"; \
		echo "   Accounts API: http://localhost:5000"; \
		echo "   Finance API:  http://localhost:4001"; \
		echo "   Sports API:   http://localhost:4000"; \
		echo ""; \
		echo "📊 WebSocket endpoints:"; \
		echo "   Finance WS:   ws://localhost:4001/ws"; \
		echo "   Sports WS:    ws://localhost:4000/ws"; \
		echo ""; \
		echo "💡 Use 'make dev-logs' to monitor output"; \
		echo "💡 Use 'make dev-status' to check health"; \
	else \
		echo "❌ Failed to start backend services"; \
		echo "Check logs with: make dev-logs"; \
		exit 1; \
	fi

# Stop all backend services
dev-down:
	@echo "⚡ Stopping Scrollr backend services..."
	@if [ -f backend/.dev-pid ]; then \
		PID=$$(cat backend/.dev-pid); \
		if kill -0 $$PID 2>/dev/null; then \
			echo "Sending SIGINT to process $$PID..."; \
			kill -INT $$PID; \
			echo "Waiting for graceful shutdown..."; \
			sleep 5; \
			if kill -0 $$PID 2>/dev/null; then \
				echo "Force killing process..."; \
				kill -KILL $$PID; \
			fi; \
		fi; \
		rm -f backend/.dev-pid; \
	fi
	@pkill -f "node.*start-all.js" 2>/dev/null || true
	@pkill -f "node.*server.js" 2>/dev/null || true
	@sleep 2
	@if pgrep -f "node.*(start-all|server)\.js" > /dev/null; then \
		echo "⚠️  Some processes may still be running"; \
		echo "   Manual cleanup may be required"; \
	else \
		echo "✅ All backend services stopped"; \
	fi

# Check status of backend services
dev-status:
	@echo "📊 Scrollr Backend Service Status"
	@echo "================================="
	@echo ""
	@if pgrep -f "node.*start-all.js" > /dev/null; then \
		echo "🟢 Main orchestrator: RUNNING"; \
		PID=$$(pgrep -f "node.*start-all.js"); \
		echo "   PID: $$PID"; \
		echo "   Started: $$(ps -p $$PID -o lstart= 2>/dev/null || echo 'Unknown')"; \
	else \
		echo "🔴 Main orchestrator: STOPPED"; \
	fi
	@echo ""
	@echo "Individual Services:"
	@if lsof -i :5000 > /dev/null 2>&1; then \
		echo "🟢 accounts: RUNNING"; \
	else \
		echo "🔴 accounts: STOPPED"; \
	fi
	@if lsof -i :4001 > /dev/null 2>&1; then \
		echo "🟢 finance: RUNNING"; \
	else \
		echo "🔴 finance: STOPPED"; \
	fi
	@if lsof -i :4000 > /dev/null 2>&1; then \
		echo "🟢 sports: RUNNING"; \
	else \
		echo "🔴 sports: STOPPED"; \
	fi
	@echo ""
	@echo "Port Status:"
	@for port in 5000 4001 4000; do \
		if lsof -i :$$port > /dev/null 2>&1; then \
			echo "🟢 Port $$port: IN USE"; \
		else \
			echo "🔴 Port $$port: FREE"; \
		fi; \
	done
	@echo ""
	@echo "💡 Use 'curl http://localhost:PORT/health' to test service health"

# Tail logs from all services
dev-logs:
	@echo "📜 Scrollr Backend Logs (Ctrl+C to stop)"
	@echo "========================================"
	@if [ ! -d "backend/logs" ]; then \
		echo "❌ No logs directory found. Are the services running?"; \
		exit 1; \
	fi
	@echo "Tailing logs from: accounts, finance, sports"
	@echo ""
	@tail -f backend/logs/*.log 2>/dev/null || echo "No log files found"

# Clean logs and reset environment
dev-clean:
	@echo "🧹 Cleaning Scrollr development environment..."
	@make dev-down 2>/dev/null || true
	@echo "Removing log files..."
	@rm -f backend/logs/*.log
	@echo "Removing PID files..."
	@rm -f backend/.dev-pid
	@echo "✅ Development environment cleaned"

# Quick development cycle
dev-restart: dev-down dev-up
	@echo "🔄 Backend services restarted"

# Create all database tables
create-tables: check-deps
	@echo "🗄️ Creating database tables for all backend services..."
	@echo "This will create tables for: accounts, finance, and sports services"
	@echo ""
	@echo "📂 Creating accounts service tables..."
	@cd backend/accounts && node createTables.js 2>/dev/null || echo "⚠️  Accounts service database not accessible (will be created on service startup)"
	@echo ""
	@echo "📂 Creating finance service tables..."
	@cd backend/finance && node createTables.js 2>/dev/null || echo "⚠️  Finance service database not accessible (will be created on service startup)"
	@echo ""
	@echo "📂 Creating sports service tables..."
	@cd backend/sports && node createTables.js 2>/dev/null || echo "⚠️  Sports service database not accessible (will be created on service startup)"
	@echo ""
	@echo "✅ Table creation process completed"
	@echo "💡 Note: Tables are also created automatically when services start"

# Production Docker Commands
# =========================

# Build all Docker images
prod-build:
	@echo "🐳 Building Docker images for production..."
	@echo "This will build images for: accounts, finance, and sports services"
	@cd backend && docker-compose build --no-cache
	@echo "✅ All Docker images built successfully"

# Start production environment
prod-up:
	@echo "🚀 Starting Scrollr production environment with Docker..."
	@if [ ! -f backend/.env ]; then \
		echo "❌ Environment file backend/.env not found"; \
		echo "   Copy backend/.env.example to backend/.env and configure it"; \
		exit 1; \
	fi
	@echo "📦 Starting containers..."
	@cd backend && docker-compose up -d
	@echo "⏳ Waiting for services to be ready..."
	@sleep 10
	@echo "✅ Production environment started successfully"
	@echo ""
	@echo "🌐 Service URLs:"
	@echo "   Accounts API: http://localhost:5000"
	@echo "   Finance API:  http://localhost:4001"
	@echo "   Sports API:   http://localhost:4000"
	@echo "   Database:     localhost:5432"
	@echo ""
	@echo "💡 Use 'make prod-logs' to monitor output"
	@echo "💡 Use 'make prod-status' to check health"

# Stop production environment
prod-down:
	@echo "⚡ Stopping Scrollr production environment..."
	@cd backend && docker-compose down
	@echo "✅ Production environment stopped"

# Check production status
prod-status:
	@echo "📊 Scrollr Production Environment Status"
	@echo "======================================="
	@cd backend && docker-compose ps
	@echo ""
	@echo "🏥 Health Checks:"
	@echo "Testing service endpoints..."
	@curl -s -f http://localhost:5000/health > /dev/null && echo "🟢 Accounts: HEALTHY" || echo "🔴 Accounts: UNHEALTHY"
	@curl -s -f http://localhost:4001/health > /dev/null && echo "🟢 Finance: HEALTHY" || echo "🔴 Finance: UNHEALTHY"
	@curl -s -f http://localhost:4000/health > /dev/null && echo "🟢 Sports: HEALTHY" || echo "🔴 Sports: UNHEALTHY"

# View production logs
prod-logs:
	@echo "📜 Scrollr Production Logs (Ctrl+C to stop)"
	@echo "=========================================="
	@cd backend && docker-compose logs -f

# Clean production environment
prod-clean:
	@echo "🧹 Cleaning Scrollr production environment..."
	@cd backend && docker-compose down -v --remove-orphans
	@cd backend && docker-compose rm -f
	@echo "Removing Docker images..."
	@docker rmi $$(docker images | grep 'backend' | awk '{print $$3}') 2>/dev/null || echo "No images to remove"
	@echo "Cleaning Docker system..."
	@docker system prune -f
	@echo "✅ Production environment cleaned"

# Restart production environment
prod-restart: prod-down prod-up
	@echo "🔄 Production environment restarted"