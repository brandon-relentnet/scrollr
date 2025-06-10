// server.js is the main entry point for the backend. It orchestrates the ingest and daily schedule checks.
const schedule = require('node-schedule')
const { startApiServer, broadcastUpdatedGames } = require('./api') 
const { ingestData } = require('./ingest')
const { runDailySchedule } = require('./dailySchedule')

async function main() {
    try {
        console.log('📌 Starting Sports API Server...');

        // Test database connection first
        console.log('📊 Testing database connection...');
        try {
            const pool = require('./db');
            await pool.query('SELECT 1');
            console.log('✅ Database connection successful');
        } catch (dbError) {
            console.error('❌ Database connection failed:', dbError);
            console.error('Please ensure your database is running and .env is configured correctly');
            process.exit(1);
        }

        // 1. Start Express API on port 4000
        console.log('🌐 Starting HTTP server on port 4000...');
        await startApiServer(4000);

        // Wait for server to be fully ready
        console.log('⏳ Waiting for server to be fully ready...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('✅ Sports API server is ready!');
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