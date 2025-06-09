require('dotenv').config();
const schedule = require('node-schedule');
const { getNotFinalGamesToday, areAllGamesFinal } = require('./dbQueries');
const { ingestData } = require('./ingest');
const { broadcastUpdatedGames } = require('./api');

const scheduledLeagueJobs = {};

/**
 * runDailySchedule:
 * 1. Finds all leagues with games "today" that are not final.
 * 2. For each league, find the earliest start time.
 * 3. Schedule a frequent poll job for each league.
 */
async function runDailySchedule() {
    console.log('🗓️ Running daily schedule check...');

    try {
        // 1. Get all not-final games for today
        const rows = await getNotFinalGamesToday();
        if (rows.length === 0) {
            console.log('❌ No upcoming games today. Nothing to schedule.');
            return;
        }

        // Extract league names
        const leaguesWithGames = rows.map((r) => r.league);
        console.log(`\n--- Today's Games (Not Final) ---`);
        console.log(`Leagues with upcoming or in-progress games:`, [...new Set(leaguesWithGames)]);

        // 2. Build a map: { leagueName -> { earliestStart, hasInProgress } }
        const leagueMap = {};
        for (const row of rows) {
            const { league, start_time, state } = row;

            // Convert start_time (string) into a Date object for comparison
            const startTimeDate = new Date(start_time);

            if (!leagueMap[league]) {
                leagueMap[league] = {
                    earliestStart: startTimeDate,
                    hasInProgress: false,
                };
            } else if (startTimeDate < leagueMap[league].earliestStart) {
                leagueMap[league].earliestStart = startTimeDate;
            }

            if (state === 'in') {
                leagueMap[league].hasInProgress = true;
            }
        }

        // 3. For each league, schedule or immediately start frequent polling
        for (const league of Object.keys(leagueMap)) {
            const { earliestStart, hasInProgress } = leagueMap[league];
            const pollStartTime = new Date(earliestStart.getTime() - 15 * 60_000); // 15 minutes earlier
            const now = new Date();

            if (pollStartTime < now || hasInProgress) {
                console.log(`🕒 ${league}: Earliest start is in the past OR a game is in-progress. Starting poll now.`);
                startFrequentPoll(league);
            } else {
                console.log(`🕒 ${league}: Scheduling frequent poll to start at ${pollStartTime}.`);
                schedule.scheduleJob(pollStartTime, () => {
                    console.log(`Time reached for ${league}. Starting frequent poll...`);
                    startFrequentPoll(league);
                });
            }
        }

        console.log('Daily schedule check complete.\n');
    } catch (err) {
        console.error('Error in runDailySchedule:', err);
    }
}

/**
 * startFrequentPoll(league):
 * - Creates a node-schedule job that runs every 1 min.
 * - Calls ingestData() for just that league.
 * - Cancels itself if all games become final.
 */
function startFrequentPoll(league) {
    if (scheduledLeagueJobs[league]) {
        console.log(`Cancelling existing poll job for ${league} before starting new.`);
        scheduledLeagueJobs[league].cancel();
        delete scheduledLeagueJobs[league];
    }

    const job = schedule.scheduleJob('*/1 * * * *', async function () {
        console.log(`[${new Date().toISOString()}] Frequent poll for ${league}`);

        try {
            // The ingestData function can accept an array of { name, slug }.
            // We'll get the slug from leagueConfigs.
            await ingestData([{ name: league, slug: getSlugForLeague(league) }]);
            await broadcastUpdatedGames(league);

            // Check if all games are final
            const done = await areAllGamesFinal(league);
            if (done) {
                console.log(`All ${league} games are final! Cancelling frequent poll.`);
                job.cancel();
                delete scheduledLeagueJobs[league];
            }
        } catch (err) {
            console.error(`Error during frequent poll of ${league}:`, err);
        }
    });

    scheduledLeagueJobs[league] = job;
}

// Helper to find the "slug" given a league name
function getSlugForLeague(leagueName) {
    const leagueConfigs = require('./leagueConfigs');
    const found = leagueConfigs.find((cfg) => cfg.name === leagueName);
    return found ? found.slug : null;
}

module.exports = { runDailySchedule };
