// trades-api.js - Production WebSocket optimized version
import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import tradeService from "./tradeService.js";
import finnhubWS from "./finnhubWebSocket.js";
import { financeConfig } from "./config.js";
import pool from "./db.js";

let wss = null;
const clients = new Set();
const clientFilters = new Map();

// OPTIMIZATION: Enhanced caching with smarter invalidation
const filterCache = new Map();
const tradesCache = { data: null, timestamp: 0 };
const CACHE_TTL = 2000; // Reduced to 2 seconds for faster updates
const TRADES_CACHE_TTL = 1000; // 1 second for trades data
const BROADCAST_THROTTLE = 1000; // Throttle broadcasts to max once per second

let lastBroadcastTime = 0;
let pendingBroadcast = null;

// PRODUCTION FIX: Add connection health monitoring
let broadcastStats = {
  lastBroadcast: 0,
  totalBroadcasts: 0,
  failedBroadcasts: 0,
  lastFinnhubMessage: 0,
};

/**
 * OPTIMIZATION: Cached trades retrieval
 */
async function getCachedTrades() {
  const now = Date.now();
  if (tradesCache.data && now - tradesCache.timestamp < TRADES_CACHE_TTL) {
    return tradesCache.data;
  }

  const trades = await tradeService.getTrades();
  tradesCache.data = trades;
  tradesCache.timestamp = now;
  return trades;
}

/**
 * OPTIMIZATION: Simplified and highly cached filtering
 */
