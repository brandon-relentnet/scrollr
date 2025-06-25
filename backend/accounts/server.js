import express from 'express';
import cors from 'cors';
import { accountsConfig, validateConfig } from './config.js';
import { initializeDatabase } from './db.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import linkedAccountsRoutes from './routes/linkedAccounts.js';
import adminRoutes from './routes/admin.js';

// Validate configuration
validateConfig('accounts');

const app = express();
const PORT = accountsConfig.port;

// Middleware
app.use(cors());
app.use(express.json());

// Debug logging - only in development
if (accountsConfig.nodeEnv === 'development') {
    app.use((req, res, next) => {
        console.log(`🔍 [${new Date().toISOString()}] ${req.method} ${req.url}`);
        // Only log non-sensitive headers in development
        const safeHeaders = { ...req.headers };
        delete safeHeaders.authorization;
        delete safeHeaders.cookie;
        console.log(`🔍 Headers:`, JSON.stringify(safeHeaders, null, 2));
        
        // Don't log request body as it may contain passwords/tokens
        if (req.url.includes('/auth/') || req.url.includes('/admin/')) {
            console.log(`🔍 Body: [REDACTED - contains sensitive data]`);
        } else {
            console.log(`🔍 Body:`, req.body);
        }
        next();
    });
}

// Routes - REMOVED /api prefix since nginx strips /api/accounts/
app.get('/', (req, res) => {
    console.log('✅ Root route hit');
    res.json({ message: 'Accounts API is running' });
});

// Mount auth routes and log when they're mounted
console.log('📍 Mounting auth routes at /auth');
app.use('/auth', authRoutes);

console.log('📍 Mounting linked-accounts routes at /linked-accounts');
app.use('/linked-accounts', linkedAccountsRoutes);

console.log('📍 Mounting admin routes at /admin');
app.use('/admin', adminRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
    console.log('✅ Health check hit');
    
    const health = {
        status: 'healthy',
        timestamp: Date.now(),
        service: 'accounts',
        version: '1.0.0',
        message: 'Accounts API server is running',
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        database_connected: false,
        jwt_secret_configured: false,
        environment: accountsConfig.nodeEnv
    };

    try {
        // Test database connection
        const { Pool } = await import('pg');
        const { dbConfig } = await import('./config.js');
        const pool = new Pool(dbConfig);
        
        await pool.query('SELECT 1');
        health.database_connected = true;
        await pool.end();
        
        // Check JWT secret configuration
        health.jwt_secret_configured = !!(accountsConfig.jwtSecret && accountsConfig.jwtSecret.length >= 32);
        
        // Set overall status based on critical components
        if (!health.database_connected) {
            health.status = 'unhealthy';
            health.message = 'Database connection failed';
            return res.status(503).json(health);
        }
        
        if (!health.jwt_secret_configured) {
            health.status = 'degraded';
            health.message = 'JWT secret not properly configured';
            return res.status(200).json(health);
        }
        
        res.json(health);
        
    } catch (error) {
        health.status = 'unhealthy';
        health.database_connected = false;
        health.message = `Health check failed: ${error.message}`;
        res.status(503).json(health);
    }
});

// Test route to verify server is receiving requests correctly
app.get('/test', (req, res) => {
    console.log('✅ Test route hit');
    res.json({ 
        message: 'Test route working',
        url: req.url,
        method: req.method,
        headers: req.headers
    });
});

// List all routes for debugging
app.get('/debug/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach((middleware) => {
        if (middleware.route) { // Routes registered directly on the app
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        } else if (middleware.name === 'router') { // Router middleware
            middleware.handle.stack.forEach((handler) => {
                if (handler.route) {
                    routes.push({
                        path: handler.route.path,
                        methods: Object.keys(handler.route.methods)
                    });
                }
            });
        }
    });
    res.json({ routes });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler with detailed logging
app.use('*', (req, res) => {
    console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
    console.log(`❌ Available routes logged above`);
    res.status(404).json({ 
        error: 'Route not found',
        method: req.method,
        url: req.url,
        message: 'Check server logs for available routes'
    });
});

// Initialize database and start server
async function startServer() {
    try {
        console.log('🚀 Starting Accounts API Server...');
        
        // Test database connection first
        console.log('📊 Testing database connection...');
        await initializeDatabase();
        
        app.listen(PORT, () => {
            console.log(`✅ Accounts server running on port ${PORT}`);
            console.log(`🌐 REST API: http://localhost:${PORT}`);
            console.log(`❤️  Health: http://localhost:${PORT}/health`);
            console.log(`🧪 Test: http://localhost:${PORT}/test`);
            console.log(`🔍 Debug routes: http://localhost:${PORT}/debug/routes`);
            console.log(`🔑 Auth endpoints should be at:`);
            console.log(`   📍 http://localhost:${PORT}/auth/login`);
            console.log(`   📍 http://localhost:${PORT}/auth/register`);
            console.log(`   📍 http://localhost:${PORT}/auth/me`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server only if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    startServer();
}

export {
    startServer
};