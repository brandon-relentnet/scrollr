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

// ADD DEBUG LOGGING - This will show us exactly what requests are being received
app.use((req, res, next) => {
    console.log(`🔍 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log(`🔍 Headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`🔍 Body:`, req.body);
    next();
});

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
app.get('/health', (req, res) => {
    console.log('✅ Health check hit');
    res.json({
        status: 'healthy',
        timestamp: Date.now(),
        message: 'Accounts API server is running'
    });
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