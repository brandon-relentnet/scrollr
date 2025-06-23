# Scrollr Backend Services

Three independent Node.js services that provide data to the Scrollr application frontend.

> **Note:** This is the development branch. For production deployment, use the main branch.

## Services

**Accounts Service** - Port 5000
- User authentication and JWT tokens
- User profiles and settings
- RSS feed management

**Finance Service** - Port 4001  
- Real-time stock quotes via Finnhub API
- WebSocket connections for live price updates
- Stock tracking and watchlists

**Sports Service** - Port 4000
- Live sports scores from ESPN
- WebSocket connections for real-time updates
- Supports NFL, NBA, NHL, MLB

## Quick Setup

1. **Install dependencies:**
   ```bash
   make install-deps
   ```

2. **Setup environment file:**
   ```bash
   # Copy the centralized example file to create your .env
   cp .env.example .env
   ```
   
   Edit the `.env` file with your database credentials and API keys. All services now use this single configuration file.

3. **Start services:**
   ```bash
   make dev-up
   ```

## Commands

```bash
make dev-up       # Start all services
make dev-down     # Stop all services
make dev-status   # Check which services are running
make dev-logs     # View real-time logs
make dev-restart  # Restart all services
```

## Environment Setup

Each service needs a `.env` file with database credentials:

**Required for all services:**
- `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`

**Additionally required:**
- **Accounts**: `JWT_SECRET` (32+ character string)
- **Finance**: `FINNHUB_API_KEY` (get free key at finnhub.io)

## Database Tables

Tables are created automatically when services start. To manually create:

```bash
make create-tables
```

## API Endpoints

**Accounts (localhost:5000)**
- `POST /api/auth/login` - User login
- `GET /api/users/profile` - Get user profile  
- `PUT /api/users/settings` - Update settings
- `GET /health` - Health check

**Finance (localhost:4001)**  
- `GET /api/trades` - Get stock data
- `WS /ws` - Live price updates
- `GET /health` - Health check

**Sports (localhost:4000)**
- `GET /api/games` - Get games data
- `WS /ws` - Live score updates  
- `GET /health` - Health check

## Logs

View logs: `make dev-logs`

Files: `backend/logs/accounts.log`, `finance.log`, `sports.log`

## Troubleshooting

**Services won't start:** Check ports aren't in use, database is running, `.env` files are configured

**Database errors:** Verify PostgreSQL is running and credentials in `.env` are correct