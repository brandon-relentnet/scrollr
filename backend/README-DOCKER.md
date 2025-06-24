# Scrollr Backend - Docker Production Setup

This guide helps you deploy Scrollr's backend services using Docker for production.

## Quick Start

1. **Environment Setup**
   ```bash
   # Copy and configure production environment
   cp .env.production .env
   # Edit .env with your production values
   ```

2. **Build and Start**
   ```bash
   # Build Docker images
   make prod-build
   
   # Start production environment
   make prod-up
   ```

3. **Verify Deployment**
   ```bash
   # Check service status
   make prod-status
   
   # View logs
   make prod-logs
   ```

## Production Commands

| Command | Description |
|---------|-------------|
| `make prod-build` | Build all Docker images |
| `make prod-up` | Start production environment |
| `make prod-down` | Stop production environment |
| `make prod-status` | Check container and service health |
| `make prod-logs` | View real-time logs |
| `make prod-clean` | Clean environment and images |
| `make prod-restart` | Restart all services |

## Architecture

The Docker setup includes:

- **PostgreSQL Database** (port 5432)
  - Persistent data storage via Docker volume
  - Health checks for reliability
  - Automatic initialization

- **Accounts Service** (port 5000)
  - JWT authentication
  - User management
  - RSS feed CRUD operations

- **Finance Service** (port 4001)  
  - Finnhub API integration
  - WebSocket for real-time stock data
  - Rate limiting and caching

- **Sports Service** (port 4000)
  - ESPN data integration
  - WebSocket for live scores
  - Scheduled data updates

## Configuration

### Required Environment Variables

Edit your `.env` file with these critical values:

```bash
# Database
DB_PASSWORD=your_strong_database_password

# Security  
JWT_SECRET=your_super_secret_jwt_key_32_chars_minimum

# API Keys
FINNHUB_API_KEY=your_finnhub_api_key
```

### Optional Configuration

See `.env.production` for additional performance and security options.

## Service URLs

Once running, services are available at:

- **Accounts API**: http://localhost:5000
- **Finance API**: http://localhost:4001  
- **Sports API**: http://localhost:4000
- **Database**: localhost:5432

### Health Check Endpoints

- http://localhost:5000/health
- http://localhost:4001/health
- http://localhost:4000/health

## Production Deployment

### Security Checklist

- [ ] Change default passwords in `.env`
- [ ] Use strong JWT secret (32+ characters)
- [ ] Configure database SSL for external databases
- [ ] Set up reverse proxy with HTTPS (nginx/Traefik)
- [ ] Configure firewall rules
- [ ] Regular security updates

### Monitoring & Maintenance

```bash
# Monitor logs continuously
make prod-logs

# Check service health
make prod-status

# Restart if needed
make prod-restart
```

### Data Persistence

- Database data is stored in Docker volume `postgres_data`
- Logs are written to `./logs/` directory
- Backup database regularly for production use

### Scaling Considerations

For high-traffic deployments:

1. **Database**: Use managed PostgreSQL service (AWS RDS, etc.)
2. **Load Balancing**: Add nginx/HAProxy for multiple service instances
3. **Caching**: Enable Redis for improved performance
4. **Orchestration**: Consider Docker Swarm or Kubernetes

## Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check environment file exists
ls -la .env

# Check Docker is running
docker --version

# Check logs for errors
make prod-logs
```

**Database connection errors:**
```bash
# Verify database is healthy
docker-compose exec database pg_isready

# Check database logs
docker-compose logs database
```

**Port conflicts:**
```bash
# Check what's using ports
lsof -i :5000
lsof -i :4001  
lsof -i :4000
lsof -i :5432
```

### Cleanup and Reset

```bash
# Complete cleanup (destroys data!)
make prod-clean

# Rebuild from scratch
make prod-build
make prod-up
```

## Development vs Production

| Aspect | Development (`make dev-up`) | Production (`make prod-up`) |
|--------|---------------------------|---------------------------|
| **Environment** | Local Node.js processes | Docker containers |
| **Database** | External PostgreSQL | Containerized PostgreSQL |
| **Logs** | File-based logging | Container logging + files |
| **Process Management** | Direct Node.js processes | Docker container orchestration |
| **Configuration** | `.env` file | `.env` file (production values) |
| **Isolation** | Shared host environment | Containerized isolation |

## API Integration

The frontend extension should point to:

```javascript
// Production endpoints
const API_ENDPOINTS = {
  accounts: 'http://localhost:5000/api',
  finance: 'http://localhost:4001/api', 
  sports: 'http://localhost:4000/api'
};

const WS_ENDPOINTS = {
  finance: 'ws://localhost:4001/ws',
  sports: 'ws://localhost:4000/ws'
};
```

For external deployment, replace `localhost` with your server's domain/IP.