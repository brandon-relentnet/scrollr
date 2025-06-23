// finnhubWebSocket.js - Performance optimized version
import { WebSocket } from 'ws';
import fetch from 'node-fetch';
import cron from 'node-cron';
import tradeService from './tradeService.js';
import { financeConfig } from '../config.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FINNHUB_API_KEY = financeConfig.finnhubApiKey;
const SUBSCRIPTIONS = JSON.parse(readFileSync(join(__dirname, 'subscriptions.json'), 'utf8'));

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

        // Save the cron job instance for later cleanup
        this.dailyJob = cron.schedule(
            '0 16 * * *',
            () => {
                console.log('[Cron] Updating previous closes (4 PM ET)...');
                this.updateAllPreviousCloses();
            },
            { timezone: 'America/New_York' }
        );
    }

    async start(options = {}) {
        console.log('[FinnhubWS] Starting...');
        await this.initializeSymbols();

        // Check if we should skip previous closes update
        if (options.skipPreviousCloses) {
            console.log('[FinnhubWS] Skipping previous closes update (skip flag enabled)');
        } else {
            await this.updateAllPreviousCloses();
        }

        this.connect();
    }

    async initializeSymbols() {
        console.log('[FinnhubWS] Initializing symbols in DB...');

        // OPTIMIZATION: Process symbols in batches to avoid overwhelming the DB
        const batchSize = 5;
        for (let i = 0; i < SUBSCRIPTIONS.length; i += batchSize) {
            const batch = SUBSCRIPTIONS.slice(i, i + batchSize);
            const promises = batch.map(symbol =>
                tradeService.insertSymbol(symbol).catch(error =>
                    console.error(`[FinnhubWS] Init failed for ${symbol}:`, error.message)
                )
            );

            await Promise.all(promises);

            // Small delay between batches
            if (i + batchSize < SUBSCRIPTIONS.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }

    async updateAllPreviousCloses() {
        console.log('[FinnhubWS] Updating previous closes...');

        // OPTIMIZATION: Process in smaller batches with better error handling
        const batchSize = 3; // Reduced to respect API rate limits
        for (let i = 0; i < SUBSCRIPTIONS.length; i += batchSize) {
            const batch = SUBSCRIPTIONS.slice(i, i + batchSize);

            const promises = batch.map(async (symbol) => {
                try {
                    const previousClose = await this.fetchPreviousClose(symbol);
                    if (previousClose && previousClose > 0) {
                        await tradeService.updatePreviousClose(symbol, previousClose);
                        console.log(`[FinnhubWS] ${symbol} previous close updated: $${previousClose}`);
                    } else {
                        console.warn(`[FinnhubWS] Invalid previous close for ${symbol}: ${previousClose}`);
                    }
                } catch (error) {
                    console.error(`[FinnhubWS] Failed updating PC for ${symbol}:`, error.message);
                }
            });

            await Promise.all(promises);

            // Rate-limit: wait between batches
            if (i + batchSize < SUBSCRIPTIONS.length) {
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }
        console.log('[FinnhubWS] Previous closes update completed');
    }

    connect() {
        console.log('[FinnhubWS] Connecting...');
        this.socket = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_API_KEY}`);

        this.socket.on('open', () => {
            console.log('[FinnhubWS] WebSocket open');
            this.subscribeToSymbols();
        });

        this.socket.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                if (message.type === 'trade' && message.data) {
                    this.handleTradeUpdateBatch(message.data);
                }
            } catch (error) {
                console.error('[FinnhubWS] WS message parse error:', error);
            }
        });

        this.socket.on('close', () => {
            console.log('[FinnhubWS] WebSocket closed');
            if (this.shouldReconnect) {
                console.log(`[FinnhubWS] Reconnecting in ${this.reconnectInterval / 1000}s...`);
                setTimeout(() => this.connect(), this.reconnectInterval);
            }
        });

        this.socket.on('error', (err) => {
            console.error('[FinnhubWS] WebSocket error:', err);
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
            console.error(`[FinnhubWS] fetchPreviousClose error for ${symbol}:`, error.message);
            return null;
        }
    }

    subscribeToSymbols() {
        SUBSCRIPTIONS.forEach(symbol => {
            this.socket.send(JSON.stringify({ type: 'subscribe', symbol }));
            console.log(`[FinnhubWS] Subscribed to ${symbol}`);
        });
    }

    /**
     * OPTIMIZATION: Batch trade updates to reduce database load
     */
    handleTradeUpdateBatch(trades) {
        if (!Array.isArray(trades) || trades.length === 0) return;

        // Add trades to the queue (latest trade for each symbol)
        trades.forEach(trade => {
            const { s: symbol, p: price, t: timestamp } = trade;
            if (symbol && price && timestamp) {
                // Only keep the latest trade for each symbol
                if (!this.updateQueue.has(symbol) ||
                    this.updateQueue.get(symbol).t < timestamp) {
                    this.updateQueue.set(symbol, trade);
                }
            }
        });

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

        this.batchTimer = setTimeout(() => {
            this.processBatch();
        }, this.updateQueue.size >= UPDATE_BATCH_SIZE ? 500 : UPDATE_BATCH_TIMEOUT);
    }

    /**
     * OPTIMIZATION: Process batched updates efficiently
     */
    async processBatch() {
        if (this.isProcessingBatch || this.updateQueue.size === 0) {
            return;
        }

        this.isProcessingBatch = true;
        const trades = Array.from(this.updateQueue.values());
        this.updateQueue.clear();

        try {
            // OPTIMIZATION: Get all trades data once for the entire batch
            const allTrades = await tradeService.getTrades();
            const tradesMap = new Map(allTrades.map(t => [t.symbol, t]));

            // Process trades in parallel but with limited concurrency
            const batchSize = 5;
            for (let i = 0; i < trades.length; i += batchSize) {
                const batch = trades.slice(i, i + batchSize);

                const promises = batch.map(trade =>
                    this.processSingleTrade(trade, tradesMap)
                );

                await Promise.all(promises);
            }

            // Throttled logging
            const now = Date.now();
            if (now - lastLogTime >= LOG_THROTTLE_INTERVAL) {
                lastLogTime = now;
                console.log(`[FinnhubWS] Processed ${trades.length} trade updates`);
            }

        } catch (error) {
            console.error('[FinnhubWS] Batch processing error:', error);
        } finally {
            this.isProcessingBatch = false;

            // If more trades came in while processing, schedule another batch
            if (this.updateQueue.size > 0) {
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
                console.warn(`[FinnhubWS] Skipping ${symbol}, no previous_close in DB`);
                return;
            }

            const previousClose = parseFloat(tradeRecord.previous_close);
            const currentPrice = parseFloat(price);

            if (isNaN(previousClose) || isNaN(currentPrice)) {
                console.warn(`[FinnhubWS] Invalid prices for ${symbol}: current=${price}, previous=${previousClose}`);
                return;
            }

            const priceChange = currentPrice - previousClose;
            const percentageChange = (priceChange / previousClose) * 100;
            const direction = priceChange >= 0 ? 'up' : 'down';

            await tradeService.updateTrade(symbol, currentPrice, priceChange, percentageChange, direction);

        } catch (error) {
            console.error(`[FinnhubWS] Error processing ${symbol}:`, error.message);
        }
    }

    disconnect() {
        this.shouldReconnect = false;

        // Clear any pending batch processing
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }

        this.updateQueue.clear();

        if (this.socket) {
            this.socket.close();
        }
    }

    stopCronJobs() {
        if (this.dailyJob) {
            this.dailyJob.stop();
            console.log('[FinnhubWS] Cron job stopped.');
        }
    }

    /**
     * Get queue statistics for monitoring
     */
    getStats() {
        return {
            queueSize: this.updateQueue.size,
            isProcessing: this.isProcessingBatch,
            hasPendingBatch: !!this.batchTimer
        };
    }
}

export default new FinnhubWebSocket();