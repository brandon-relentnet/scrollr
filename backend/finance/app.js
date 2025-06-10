// app.js - Fixed version with proper imports and single server + skip flag support
const { startTradesApiServer, setupGracefulShutdown } = require('./api');
require('dotenv').config();
const pool = require('./db');

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
Usage: node app.js [options]

Options:
  -skip, --skip-closes           Skip fetching previous closes on startup
  -h, --help                     Show this help message

Examples:
  node app.js                    Start server with full initialization
  node app.js -skip             Start server without fetching previous closes
  node app.js --skip-closes     Same as above
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
        console.log('🚀 Starting Trades API Server...');

        // Test database connection first
        console.log('📊 Testing database connection...');
        try {
            await pool.query('SELECT 1');
            console.log('✅ Database connection successful');
        } catch (dbError) {
            console.error('❌ Database connection failed:', dbError);
            console.error('Please ensure your database is running and .env is configured correctly');
            process.exit(1);
        }

        // Parse command line arguments
        const options = parseCommandLineArgs();

        if (options.skipPreviousCloses) {
            console.log('⏭️  Skipping previous closes update (--skip flag detected)');
        }

        // Start the trades API server
        const port = process.env.PORT || 4001;
        console.log(`🌐 Starting HTTP server on port ${port}...`);

        const { httpServer, wss } = await startTradesApiServer(port, options);

        // Wait for server to be fully ready
        console.log('⏳ Waiting for server to be fully ready...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Setup graceful shutdown
        setupGracefulShutdown(httpServer);

        console.log('\n✅ Trades API ready!');
        console.log(`📊 WebSocket: ws://localhost:${port}/ws`);
        console.log(`🌐 REST API: http://localhost:${port}/api/trades`);
        console.log(`❤️  Health: http://localhost:${port}/health`);

        if (options.skipPreviousCloses) {
            console.log('⚠️  Previous closes were skipped - real-time updates may be inaccurate');
        }

        console.log('\n👂 Server is ready for connections...\n');

        return { httpServer, wss };

    } catch (error) {
        console.error('❌ Failed to start trades server:', error);
        process.exit(1);
    }
}

// Start the server only if this file is run directly
if (require.main === module) {
    startServer();
}

module.exports = {
    startServer
};