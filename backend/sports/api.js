// api.js - Production-grade sports API with enhanced WebSocket management
import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { getAllGames, getGamesByLeague } from "./dbQueries.js";
import pool from "./db.js";
import { sportsConfig } from "./config.js";

let wss = null; // WebSocket server reference
const clients = new Set(); // Track connected clients and their filters
const clientFilters = new Map(); // Map client to their current filters

// PRODUCTION FIX: Enhanced caching and performance monitoring
const filterCache = new Map();
const gamesCache = { data: null, timestamp: 0 };
const CACHE_TTL = 5000; // 5 seconds cache for filtered results
const GAMES_CACHE_TTL = 3000; // 3 seconds for games data
const BROADCAST_THROTTLE = 2000; // Throttle broadcasts to max once per 2 seconds

let lastBroadcastTime = 0;
let pendingBroadcast = null;

// PRODUCTION FIX: Add connection and performance monitoring
let broadcastStats = {
  lastBroadcast: 0,
  totalBroadcasts: 0,
  failedBroadcasts: 0,
  totalConnections: 0,
  totalDisconnections: 0,
  peakClients: 0,
  messagesProcessed: 0,
  errors: 0,
};

/**
 * PRODUCTION FIX: Cached games retrieval with better error handling
 */
async function getCachedGames() {
  const now = Date.now();
  if (gamesCache.data && now - gamesCache.timestamp < GAMES_CACHE_TTL) {
    return gamesCache.data;
  }

  try {
    const games = await getAllGames();
    gamesCache.data = games;
    gamesCache.timestamp = now;
    return games;
  } catch (error) {
    console.error("❌ Error fetching games:", error);
    // Return cached data if available, even if stale
    return gamesCache.data || [];
  }
}

/**
 * Filter games based on selected filters
 * NOW PROPERLY HANDLES EMPTY FILTERS WITH CACHING
 */
