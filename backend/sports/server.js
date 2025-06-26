// server.js is the main entry point for the backend. It orchestrates the ingest and daily schedule checks.
import schedule from "node-schedule";
import {
  startApiServer,
  broadcastUpdatedGames,
  setupGracefulShutdown,
} from "./api.js";
import { ingestData } from "./ingest.js";
import { runDailySchedule, cleanupScheduledJobs } from "./dailySchedule.js";
import { initializeDatabase } from "./db.js";
import { initializeDatabase as createTables } from "./createTables.js";
import { sportsConfig, validateConfig } from "./config.js";

// Validate configuration
validateConfig("sports");

async function main() {
  try {
    console.log("📌 Starting Sports API Server...");

    // Test database connection and create tables
    console.log("📊 Testing database connection...");
    await initializeDatabase();

    console.log("🗄️ Creating database tables...");
    await createTables();

    // 1. Start Express API
    const port = sportsConfig.port;
    console.log(`🌐 Starting HTTP server on port ${port}...`);
    const { httpServer } = await startApiServer(port);

    // Wait for server to be fully ready
    console.log("⏳ Waiting for server to be fully ready...");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log(`✅ Sports API server running on port ${port}`);
    console.log(`📊 WebSocket: ws://localhost:${port}/ws`);
    console.log("🌐 REST API: http://localhost:4000/api/games");
    console.log("❤️  Health: http://localhost:4000/health");

    // 2. Run initial ESPN ingest
    console.log("📥 Starting initial ESPN data ingest...");
    await ingestData();
    console.log("✅ Initial data ingest completed");

    // Debug: Check what games we have
    const { getLiveGames } = await import("./dbQueries.js");
    const liveGames = await getLiveGames();
    console.log("🎮 Current live games by league:", liveGames);

    // 3. Delay initial broadcast to allow clients to connect
    setTimeout(async () => {
      console.log("📡 Broadcasting initial data to connected clients...");
      await broadcastUpdatedGames();
    }, 2000); // Wait 2 seconds for clients to connect

    // 4. Run daily schedule check
    console.log("📅 Running daily schedule check...");
    await runDailySchedule();

    // 5. Schedule hourly runs at :00 of every hour
    schedule.scheduleJob("0 * * * *", async () => {
      console.log("[HourlySchedule] Running hourly check...");
      await ingestData();
      await runDailySchedule();
      await broadcastUpdatedGames();
    });

    // 6. Add a more frequent check for in-progress games
    schedule.scheduleJob("*/5 * * * *", async () => {
      // Check every 5 minutes if there are any in-progress games
      const { getNotFinalGamesToday } = await import("./dbQueries.js");
      const games = await getNotFinalGamesToday();
      const hasInProgressGames = games.some((game) => game.state === "in");

      if (hasInProgressGames) {
        console.log("[5-minute check] Found in-progress games, updating...");
        await ingestData();
        await broadcastUpdatedGames();
      }
    });

    console.log("\n👂 Sports server is fully ready for connections...\n");

    // Set up graceful shutdown
    setupGracefulShutdown(httpServer);

    // Add cleanup for scheduled jobs
    process.on("SIGTERM", () => cleanupScheduledJobs());
    process.on("SIGINT", () => cleanupScheduledJobs());
  } catch (error) {
    console.error("❌ Sports server startup failed:", error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Unhandled error in main:", err);
  process.exit(1);
});
