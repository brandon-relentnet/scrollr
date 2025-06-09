// server.js is the main entry point for the backend. It orchestrates the ingest and daily schedule checks.
const schedule = require('node-schedule')
const { startApiServer, broadcastUpdatedGames } = require('./api') 
const { ingestData } = require('./ingest')
const { runDailySchedule } = require('./dailySchedule')

async function main() {
    console.log('📌 server.js started. Will check for updates hourly (at :00) plus any dynamic jobs.')

    // 1. Start Express API on port 4000
    await startApiServer(4000)

    // 2. Run initial ESPN ingest
    console.log('Starting ESPN ingest...')
    await ingestData()

    // After ingest, broadcast updated data to all WebSocket clients
    await broadcastUpdatedGames()

    // 3. Run daily schedule check
    console.log('Starting daily schedule check...')
    await runDailySchedule()

    // 4. Schedule hourly runs at :00 of every hour
    schedule.scheduleJob('0 * * * *', async () => {
        console.log('[HourlySchedule] Running hourly check...')
        await ingestData()
        await runDailySchedule()
    })
}

main().catch(err => console.error('server.js Error:', err))