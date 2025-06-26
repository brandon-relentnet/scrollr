// finnhubWebSocket.js - Production optimized version with enhanced monitoring
import { WebSocket } from "ws";
import fetch from "node-fetch";
import cron from "node-cron";
import tradeService from "./tradeService.js";
import { financeConfig } from "./config.js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FINNHUB_API_KEY = financeConfig.finnhubApiKey;
const SUBSCRIPTIONS = JSON.parse(
  readFileSync(join(__dirname, "subscriptions.json"), "utf8")
);

// OPTIMIZATION: Enhanced throttling and batching
let lastLogTime = 0;
const LOG_THROTTLE_INTERVAL = 5000; // Reduced logging frequency
const UPDATE_BATCH_SIZE = 10;
const UPDATE_BATCH_TIMEOUT = 1000; // Process batches every second

class FinnhubWebSocket {
  constructor() {
    this.socket = null;
    this.reconnectInterval = 5000;
    this.shouldReconnect = true;

    // OPTIMIZATION: Batch processing for trade updates
    this.updateQueue = new Map(); // Symbol -> latest trade data
    this.batchTimer = null;
    this.isProcessingBatch = false;

    // PRODUCTION FIX: Add connection monitoring and stats
    this.stats = {
      connectionAttempts: 0,
      successfulConnections: 0,
      messagesReceived: 0,
      lastMessageTime: 0,
      lastReconnectTime: 0,
      currentConnectionStart: 0,
      totalUpdatesProcessed: 0,
      batchesProcessed: 0,
      errors: 0,
    };

    // PRODUCTION FIX: Add connection health monitoring
    this.healthCheckInterval = null;
    this.connectionTimeout = null;

    // Save the cron job instance for later cleanup
    this.dailyJob = cron.schedule(
      "0 16 * * *",
      () => {
        console.log("[Cron] Updating previous closes (4 PM ET)...");
        this.updateAllPreviousCloses();
      },
      { timezone: "America/New_York" }
    );
  }

  async start(options = {}) {
    console.log("[FinnhubWS] 🚀 Starting...");
    console.log("[FinnhubWS] API Key configured:", !!FINNHUB_API_KEY);
    console.log("[FinnhubWS] Subscriptions loaded:", SUBSCRIPTIONS.length);

    await this.initializeSymbols();

    // Check if we should skip previous closes update
    if (options.skipPreviousCloses) {
      console.log(
        "[FinnhubWS] ⏭️ Skipping previous closes update (skip flag enabled)"
      );
    } else {
      await this.updateAllPreviousCloses();
    }

    this.connect();
    this.startHealthMonitoring();
  }

