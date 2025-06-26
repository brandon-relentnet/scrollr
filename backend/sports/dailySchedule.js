import dotenv from "dotenv";
import schedule from "node-schedule";
import { getNotFinalGamesToday, areAllGamesFinal } from "./dbQueries.js";
import { ingestData } from "./ingest.js";
import { broadcastUpdatedGames } from "./api.js";
import leagueConfigs from "./leagueConfigs.js";

dotenv.config();

const scheduledLeagueJobs = {};

// Cleanup function for graceful shutdown
function cleanupScheduledJobs() {
  console.log("🧹 Cleaning up scheduled jobs...");
  Object.keys(scheduledLeagueJobs).forEach((league) => {
    if (scheduledLeagueJobs[league]) {
      if (scheduledLeagueJobs[league].cancel) {
        scheduledLeagueJobs[league].cancel();
      }
      delete scheduledLeagueJobs[league];
    }
  });
}

/**
 * runDailySchedule:
 * 1. Finds all leagues with games "today" that are not final.
 * 2. For each league, find the earliest start time.
 * 3. Schedule a frequent poll job for each league.
 */
async function runDailySchedule() {
  console.log("🗓️ Running daily schedule check...");

  try {
    // 1. Get all not-final games for today
    const rows = await getNotFinalGamesToday();
    if (rows.length === 0) {
      console.log("❌ No upcoming games today. Nothing to schedule.");
      return;
    }

    // Extract league names
    const leaguesWithGames = rows.map((r) => r.league);
    console.log(`\n--- Today's Games (Not Final) ---`);
    console.log(`Leagues with upcoming or in-progress games:`, [
      ...new Set(leaguesWithGames),
    ]);

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
          inProgressCount: 0,
          upcomingCount: 0,
        };
      } else if (startTimeDate < leagueMap[league].earliestStart) {
        leagueMap[league].earliestStart = startTimeDate;
      }

      if (state === "in") {
        leagueMap[league].hasInProgress = true;
        leagueMap[league].inProgressCount++;
      } else if (state === "pre") {
        leagueMap[league].upcomingCount++;
      }
    }

    // 3. For each league, schedule or immediately start frequent polling
    for (const league of Object.keys(leagueMap)) {
      const { earliestStart, hasInProgress, inProgressCount, upcomingCount } =
        leagueMap[league];
      const pollStartTime = new Date(earliestStart.getTime() - 15 * 60_000); // 15 minutes earlier
      const now = new Date();

      console.log(
        `📊 ${league}: ${inProgressCount} in-progress, ${upcomingCount} upcoming games`
      );

      if (hasInProgress) {
        console.log(
          `🔴 ${league}: ${inProgressCount} game(s) currently LIVE! Starting immediate frequent poll.`
        );
        startFrequentPoll(league, true); // Pass flag for in-progress games
      } else if (pollStartTime < now) {
        console.log(
          `🟡 ${league}: Games starting soon or past start time. Starting frequent poll.`
        );
        startFrequentPoll(league, false);
      } else {
        console.log(
          `🕒 ${league}: Scheduling frequent poll to start at ${pollStartTime.toLocaleString()}.`
        );
        schedule.scheduleJob(pollStartTime, () => {
          console.log(
            `⏰ Time reached for ${league}. Starting frequent poll...`
          );
          startFrequentPoll(league, false);
        });
      }
    }

    console.log("✅ Daily schedule check complete.\n");
  } catch (err) {
    console.error("❌ Error in runDailySchedule:", err);
  }
}

/**
 * startFrequentPoll(league, isLive):
 * - Creates a polling interval that runs every 1 min (or 30 seconds for live games).
 * - Calls ingestData() for just that league.
 * - Cancels itself if all games become final.
 */
function startFrequentPoll(league, isLive = false) {
  // Cancel any existing job for this league
  if (scheduledLeagueJobs[league]) {
    console.log(
      `🔄 Cancelling existing poll job for ${league} before starting new.`
    );
    if (scheduledLeagueJobs[league].cancel) {
      scheduledLeagueJobs[league].cancel();
    } else if (scheduledLeagueJobs[league].clear) {
      clearInterval(scheduledLeagueJobs[league].clear);
    }
    delete scheduledLeagueJobs[league];
  }

  // Use more frequent polling for live games
  const pollIntervalMs = isLive ? 30000 : 60000; // 30 seconds for live, 1 minute otherwise
  const intervalDesc = isLive ? "30 seconds" : "1 minute";

  console.log(`⏱️  Starting ${intervalDesc} polling for ${league} games`);

  // Create a wrapper object that can be cancelled
  const jobWrapper = {
    interval: null,
    cancel: function () {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    },
  };

  // Start immediate poll
  pollLeague(league, isLive);

  // Then set up the interval
  jobWrapper.interval = setInterval(async () => {
    await pollLeague(league, isLive);
  }, pollIntervalMs);

  scheduledLeagueJobs[league] = jobWrapper;
}

// Separate polling logic into its own function
async function pollLeague(league, isLive) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔄 Polling ${league} games...`);

  try {
    // The ingestData function can accept an array of { name, slug }.
    // We'll get the slug from leagueConfigs.
    await ingestData([{ name: league, slug: getSlugForLeague(league) }]);

    // Broadcast updates to all connected clients
    await broadcastUpdatedGames(league);

    // Check if all games are final
    const done = await areAllGamesFinal(league);
    if (done) {
      console.log(`✅ All ${league} games are final! Stopping frequent poll.`);
      if (scheduledLeagueJobs[league]) {
        scheduledLeagueJobs[league].cancel();
        delete scheduledLeagueJobs[league];
      }
      return;
    }

    // Check if we need to switch polling frequency
    const games = await getNotFinalGamesToday();
    const leagueGames = games.filter((g) => g.league === league);
    const liveGames = leagueGames.filter((g) => g.state === "in").length;

    if (liveGames > 0 && !isLive) {
      // Switch to more frequent polling
      console.log(
        `🔴 ${league} now has ${liveGames} LIVE games! Switching to 30-second polling.`
      );
      startFrequentPoll(league, true);
    } else if (liveGames === 0 && isLive) {
      // Switch back to normal polling
      console.log(
        `🟡 ${league} no longer has live games. Switching to 1-minute polling.`
      );
      startFrequentPoll(league, false);
    }
  } catch (err) {
    console.error(`❌ Error during frequent poll of ${league}:`, err);
  }
}

// Helper to find the "slug" given a league name
function getSlugForLeague(leagueName) {
  const found = leagueConfigs.find((cfg) => cfg.name === leagueName);
  return found ? found.slug : null;
}

export { runDailySchedule, cleanupScheduledJobs };
