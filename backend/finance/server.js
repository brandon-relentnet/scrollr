// server.js - Standardized Finance API Server
import { startTradesApiServer, setupGracefulShutdown } from './api.js';
import { initializeDatabase } from './db.js';
import { initializeDatabase as createTables } from './createTables.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { financeConfig, validateConfig } from './config.js';

// Validate configuration
validateConfig('finance');

function parseCommandLineArgs() {
    const args = process.argv.slice(2);
    const options = {
        skipPreviousCloses: false
    };

    for (const arg of args) {
        switch (arg.toLowerCase()) {
            case '-skip':
            case '--skip':
            case '-skip-closes':
            case '--skip-closes':
            case '-skip-previous-closes':
            case '--skip-previous-closes':
                options.skipPreviousCloses = true;
                break;
            case '-h':
            case '--help':
                console.log(`
Usage: node server.js [options]

Options:
  -skip, --skip-closes           Skip fetching previous closes on startup
  -h, --help                     Show this help message

Examples:
  node server.js                    Start server with full initialization
  node server.js -skip             Start server without fetching previous closes
  node server.js --skip-closes     Same as above
`);
                process.exit(0);
                break;
            default:
                if (arg.startsWith('-')) {
                    console.warn(`Warning: Unknown option '${arg}'. Use --help for available options.`);
                }
        }
    }

    return options;
}

async function startServer() {
    try {
        console.log('🚀 Starting Finance API Server...');

        // Test database connection and create tables
        console.log('📊 Testing database connection...');
        await initializeDatabase();
        
        console.log('🗄️ Creating database tables...');
        await createTables();

        // Parse command line arguments
        const options = parseCommandLineArgs();

        if (options.skipPreviousCloses) {
            console.log('⏭️  Skipping previous closes update (--skip flag detected)');
        }

        // Start the trades API server
        const port = financeConfig.port;
        console.log(`🌐 Starting HTTP server on port ${port}...`);

        const { httpServer, wss } = await startTradesApiServer(port, options);

        // Wait for server to be fully ready
        console.log('⏳ Waiting for server to be fully ready...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Setup graceful shutdown
        setupGracefulShutdown(httpServer);

        console.log('\n✅ Finance API server running on port ' + port);
        console.log(`📊 WebSocket: ws://localhost:${port}/ws`);
        console.log(`🌐 REST API: http://localhost:${port}/api/trades`);
        console.log(`❤️  Health: http://localhost:${port}/health`);

        if (options.skipPreviousCloses) {
            console.log('⚠️  Previous closes were skipped - real-time updates may be inaccurate');
        }

        console.log('\n👂 Server is ready for connections...\n');

        return { httpServer, wss };

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