  // PRODUCTION FIX: Add connection health monitoring
  startHealthMonitoring() {
    // Check connection health every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastMessage = this.stats.lastMessageTime
        ? now - this.stats.lastMessageTime
        : null;

      console.log("[FinnhubWS] 🏥 Health Check:", {
        connected: this.socket?.readyState === WebSocket.OPEN,
        timeSinceLastMessage: timeSinceLastMessage
          ? `${Math.round(timeSinceLastMessage / 1000)}s`
          : "never",
        messagesReceived: this.stats.messagesReceived,
        queueSize: this.updateQueue.size,
        isProcessing: this.isProcessingBatch,
      });

      // Reconnect if no messages for 2 minutes and we should be connected
      if (
        this.socket?.readyState === WebSocket.OPEN &&
        timeSinceLastMessage &&
        timeSinceLastMessage > 120000
      ) {
        console.log(
          "[FinnhubWS] ⚠️ No messages for 2 minutes, reconnecting..."
        );
        this.reconnect();
      }
    }, 30000);
  }

  reconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.close();
    }
    this.stats.lastReconnectTime = Date.now();
    setTimeout(() => this.connect(), 2000);
  }

  async initializeSymbols() {
    console.log("[FinnhubWS] 🔧 Initializing symbols in DB...");

    // OPTIMIZATION: Process symbols in batches to avoid overwhelming the DB
    const batchSize = 5;
    for (let i = 0; i < SUBSCRIPTIONS.length; i += batchSize) {
      const batch = SUBSCRIPTIONS.slice(i, i + batchSize);
      const promises = batch.map((symbol) =>
        tradeService
          .insertSymbol(symbol)
          .catch((error) =>
            console.error(
              `[FinnhubWS] ❌ Init failed for ${symbol}:`,
              error.message
            )
          )
      );

      await Promise.all(promises);

      // Small delay between batches
      if (i + batchSize < SUBSCRIPTIONS.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    console.log("[FinnhubWS] ✅ Symbol initialization complete");
  }

  async updateAllPreviousCloses() {
    console.log("[FinnhubWS] 📊 Updating previous closes...");

    // OPTIMIZATION: Process in smaller batches with better error handling
    const batchSize = 3; // Reduced to respect API rate limits
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < SUBSCRIPTIONS.length; i += batchSize) {
      const batch = SUBSCRIPTIONS.slice(i, i + batchSize);

      const promises = batch.map(async (symbol) => {
        try {
          const previousClose = await this.fetchPreviousClose(symbol);
          if (previousClose && previousClose > 0) {
            await tradeService.updatePreviousClose(symbol, previousClose);
            console.log(
              `[FinnhubWS] ✅ ${symbol} previous close updated: $${previousClose}`
            );
            successCount++;
          } else {
            console.warn(
              `[FinnhubWS] ⚠️ Invalid previous close for ${symbol}: ${previousClose}`
            );
            errorCount++;
          }
        } catch (error) {
          console.error(
            `[FinnhubWS] ❌ Failed updating PC for ${symbol}:`,
            error.message
          );
          errorCount++;
        }
      });

      await Promise.all(promises);

      // Rate-limit: wait between batches
      if (i + batchSize < SUBSCRIPTIONS.length) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
    console.log(
      `[FinnhubWS] 📊 Previous closes update completed: ${successCount} success, ${errorCount} errors`
    );
  }

  connect() {
    if (!FINNHUB_API_KEY) {
      console.error("[FinnhubWS] ❌ No API key configured!");
      return;
    }

    this.stats.connectionAttempts++;
    console.log(
      `[FinnhubWS] 🔌 Connecting... (attempt ${this.stats.connectionAttempts})`
    );

    // PRODUCTION FIX: Add connection timeout
    this.connectionTimeout = setTimeout(() => {
      console.log("[FinnhubWS] ⏰ Connection timeout, retrying...");
      if (this.socket) {
        this.socket.terminate();
      }
    }, 15000); // 15 second timeout

    this.socket = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_API_KEY}`);

    this.socket.on("open", () => {
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      this.stats.successfulConnections++;
      this.stats.currentConnectionStart = Date.now();
      console.log("[FinnhubWS] ✅ WebSocket connected successfully");
      this.subscribeToSymbols();
    });

    // PRODUCTION FIX: Enhanced message handling with better logging
    this.socket.on("message", (data) => {
      try {
        this.stats.messagesReceived++;
        this.stats.lastMessageTime = Date.now();

        const message = JSON.parse(data);
        if (message.type === "trade" && message.data) {
          console.log(
            `[FinnhubWS] 📨 Trade message received with ${message.data.length} trades`
          );
          this.handleTradeUpdateBatch(message.data);
        } else {
          console.log(`[FinnhubWS] 📨 Non-trade message:`, message.type);
        }
      } catch (error) {
        console.error("[FinnhubWS] ❌ Message parse error:", error);
        this.stats.errors++;
      }
    });

    this.socket.on("close", (code, reason) => {
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      console.log(`[FinnhubWS] 🔌 WebSocket closed (${code}: ${reason})`);
      if (this.shouldReconnect) {
        console.log(
          `[FinnhubWS] 🔄 Reconnecting in ${this.reconnectInterval / 1000}s...`
        );
        setTimeout(() => this.connect(), this.reconnectInterval);
      }
    });

    this.socket.on("error", (err) => {
      console.error("[FinnhubWS] ❌ WebSocket error:", err);
      this.stats.errors++;
    });
  }

  async fetchPreviousClose(symbol) {
    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
        { timeout: 10000 } // 10 second timeout
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.pc; // previous close
    } catch (error) {
      console.error(
        `[FinnhubWS] ❌ fetchPreviousClose error for ${symbol}:`,
        error.message
      );
      return null;
    }
  }

  subscribeToSymbols() {
    console.log(
      `[FinnhubWS] 📡 Subscribing to ${SUBSCRIPTIONS.length} symbols...`
    );
    SUBSCRIPTIONS.forEach((symbol) => {
      this.socket.send(JSON.stringify({ type: "subscribe", symbol }));
    });
    console.log("[FinnhubWS] ✅ All subscriptions sent");
  }

  /**
   * OPTIMIZATION: Batch trade updates to reduce database load
   */
  handleTradeUpdateBatch(trades) {
    if (!Array.isArray(trades) || trades.length === 0) return;

    console.log(`[FinnhubWS] 🔄 Processing ${trades.length} trade updates`);

    // Add trades to the queue (latest trade for each symbol)
    trades.forEach((trade) => {
      const { s: symbol, p: price, t: timestamp } = trade;
      if (symbol && price && timestamp) {
        // Only keep the latest trade for each symbol
        if (
          !this.updateQueue.has(symbol) ||
          this.updateQueue.get(symbol).t < timestamp
        ) {
          this.updateQueue.set(symbol, trade);
        }
      }
    });

    console.log(
      `[FinnhubWS] 📊 Queue size after processing: ${this.updateQueue.size}`
    );

    // Schedule batch processing
    this.scheduleBatchProcessing();
  }

  /**
   * OPTIMIZATION: Schedule batch processing with debouncing
   */
  scheduleBatchProcessing() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    const delay =
      this.updateQueue.size >= UPDATE_BATCH_SIZE ? 500 : UPDATE_BATCH_TIMEOUT;
    console.log(
      `[FinnhubWS] ⏰ Scheduling batch processing in ${delay}ms (queue: ${this.updateQueue.size})`
    );

    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, delay);
  }

  /**
   * OPTIMIZATION: Process batched updates efficiently
   */
  async processBatch() {
    if (this.isProcessingBatch || this.updateQueue.size === 0) {
      console.log(
        `[FinnhubWS] ⏭️ Skipping batch processing (processing: ${this.isProcessingBatch}, queue: ${this.updateQueue.size})`
      );
      return;
    }

    this.isProcessingBatch = true;
    const trades = Array.from(this.updateQueue.values());
    this.updateQueue.clear();
    this.stats.batchesProcessed++;

    console.log(
      `[FinnhubWS] 🔄 Processing batch #${this.stats.batchesProcessed} with ${trades.length} trades`
    );

    try {
      // OPTIMIZATION: Get all trades data once for the entire batch
      const allTrades = await tradeService.getTrades();
      const tradesMap = new Map(allTrades.map((t) => [t.symbol, t]));

      // Process trades in parallel but with limited concurrency
      const batchSize = 5;
      let processedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < trades.length; i += batchSize) {
        const batch = trades.slice(i, i + batchSize);

        const promises = batch.map(async (trade) => {
          try {
            await this.processSingleTrade(trade, tradesMap);
            processedCount++;
          } catch (error) {
            errorCount++;
            console.error(`[FinnhubWS] ❌ Error processing trade:`, error);
          }
        });

        await Promise.all(promises);
      }

      this.stats.totalUpdatesProcessed += processedCount;

      // Throttled logging
      const now = Date.now();
      if (now - lastLogTime >= LOG_THROTTLE_INTERVAL) {
        lastLogTime = now;
        console.log(
          `[FinnhubWS] ✅ Batch complete: ${processedCount} processed, ${errorCount} errors`
        );
        console.log(
          `[FinnhubWS] 📊 Total updates processed: ${this.stats.totalUpdatesProcessed}`
        );
      }
    } catch (error) {
      console.error("[FinnhubWS] ❌ Batch processing error:", error);
      this.stats.errors++;
    } finally {
      this.isProcessingBatch = false;

      // If more trades came in while processing, schedule another batch
      if (this.updateQueue.size > 0) {
        console.log(
          `[FinnhubWS] 📈 More trades queued (${this.updateQueue.size}), scheduling next batch`
        );
        this.scheduleBatchProcessing();
      }
    }
  }

  /**
   * OPTIMIZATION: Process individual trade with cached data
   */
  async processSingleTrade(trade, tradesMap) {
    const { s: symbol, p: price } = trade;

    try {
      const tradeRecord = tradesMap.get(symbol);

      if (!tradeRecord || !tradeRecord.previous_close) {
        console.warn(
          `[FinnhubWS] ⚠️ Skipping ${symbol}, no previous_close in DB`
        );
        return;
      }

      const previousClose = parseFloat(tradeRecord.previous_close);
      const currentPrice = parseFloat(price);

      if (isNaN(previousClose) || isNaN(currentPrice)) {
        console.warn(
          `[FinnhubWS] ⚠️ Invalid prices for ${symbol}: current=${price}, previous=${previousClose}`
        );
        return;
      }

      const priceChange = currentPrice - previousClose;
      const percentageChange = (priceChange / previousClose) * 100;
      const direction = priceChange >= 0 ? "up" : "down";

      await tradeService.updateTrade(
        symbol,
        currentPrice,
        priceChange,
        percentageChange,
        direction
      );
    } catch (error) {
      console.error(
        `[FinnhubWS] ❌ Error processing ${symbol}:`,
        error.message
      );
      throw error; // Re-throw for batch error counting
    }
  }

  disconnect() {
    console.log("[FinnhubWS] 🛑 Disconnecting...");
    this.shouldReconnect = false;

    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // Clear any pending batch processing
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    this.updateQueue.clear();

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.close();
    }

    console.log("[FinnhubWS] ✅ Disconnected successfully");
  }

  stopCronJobs() {
    if (this.dailyJob) {
      this.dailyJob.stop();
      console.log("[FinnhubWS] ⏰ Cron job stopped.");
    }
  }

  /**
   * PRODUCTION FIX: Enhanced statistics for monitoring
   */
  getStats() {
    const now = Date.now();
    return {
      // Connection stats
      connectionAttempts: this.stats.connectionAttempts,
      successfulConnections: this.stats.successfulConnections,
      connected: this.socket?.readyState === WebSocket.OPEN,
      connectionUptime: this.stats.currentConnectionStart
        ? now - this.stats.currentConnectionStart
        : 0,

      // Message stats
      messagesReceived: this.stats.messagesReceived,
      lastMessageAge: this.stats.lastMessageTime
        ? now - this.stats.lastMessageTime
        : null,

      // Processing stats
      queueSize: this.updateQueue.size,
      isProcessing: this.isProcessingBatch,
      hasPendingBatch: !!this.batchTimer,
      batchesProcessed: this.stats.batchesProcessed,
      totalUpdatesProcessed: this.stats.totalUpdatesProcessed,

      // Error stats
      errors: this.stats.errors,

      // Health indicators
      healthy:
        this.socket?.readyState === WebSocket.OPEN &&
        (this.stats.lastMessageTime
          ? now - this.stats.lastMessageTime < 120000
          : false),
      lastReconnectAge: this.stats.lastReconnectTime
        ? now - this.stats.lastReconnectTime
        : null,
    };
  }
}

export default new FinnhubWebSocket();
