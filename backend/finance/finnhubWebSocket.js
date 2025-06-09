// finnhubWebSocket.js
const WebSocket = require('ws');
const fetch = require('node-fetch');
const cron = require('node-cron');
const tradeService = require('./tradeService');
require('dotenv').config();

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const SUBSCRIPTIONS = require('./subscriptions.json');
let lastLogTime = 0;
const LOG_THROTTLE_INTERVAL = 1000;

class FinnhubWebSocket {
    constructor() {
        this.socket = null;
        this.reconnectInterval = 5000;
        this.shouldReconnect = true;

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
        for (const symbol of SUBSCRIPTIONS) {
            try {
                await tradeService.insertSymbol(symbol);
            } catch (error) {
                console.error(`[FinnhubWS] Init failed for ${symbol}:`, error.message);
            }
        }
    }

    async updateAllPreviousCloses() {
        console.log('[FinnhubWS] Updating previous closes...');
        for (const symbol of SUBSCRIPTIONS) {
            try {
                const previousClose = await this.fetchPreviousClose(symbol);
                if (!previousClose) {
                    console.warn(`[FinnhubWS] No previous close found for ${symbol}`);
                    continue;
                }
                await tradeService.updatePreviousClose(symbol, previousClose);

                console.log(`[FinnhubWS] ${symbol} previous close updated: $${previousClose}`);
                // Rate-limit: wait 1 second between calls
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`[FinnhubWS] Failed updating PC for ${symbol}:`, error.message);
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
                if (message.type === 'trade') {
                    this.handleTradeUpdate(message.data);
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
                `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
            );
            const data = await response.json();
            return data.pc; // previous close
        } catch (error) {
            console.error(`[FinnhubWS] fetchPreviousClose error for ${symbol}:`, error);
            return null;
        }
    }

    subscribeToSymbols() {
        SUBSCRIPTIONS.forEach(symbol => {
            this.socket.send(JSON.stringify({ type: 'subscribe', symbol }));
            console.log(`[FinnhubWS] Subscribed to ${symbol}`);
        });
    }

    async handleTradeUpdate(trades) {
        for (const trade of trades) {
            const { s: symbol, p: price } = trade;

            try {
                // Retrieve previous close from DB via your service
                const result = await tradeService.getTrades(); // Alternatively, create a dedicated method for fetching a single symbol's previous close.
                const tradeRecord = result.find(r => r.symbol === symbol);

                if (!tradeRecord || !tradeRecord.previous_close) {
                    console.warn(`[FinnhubWS] Skipping ${symbol}, no previous_close in DB`);
                    continue;
                }

                const previousClose = tradeRecord.previous_close;
                const priceChange = price - previousClose;
                const percentageChange = (priceChange / previousClose) * 100;
                const direction = priceChange >= 0 ? 'up' : 'down';

                await tradeService.updateTrade(symbol, price, priceChange, percentageChange, direction);

                const now = Date.now();
                if (now - lastLogTime >= LOG_THROTTLE_INTERVAL) {
                    lastLogTime = now;
                    console.log(`[FinnhubWS] ${symbol} price updated: $${price}`);
                }
            } catch (error) {
                console.error(`[FinnhubWS] Error processing ${symbol}:`, error.message);
            }
        }
    }

    disconnect() {
        this.shouldReconnect = false;
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
}

module.exports = new FinnhubWebSocket();