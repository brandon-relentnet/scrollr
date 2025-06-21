import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import linkedAccountsRoutes from './routes/linkedAccounts.js';
import adminRoutes from './routes/admin.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Accounts API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/linked-accounts', linkedAccountsRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: Date.now(),
        message: 'Accounts API server is running'
    });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', notFoundHandler);

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