async function getFilteredGames(filters) {
  try {
    if (!filters || filters.length === 0) {
      // No filters = return empty array (not all games)
      return [];
    }

    const cacheKey = JSON.stringify(filters.sort());
    const now = Date.now();

    // PRODUCTION FIX: Check cache first
    if (filterCache.has(cacheKey)) {
      const cached = filterCache.get(cacheKey);
      if (now - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }

    // Extract league filters - your filters will be like ["NFL", "MLB"] directly
    const leagueFilters = filters.filter((f) =>
      ["NFL", "NBA", "MLB", "NHL"].includes(f)
    );

    // Extract state filters
    const stateFilters = filters
      .filter((f) => f.startsWith("state_"))
      .map((f) => f.replace("state_", ""));

    let allFilteredGames = [];

    // If we have league filters, get games for those leagues
    if (leagueFilters.length > 0) {
      // PRODUCTION FIX: Process leagues in parallel for better performance
      const leaguePromises = leagueFilters.map((league) =>
        getGamesByLeague(league)
      );
      const leagueResults = await Promise.all(leaguePromises);
      allFilteredGames = leagueResults.flat();

      // If we also have state filters, filter further
      if (stateFilters.length > 0) {
        allFilteredGames = allFilteredGames.filter((game) =>
          stateFilters.includes(game.state)
        );
      }
    } else if (stateFilters.length > 0) {
      // If only state filters (no league filters), get all games then filter by state
      const allGames = await getCachedGames();
      allFilteredGames = allGames.filter((game) =>
        stateFilters.includes(game.state)
      );
    }

    // PRODUCTION FIX: Cache the result
    filterCache.set(cacheKey, { data: allFilteredGames, timestamp: now });

    // PRODUCTION FIX: Limit cache size to prevent memory leaks
    if (filterCache.size > 100) {
      const firstKey = filterCache.keys().next().value;
      filterCache.delete(firstKey);
    }

    return allFilteredGames;
  } catch (err) {
    console.error("❌ Error filtering games:", err);
    broadcastStats.errors++;
    return [];
  }
}

/**
 * Get all games (separate function for when you actually want all games)
 */
async function getAllGamesForAPI() {
  try {
    return await getCachedGames();
  } catch (err) {
    console.error("❌ Error fetching all games:", err);
    broadcastStats.errors++;
    return [];
  }
}

/**
 * PRODUCTION FIX: Enhanced client message sending with error handling
 */
function sendToClient(client, data) {
  if (client.readyState === WebSocket.OPEN) {
    try {
      client.send(JSON.stringify(data));
      return true;
    } catch (err) {
      console.error("❌ Error sending to client:", err);
      clients.delete(client);
      clientFilters.delete(client);
      broadcastStats.errors++;
      return false;
    }
  }
  return false;
}

/**
 * PRODUCTION FIX: Enhanced message handling with better validation and logging
 */
async function handleClientMessage(ws, data) {
  broadcastStats.messagesProcessed++;

  // Basic validation
  if (!data || typeof data !== "object") {
    sendToClient(ws, {
      type: "error",
      message: "Invalid message format",
      timestamp: Date.now(),
    });
    return;
  }

  console.log(`📥 [${data.type}] Message from client`);

  try {
    switch (data.type) {
      case "connection":
        console.log(
          "🔌 Client connection confirmed at:",
          new Date(data.timestamp)
        );
        sendToClient(ws, {
          type: "connection_confirmed",
          message: "Connection established. Send filter_request to get games.",
          timestamp: Date.now(),
        });
        break;

      case "filter_request":
        await handleFilterRequest(ws, data.filters);
        break;

      case "get_all_games":
        await handleGetAllGames(ws);
        break;

      case "user_message":
        console.log("💬 User message:", data.message);
        sendToClient(ws, {
          type: "echo",
          original_message: data.message,
          timestamp: Date.now(),
          message: `Server received: "${data.message}"`,
        });
        break;

      case "test_request":
        console.log("🧪 Test request received");
        sendToClient(ws, {
          type: "new_data",
          data: {
            random_number: Math.floor(Math.random() * 1000),
            server_time: new Date().toISOString(),
            message: "This is test data from the games API server",
          },
          timestamp: Date.now(),
        });
        break;

      case "ping":
        sendToClient(ws, { type: "pong", timestamp: Date.now() });
        break;

      default:
        console.log("❓ Unknown message type:", data.type);
        sendToClient(ws, {
          type: "error",
          message: "Unknown message type",
          timestamp: Date.now(),
        });
    }
  } catch (error) {
    console.error("❌ Error handling client message:", error);
    broadcastStats.errors++;
    sendToClient(ws, {
      type: "error",
      message: "Server error processing request",
      timestamp: Date.now(),
    });
  }
}

async function handleFilterRequest(ws, filters) {
  console.log("🔍 Filter request:", filters);
  // Store client's current filters
  clientFilters.set(ws, filters || []);

  try {
    // Get filtered results
    const filteredGames = await getFilteredGames(filters);
    const responseMessage =
      filters?.length === 0
        ? "No filters selected. Select sports or finance options to see games."
        : `Found ${filteredGames.length} games matching your filters`;

    console.log(`✅ Sending ${filteredGames.length} games to client`);

    sendToClient(ws, {
      type: "filtered_data",
      data: filteredGames,
      filters: filters || [],
      count: filteredGames.length,
      message: responseMessage,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("❌ Error handling filter request:", error);
    sendToClient(ws, {
      type: "error",
      message: "Failed to process filters",
      timestamp: Date.now(),
    });
  }
}

async function handleGetAllGames(ws) {
  console.log("📊 Request for all games");
  try {
    const allGames = await getAllGamesForAPI();
    sendToClient(ws, {
      type: "all_games_data",
      data: allGames,
      count: allGames.length,
      message: `Loaded ${allGames.length} total games`,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("❌ Error fetching all games:", error);
    sendToClient(ws, {
      type: "error",
      message: "Failed to fetch games",
      timestamp: Date.now(),
    });
  }
}

/**
 * PRODUCTION FIX: Smart cache clearing
 */
function clearCaches() {
  filterCache.clear();
  // Only clear games cache if it's older than 30 seconds
  if (gamesCache.timestamp && Date.now() - gamesCache.timestamp > 30000) {
    gamesCache.data = null;
    gamesCache.timestamp = 0;
  }
}

/**
 * startApiServer(port):
 *   1) Creates Express app with API routes (optional - keep if you need REST endpoints)
 *   2) Creates WebSocket server for real-time filtering
 *   3) Listens on the specified port
 */
function startApiServer(port = sportsConfig.port || 4000) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // PRODUCTION FIX: Add rate limiting middleware
  const requestCounts = new Map();
  const RATE_LIMIT_WINDOW = 60000; // 1 minute
  const RATE_LIMIT_MAX = 100; // Max requests per window

  app.use((req, res, next) => {
    const clientIP =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      "unknown";
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;

    if (!requestCounts.has(clientIP)) {
      requestCounts.set(clientIP, []);
    }

    const requests = requestCounts.get(clientIP);
    const recentRequests = requests.filter(
      (timestamp) => timestamp > windowStart
    );

    if (recentRequests.length >= RATE_LIMIT_MAX) {
      return res.status(429).json({
        error: "Too many requests",
        message: `Rate limit exceeded. Max ${RATE_LIMIT_MAX} requests per minute.`,
        retryAfter: Math.ceil((requests[0] + RATE_LIMIT_WINDOW - now) / 1000),
      });
    }

    recentRequests.push(now);
    requestCounts.set(clientIP, recentRequests);

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      // 1% chance to clean up
      for (const [ip, timestamps] of requestCounts) {
        const validTimestamps = timestamps.filter((t) => t > windowStart);
        if (validTimestamps.length === 0) {
          requestCounts.delete(ip);
        } else {
          requestCounts.set(ip, validTimestamps);
        }
      }
    }

    next();
  });

  // Optional: Keep REST API routes if you still need them
  app.get("/games", async (req, res) => {
    try {
      const games = await getAllGamesForAPI();
      res.json(games);
    } catch (err) {
      console.error("❌ Error fetching all games:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/games/:league", async (req, res) => {
    try {
      const leagueName = req.params.league.toUpperCase();
      if (!["NFL", "NBA", "MLB", "NHL"].includes(leagueName)) {
        return res
          .status(400)
          .json({ error: "Invalid league. Must be NFL, NBA, MLB, or NHL" });
      }
      const games = await getGamesByLeague(leagueName);
      res.json(games);
    } catch (err) {
      console.error("❌ Error fetching league games:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // PRODUCTION FIX: Enhanced health check with comprehensive monitoring
  app.get("/health", async (req, res) => {
    const health = {
      status: "healthy",
      timestamp: Date.now(),
      service: "sports",
      version: "1.0.0",
      message: "Sports API server is running",
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      websocket_clients: clients.size,
      database_connected: false,
      espn_api_accessible: false,
      environment: process.env.NODE_ENV || "development",
      // PRODUCTION FIX: Add comprehensive stats
      performance_stats: {
        cache_size: filterCache.size,
        games_cache_age: gamesCache.timestamp
          ? Date.now() - gamesCache.timestamp
          : null,
        last_broadcast_age: broadcastStats.lastBroadcast
          ? Date.now() - broadcastStats.lastBroadcast
          : null,
        total_broadcasts: broadcastStats.totalBroadcasts,
        failed_broadcasts: broadcastStats.failedBroadcasts,
        total_connections: broadcastStats.totalConnections,
        total_disconnections: broadcastStats.totalDisconnections,
        peak_clients: broadcastStats.peakClients,
        messages_processed: broadcastStats.messagesProcessed,
        total_errors: broadcastStats.errors,
      },
    };

    try {
      // Test database connection
      await pool.query("SELECT 1");
      health.database_connected = true;

      // PRODUCTION FIX: Better ESPN API connectivity test
      try {
        const testUrl = `${sportsConfig.espnApiUrl}/basketball/nba/scoreboard`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(testUrl, {
          method: "HEAD",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        health.espn_api_accessible = response.ok;
      } catch (espnError) {
        console.warn(
          "⚠️ ESPN API connectivity test failed:",
          espnError.message
        );
        health.espn_api_accessible = false;
      }

      // PRODUCTION FIX: Check for potential issues
      const broadcastAge = broadcastStats.lastBroadcast
        ? Date.now() - broadcastStats.lastBroadcast
        : null;
      if (clients.size > 0 && broadcastAge && broadcastAge > 300000) {
        // No broadcast in 5 minutes with clients
        health.status = "degraded";
        health.message = "No recent broadcasts detected with active clients";
      }

      // Set overall status based on critical components
      if (!health.database_connected) {
        health.status = "unhealthy";
        health.message = "Database connection failed";
        return res.status(503).json(health);
      }

      if (!health.espn_api_accessible) {
        health.status = "degraded";
        health.message =
          "ESPN API not accessible - some features may be limited";
      }

      res.json(health);
    } catch (error) {
      health.status = "unhealthy";
      health.database_connected = false;
      health.message = `Health check failed: ${error.message}`;
      res.status(503).json(health);
    }
  });

  // PRODUCTION FIX: Add debug endpoints for monitoring
  app.get("/debug/stats", (req, res) => {
    res.json({
      clients: clients.size,
      filters: clientFilters.size,
      cache_entries: filterCache.size,
      broadcast_stats: broadcastStats,
      memory_usage: process.memoryUsage(),
      uptime: process.uptime(),
    });
  });

  // Create HTTP server
  const httpServer = http.createServer(app);

  // PRODUCTION FIX: Enhanced WebSocket server with production settings
  wss = new WebSocketServer({
    server: httpServer, // Attach to HTTP server so both REST and WS work
    path: "/ws", // Optional: specific path for WebSocket connections
    perMessageDeflate: false, // Disable compression for better performance
    maxPayload: 16 * 1024, // 16KB max message size
    clientTracking: true, // Enable client tracking for cleanup
  });

  console.log("🔌 WebSocket server created");

  wss.on("connection", (ws, request) => {
    clients.add(ws);
    clientFilters.set(ws, []); // Initialize with no filters

    broadcastStats.totalConnections++;
    broadcastStats.peakClients = Math.max(
      broadcastStats.peakClients,
      clients.size
    );

    const clientIP =
      request.headers["x-forwarded-for"] ||
      request.connection.remoteAddress ||
      "unknown";
    console.log(`🔌 Client connected from ${clientIP}. Total: ${clients.size}`);

    // PRODUCTION FIX: Add connection heartbeat
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    // Send welcome message
    sendToClient(ws, {
      type: "welcome",
      message: "Connected to games API WebSocket",
      timestamp: Date.now(),
    });

    // Handle incoming messages
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        await handleClientMessage(ws, data);
      } catch (error) {
        console.error("❌ Message parse error:", error);
        broadcastStats.errors++;
        sendToClient(ws, {
          type: "error",
          message: "Invalid JSON format",
          timestamp: Date.now(),
        });
      }
    });

    ws.on("close", (code, reason) => {
      clients.delete(ws);
      clientFilters.delete(ws);
      broadcastStats.totalDisconnections++;
      console.log(
        `🔌 Client disconnected (${code}: ${reason}). Total: ${clients.size}`
      );
    });

    ws.on("error", (error) => {
      console.error("❌ WebSocket error:", error);
      clients.delete(ws);
      clientFilters.delete(ws);
      broadcastStats.errors++;
    });
  });

  // PRODUCTION FIX: Add WebSocket heartbeat interval
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        console.log("💔 Terminating unresponsive client");
        clients.delete(ws);
        clientFilters.delete(ws);
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // Check every 30 seconds

  // Clean up heartbeat on server close
  wss.on("close", () => {
    clearInterval(heartbeatInterval);
  });

  // Start listening
  return new Promise((resolve, reject) => {
    httpServer
      .listen(port, () => {
        console.log(`\n🚀 Sports API running on http://localhost:${port}`);
        console.log(`🔌 WebSocket endpoint: ws://localhost:${port}/ws`);
        console.log(`📊 Health check: http://localhost:${port}/health`);
        resolve({ httpServer, wss });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

/**
 * PRODUCTION FIX: Enhanced broadcasting with throttling and better error handling
 */
async function broadcastUpdatedGames(optionalLeague) {
  const now = Date.now();

  // Throttle broadcasts
  if (now - lastBroadcastTime < BROADCAST_THROTTLE) {
    if (!pendingBroadcast) {
      pendingBroadcast = setTimeout(() => {
        pendingBroadcast = null;
        broadcastUpdatedGames(optionalLeague);
      }, BROADCAST_THROTTLE - (now - lastBroadcastTime));
    }
    return;
  }

  lastBroadcastTime = now;

  if (!wss || clients.size === 0) {
    console.log("⚠️ No WebSocket server or clients for broadcast");
    return;
  }

  try {
    broadcastStats.lastBroadcast = now;
    broadcastStats.totalBroadcasts++;

    // Clear filter cache to ensure fresh data
    clearCaches();

    console.log(
      `📡 Broadcasting game updates${
        optionalLeague ? ` for league: ${optionalLeague}` : " for all leagues"
      } to ${clients.size} clients`
    );

    // Notify all clients that data has been updated
    const updateNotification = {
      type: "games_updated",
      league: optionalLeague || "ALL",
      message: optionalLeague
        ? `New data available for ${optionalLeague} league`
        : "New game data available",
      timestamp: now,
    };

    // Send notification to all clients
    const notificationPromises = [];
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        notificationPromises.push(
          new Promise((resolve) => {
            try {
              client.send(JSON.stringify(updateNotification));
              resolve(true);
            } catch (error) {
              console.error("❌ Error sending notification:", error);
              clients.delete(client);
              clientFilters.delete(client);
              resolve(false);
            }
          })
        );
      }
    });

    await Promise.all(notificationPromises);

    // PRODUCTION FIX: Group clients by identical filter sets for efficiency
    const filterGroups = new Map();

    for (const [client, filters] of clientFilters) {
      if (client.readyState === WebSocket.OPEN) {
        const filterKey = JSON.stringify(filters.sort());
        if (!filterGroups.has(filterKey)) {
          filterGroups.set(filterKey, { filters, clients: [] });
        }
        filterGroups.get(filterKey).clients.push(client);
      } else {
        // Clean up dead connections
        clients.delete(client);
        clientFilters.delete(client);
      }
    }

    console.log(`📊 Processing ${filterGroups.size} unique filter groups`);

    // Refresh each unique filter group
    const refreshPromises = Array.from(filterGroups.values()).map(
      async ({ filters, clients }) => {
        try {
          const refreshedData = await getFilteredGames(filters);

          const responseMessage =
            filters.length === 0
              ? "No filters selected. Select sports or finance options to see games."
              : `Updated: ${refreshedData.length} games match your current filters`;

          const message = {
            type: "filtered_data",
            data: refreshedData,
            filters: filters,
            count: refreshedData.length,
            message: responseMessage,
            is_refresh: true,
            timestamp: now,
          };

          // Send to all clients in this group
          clients.forEach((client) => sendToClient(client, message));
          console.log(
            `✅ Sent update to ${clients.length} clients with ${refreshedData.length} games`
          );
        } catch (err) {
          console.error("❌ Error refreshing client data:", err);
          broadcastStats.failedBroadcasts++;
        }
      }
    );

    // Process in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < refreshPromises.length; i += batchSize) {
      await Promise.all(refreshPromises.slice(i, i + batchSize));
    }

    console.log(`✅ Broadcast complete - updated ${clients.size} clients`);
  } catch (error) {
    console.error("❌ Broadcast error:", error);
    broadcastStats.failedBroadcasts++;
  }
}

/**
 * Utility function to broadcast to all clients
 */
function broadcast(data) {
  if (!wss || clients.size === 0) return;

  const message = JSON.stringify(data);
  let successCount = 0;
  let failCount = 0;

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
        successCount++;
      } catch (error) {
        console.error("❌ Error broadcasting to client:", error);
        clients.delete(client);
        clientFilters.delete(client);
        failCount++;
      }
    } else {
      clients.delete(client);
      clientFilters.delete(client);
      failCount++;
    }
  });

  console.log(
    `📡 Broadcast sent to ${successCount} clients, ${failCount} failed`
  );
}

/**
 * PRODUCTION FIX: Enhanced connection stats
 */
function getConnectionStats() {
  return {
    total_clients: clients.size,
    clients_with_filters: Array.from(clientFilters.entries()).filter(
      ([client, filters]) => filters.length > 0
    ).length,
    cache_size: filterCache.size,
    games_cache_age: gamesCache.timestamp
      ? Date.now() - gamesCache.timestamp
      : null,
    broadcast_stats: broadcastStats,
    memory_usage: process.memoryUsage(),
    uptime: process.uptime(),
  };
}

/**
 * PRODUCTION FIX: Graceful shutdown handling
 */
function setupGracefulShutdown(httpServer) {
  console.log("🛡️ Setting up graceful shutdown handlers...");

  function shutdown(signal) {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

    // Close HTTP server
    httpServer.close(() => {
      console.log("✅ HTTP server closed");
    });

    // Close WebSocket connections
    if (wss) {
      console.log("🔌 Closing WebSocket connections...");
      wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1001, "Server shutting down");
        }
      });
      wss.close(() => {
        console.log("✅ WebSocket server closed");
      });
    }

    // Clear caches and cleanup
    clearCaches();
    clients.clear();
    clientFilters.clear();

    console.log("✅ Graceful shutdown complete");
    process.exit(0);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGUSR2", () => shutdown("SIGUSR2"));

  process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error);
    shutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
    shutdown("unhandledRejection");
  });
}

export {
  startApiServer,
  broadcastUpdatedGames,
  broadcast,
  getConnectionStats,
  setupGracefulShutdown,
  clearCaches,
};
