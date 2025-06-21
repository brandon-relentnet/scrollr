// server.js is the main entry point for the backend. It orchestrates the ingest and daily schedule checks.
import schedule from 'node-schedule';
import { startApiServer, broadcastUpdatedGames } from './api.js';
import { ingestData } from './ingest.js';
import { runDailySchedule } from './dailySchedule.js';
import { initializeDatabase } from './db.js';
import { initializeDatabase as createTables } from './createTables.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

async function main() {
    try {
        console.log('📌 Starting Sports API Server...');

        // Test database connection and create tables
        console.log('📊 Testing database connection...');
        await initializeDatabase();
        
        console.log('🗄️ Creating database tables...');
        await createTables();

        // 1. Start Express API on port 4000
        console.log('🌐 Starting HTTP server on port 4000...');
        await startApiServer(4000);

        // Wait for server to be fully ready
        console.log('⏳ Waiting for server to be fully ready...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('✅ Sports API server running on port 4000');
        console.log('📊 WebSocket: ws://localhost:4000/ws');
        console.log('🌐 REST API: http://localhost:4000/api/games');
        console.log('❤️  Health: http://localhost:4000/health');

        // 2. Run initial ESPN ingest
        console.log('📥 Starting initial ESPN data ingest...');
        await ingestData();
        console.log('✅ Initial data ingest completed');

        // After ingest, broadcast updated data to all WebSocket clients
        await broadcastUpdatedGames();

        // 3. Run daily schedule check
        console.log('📅 Running daily schedule check...');
        await runDailySchedule();

        // 4. Schedule hourly runs at :00 of every hour
        schedule.scheduleJob('0 * * * *', async () => {
            console.log('[HourlySchedule] Running hourly check...');
            await ingestData();
            await runDailySchedule();
        });

        console.log('\n👂 Sports server is fully ready for connections...\n');

    } catch (error) {
        console.error('❌ Sports server startup failed:', error);
        process.exit(1);
    }
}

main().catch(err => {
    console.error('❌ Unhandled error in main:', err);
    process.exit(1);
});