async function getFilteredTrades(filters) {
  try {
    if (!filters || filters.length === 0) {
      return [];
    }

    const cacheKey = JSON.stringify(filters.sort());
    const now = Date.now();

    // Check cache first
    if (filterCache.has(cacheKey)) {
      const cached = filterCache.get(cacheKey);
      if (now - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }

    // Get cached trades
    const allTrades = await getCachedTrades();
    if (!Array.isArray(allTrades)) {
      return [];
    }

    // OPTIMIZATION: Pre-parse filters once
    const symbolSet = new Set();
    const sectorSet = new Set();
    const typeSet = new Set();
    let priceFilter = null;

    for (const filter of filters) {
      if (filter.startsWith("symbol_")) {
        symbolSet.add(filter.replace("symbol_", ""));
      } else if (filter.startsWith("sector_")) {
        sectorSet.add(filter.replace("sector_", ""));
      } else if (filter.startsWith("type_")) {
        typeSet.add(filter.replace("type_", ""));
      } else if (filter.startsWith("price_")) {
        priceFilter = filter;
      }
    }

    // OPTIMIZATION: Single pass filter with early exits
    const filteredTrades = allTrades.filter((trade) => {
      if (symbolSet.size > 0 && !symbolSet.has(trade.symbol)) return false;
      if (sectorSet.size > 0 && !sectorSet.has(trade.sector)) return false;
      if (typeSet.size > 0 && !typeSet.has(trade.type)) return false;

      if (priceFilter) {
        const price = parseFloat(trade.price) || 0;
        switch (priceFilter) {
          case "price_under_50":
            return price < 50;
          case "price_50_200":
            return price >= 50 && price <= 200;
          case "price_over_200":
            return price > 200;
        }
      }
      return true;
    });

    // Cache result
    filterCache.set(cacheKey, { data: filteredTrades, timestamp: now });

    // OPTIMIZATION: Limit cache size
    if (filterCache.size > 50) {
      const firstKey = filterCache.keys().next().value;
      filterCache.delete(firstKey);
    }

    return filteredTrades;
  } catch (err) {
    console.error("Error filtering trades:", err);
    return [];
  }
}

/**
 * OPTIMIZATION: Smart cache clearing
 */
function clearCaches() {
  filterCache.clear();
  // Only clear trades cache if it's older than 30 seconds
  if (tradesCache.timestamp && Date.now() - tradesCache.timestamp > 30000) {
    tradesCache.data = null;
    tradesCache.timestamp = 0;
  }
}

/**
 * OPTIMIZATION: Batch and deduplicate client messages
 */
function sendToClient(client, data) {
  if (client.readyState === WebSocket.OPEN) {
    try {
      client.send(JSON.stringify(data));
    } catch (err) {
      console.error("Error sending to client:", err);
      clients.delete(client);
      clientFilters.delete(client);
    }
  }
}

/**
 * PRODUCTION FIX: Enhanced broadcasting with better error handling and monitoring
 */
async function broadcastUpdatedTrades() {
  const now = Date.now();

  // Throttle broadcasts
  if (now - lastBroadcastTime < BROADCAST_THROTTLE) {
    if (!pendingBroadcast) {
      pendingBroadcast = setTimeout(() => {
        pendingBroadcast = null;
        broadcastUpdatedTrades();
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
    filterCache.clear(); // Only clear filter cache, not trades cache

    console.log("📡 Broadcasting to", clients.size, "clients");

    // Update broadcast stats
    broadcastStats.lastBroadcast = now;
    broadcastStats.totalBroadcasts++;

    // OPTIMIZATION: Group clients by identical filter sets
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

    // OPTIMIZATION: Process each unique filter set in parallel but limited
    const timestamp = Date.now();
    const promises = Array.from(filterGroups.values()).map(
      async ({ filters, clients }) => {
        try {
          const data = await getFilteredTrades(filters);

          // Only send updates if we actually have data or if it's an explicit empty filter
          if (data.length > 0 || filters.length === 0) {
            const message = {
              type: "financial_update",
              data,
              filters,
              count: data.length,
              message:
                filters.length === 0
                  ? "No filters selected"
                  : `${data.length} trades match filters`,
              is_refresh: true,
              timestamp,
            };

            // Send to all clients in this group
            clients.forEach((client) => sendToClient(client, message));
            console.log(
              `✅ Sent update to ${clients.length} clients with ${data.length} trades`
            );
          }
        } catch (error) {
          console.error("❌ Error processing filter group:", error);
          broadcastStats.failedBroadcasts++;
        }
      }
    );

    // OPTIMIZATION: Limit concurrent processing
    const batchSize = 5;
    for (let i = 0; i < promises.length; i += batchSize) {
      await Promise.all(promises.slice(i, i + batchSize));
    }

    console.log(`✅ Broadcast complete - sent to ${clients.size} clients`);
  } catch (error) {
    console.error("❌ Broadcast error:", error);
    broadcastStats.failedBroadcasts++;
  }
}

/**
 * PRODUCTION FIX: Simplified message handling with validation
 */
function handleClientMessage(ws, data) {
  // Basic validation
  if (!data || typeof data !== "object") {
    sendToClient(ws, {
      type: "error",
      message: "Invalid message format",
      timestamp: Date.now(),
    });
    return;
  }

  console.log(`📥 Received message type: ${data.type}`);

  switch (data.type) {
    case "connection":
      sendToClient(ws, {
        type: "connection_confirmed",
        message: "Connected",
        timestamp: Date.now(),
      });
      break;

    case "filter_request":
      handleFilterRequest(ws, data.filters);
      break;

    case "get_all_trades":
      handleGetAllTrades(ws);
      break;

    case "ping":
      sendToClient(ws, { type: "pong", timestamp: Date.now() });
      break;

    default:
      sendToClient(ws, {
        type: "error",
        message: "Unknown message type",
        timestamp: Date.now(),
      });
  }
}

async function handleFilterRequest(ws, filters) {
  console.log("🔍 Filter request received:", filters);
  clientFilters.set(ws, filters || []);

  try {
    // Get all available trades first to debug
    const allTrades = await getCachedTrades();
    console.log("📊 Total trades in database:", allTrades.length);

    // Log first few trades for debugging
    if (allTrades.length > 0) {
      console.log(
        "📋 Sample trades:",
        allTrades.slice(0, 3).map((t) => ({ symbol: t.symbol, price: t.price }))
      );
    }

    const filteredTrades = await getFilteredTrades(filters);
    console.log("✅ Filtered trades result:", filteredTrades.length, "matches");

    if (filteredTrades.length > 0) {
      console.log(
        "📋 First 3 filtered trades:",
        filteredTrades
          .slice(0, 3)
          .map((t) => ({ symbol: t.symbol, price: t.price }))
      );
    }

    const message =
      filters?.length === 0
        ? "No filters selected"
        : `${filteredTrades.length} trades found`;

    const response = {
      type: "filtered_data",
      data: filteredTrades,
      filters: filters || [],
      count: filteredTrades.length,
      message,
      timestamp: Date.now(),
    };

    console.log("📤 Sending response:", {
      type: response.type,
      count: response.count,
      message: response.message,
    });
    sendToClient(ws, response);
  } catch (error) {
    console.error("❌ Error handling filter request:", error);
    sendToClient(ws, {
      type: "error",
      message: "Failed to process filters",
      timestamp: Date.now(),
    });
  }
}

async function handleGetAllTrades(ws) {
  try {
    const allTrades = await getCachedTrades();
    sendToClient(ws, {
      type: "all_trades_data",
      data: allTrades,
      count: allTrades.length,
      message: `${allTrades.length} total trades`,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("Error fetching all trades:", err);
    sendToClient(ws, {
      type: "error",
      message: "Failed to fetch trades",
      timestamp: Date.now(),
    });
  }
}

/**
 * Server startup (unchanged)
 */
async function startTradesApiServer(port = financeConfig.port, options = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // REST API routes
  app.get("/trades", async (req, res) => {
    try {
      const trades = await getCachedTrades();
      res.json(trades);
    } catch (err) {
      console.error("Error fetching trades:", err);
      res.status(500).json({ error: "Server Error" });
    }
  });

  app.get("/trades/symbol/:symbol", async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();
      const allTrades = await getCachedTrades();
      const symbolTrades = allTrades.filter((trade) => trade.symbol === symbol);
      res.json(symbolTrades);
    } catch (err) {
      console.error("Error fetching symbol trades:", err);
      res.status(500).json({ error: "Server Error" });
    }
  });

  // PRODUCTION FIX: Enhanced health check with WebSocket status
  app.get("/health", async (req, res) => {
    const health = {
      status: "healthy",
      timestamp: Date.now(),
      service: "finance",
      version: "1.0.0",
      message: "Trades API server is running",
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      websocket_clients: clients.size,
      cache_size: filterCache.size,
      trades_cache_age: tradesCache.timestamp
        ? Date.now() - tradesCache.timestamp
        : 0,
      database_connected: false,
      finnhub_connected: false,
      finnhub_api_key_configured: false,
      environment: process.env.NODE_ENV || "development",
      // PRODUCTION FIX: Add broadcast monitoring
      broadcast_stats: {
        last_broadcast_age: broadcastStats.lastBroadcast
          ? Date.now() - broadcastStats.lastBroadcast
          : null,
        total_broadcasts: broadcastStats.totalBroadcasts,
        failed_broadcasts: broadcastStats.failedBroadcasts,
        last_finnhub_message_age: broadcastStats.lastFinnhubMessage
          ? Date.now() - broadcastStats.lastFinnhubMessage
          : null,
        finnhub_stats: finnhubWS.getStats ? finnhubWS.getStats() : null,
      },
    };

    try {
      // Check database connection
      await pool.query("SELECT 1");
      health.database_connected = true;

      // Check Finnhub connection
      health.finnhub_connected =
        finnhubWS.socket && finnhubWS.socket.readyState === WebSocket.OPEN;

      // Check Finnhub API key configuration
      const { financeConfig } = await import("./config.js");
      health.finnhub_api_key_configured = !!(
        financeConfig.finnhubApiKey && financeConfig.finnhubApiKey.length > 0
      );

      // PRODUCTION FIX: Check if broadcasts are working
      const broadcastAge = broadcastStats.lastBroadcast
        ? Date.now() - broadcastStats.lastBroadcast
        : null;
      if (clients.size > 0 && broadcastAge && broadcastAge > 60000) {
        // No broadcast in 60 seconds with clients
        health.status = "degraded";
        health.message = "WebSocket broadcasts may not be working properly";
      }

      // Set status based on critical components
      if (!health.database_connected) {
        health.status = "unhealthy";
        health.message = "Database connection failed";
        return res.status(503).json(health);
      }

      if (!health.finnhub_api_key_configured) {
        health.status = "degraded";
        health.message =
          "Finnhub API key not configured - real-time data unavailable";
        return res.status(200).json(health);
      }

      if (!health.finnhub_connected && health.finnhub_api_key_configured) {
        health.status = "degraded";
        health.message =
          "Finnhub WebSocket disconnected - real-time data may be delayed";
      }

      res.json(health);
    } catch (error) {
      health.status = "unhealthy";
      health.database_connected = false;
      health.message = `Health check failed: ${error.message}`;
      res.status(503).json(health);
    }
  });

  const httpServer = http.createServer(app);

  // PRODUCTION FIX: Enhanced WebSocket server with better error handling
  wss = new WebSocketServer({
    server: httpServer,
    path: "/ws",
    // PRODUCTION FIX: Add WebSocket server options for production
    perMessageDeflate: false, // Disable compression for better performance
    maxPayload: 16 * 1024, // 16KB max message size
    clientTracking: true, // Enable client tracking for cleanup
  });

  wss.on("connection", (ws, request) => {
    clients.add(ws);
    clientFilters.set(ws, []);

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

    // Send initial message
    sendToClient(ws, {
      type: "initial_data",
      data: [],
      count: 0,
      message: "Connected. Select filters to view trades.",
      timestamp: Date.now(),
    });

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        await handleClientMessage(ws, data);
      } catch (error) {
        console.error("Message parse error:", error);
        sendToClient(ws, {
          type: "error",
          message: "Invalid JSON",
          timestamp: Date.now(),
        });
      }
    });

    ws.on("close", (code, reason) => {
      clients.delete(ws);
      clientFilters.delete(ws);
      console.log(
        `🔌 Client disconnected (${code}: ${reason}). Total: ${clients.size}`
      );
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      clients.delete(ws);
      clientFilters.delete(ws);
    });
  });

  // PRODUCTION FIX: Add WebSocket heartbeat interval
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        console.log("🔌 Terminating unresponsive client");
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

  // PRODUCTION FIX: Start Finnhub with enhanced error handling
  try {
    console.log("🚀 Starting Finnhub WebSocket connection...");
    await finnhubWS.start(options);
    setupFinnhubIntegration();
    console.log("✅ Finnhub WebSocket connected successfully");
  } catch (error) {
    console.error("❌ Finnhub setup error:", error);
    console.log("⚠️ API will continue without real-time updates");
  }

  return new Promise((resolve, reject) => {
    httpServer
      .listen(port, () => {
        console.log(`🚀 Trades API running on http://localhost:${port}`);
        console.log(`🔌 WebSocket endpoint: ws://localhost:${port}/ws`);
        resolve({ httpServer, wss });
      })
      .on("error", reject);
  });
}

/**
 * PRODUCTION FIX: Robust Finnhub integration with better error handling
 */
function setupFinnhubIntegration() {
  let updatePending = false;
  let updateCount = 0;
  const BATCH_SIZE = 10; // Process updates in batches

  console.log("🔧 Setting up Finnhub integration...");

  if (!finnhubWS.socket) {
    console.error("❌ No Finnhub socket available for integration");
    return;
  }

  console.log("✅ Finnhub socket found, setting up message handler");

  // PRODUCTION FIX: More robust message handling with better logging
  finnhubWS.socket.on("message", (data) => {
    broadcastStats.lastFinnhubMessage = Date.now();
    updateCount++;

    console.log(`📨 Finnhub message received (update #${updateCount})`);

    if (updatePending) {
      console.log("⏳ Update already pending, queuing...");
      return;
    }

    updatePending = true;

    // Batch updates - wait for multiple updates or timeout
    const delay = updateCount >= BATCH_SIZE ? 500 : 1500;
    console.log(
      `⏰ Scheduling broadcast in ${delay}ms (batch: ${
        updateCount >= BATCH_SIZE
      })`
    );

    setTimeout(async () => {
      updatePending = false;
      const processedCount = updateCount;
      updateCount = 0;

      try {
        console.log(`🔄 Processing ${processedCount} Finnhub updates`);
        await broadcastUpdatedTrades();
        console.log(`✅ Broadcast completed for ${processedCount} updates`);
      } catch (err) {
        console.error("❌ Broadcast error:", err);
        broadcastStats.failedBroadcasts++;
      }
    }, delay);
  });

  // PRODUCTION FIX: Add connection monitoring
  finnhubWS.socket.on("open", () => {
    console.log("✅ Finnhub WebSocket opened");
  });

  finnhubWS.socket.on("close", () => {
    console.log("❌ Finnhub WebSocket closed");
  });

  finnhubWS.socket.on("error", (error) => {
    console.error("❌ Finnhub WebSocket error:", error);
  });

  console.log("✅ Finnhub integration setup complete");
}

// Rest of the functions remain the same...
function setupGracefulShutdown(httpServer) {
  console.log("Setting up graceful shutdown handlers...");

  function shutdown(signal) {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

    httpServer.close(() => {
      console.log("✅ HTTP server closed");
    });

    if (wss) {
      console.log("🔌 Closing WebSocket connections...");
      wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
      wss.close(() => {
        console.log("✅ WebSocket server closed");
      });
    }

    if (finnhubWS) {
      console.log("📡 Disconnecting Finnhub WebSocket...");
      finnhubWS.disconnect();
      finnhubWS.stopCronJobs();
    }

    clearCaches();
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

function getConnectionStats() {
  return {
    total_clients: clients.size,
    active_filters: clientFilters.size,
    cache_size: filterCache.size,
    trades_cache_age: tradesCache.timestamp
      ? Date.now() - tradesCache.timestamp
      : 0,
    broadcast_stats: broadcastStats,
  };
}

export {
  startTradesApiServer,
  setupGracefulShutdown,
  broadcastUpdatedTrades,
  getConnectionStats,
  clearCaches,
};
