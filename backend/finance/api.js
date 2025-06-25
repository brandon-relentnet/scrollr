// trades-api.js - Performance optimized version
import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import tradeService from './tradeService.js';
import finnhubWS from './finnhubWebSocket.js';
import { financeConfig } from './config.js';
import pool from './db.js';

let wss = null
const clients = new Set()
const clientFilters = new Map()

// OPTIMIZATION: Enhanced caching with smarter invalidation
const filterCache = new Map()
const tradesCache = { data: null, timestamp: 0 }
const CACHE_TTL = 2000 // Reduced to 2 seconds for faster updates
const TRADES_CACHE_TTL = 1000 // 1 second for trades data
const BROADCAST_THROTTLE = 1000 // Throttle broadcasts to max once per second

let lastBroadcastTime = 0
let pendingBroadcast = null

/**
 * OPTIMIZATION: Cached trades retrieval
 */
async function getCachedTrades() {
    const now = Date.now()
    if (tradesCache.data && (now - tradesCache.timestamp) < TRADES_CACHE_TTL) {
        return tradesCache.data
    }

    const trades = await tradeService.getTrades()
    tradesCache.data = trades
    tradesCache.timestamp = now
    return trades
}

/**
 * OPTIMIZATION: Simplified and highly cached filtering
 */
async function getFilteredTrades(filters) {
    try {
        if (!filters || filters.length === 0) {
            return []
        }

        const cacheKey = JSON.stringify(filters.sort())
        const now = Date.now()

        // Check cache first
        if (filterCache.has(cacheKey)) {
            const cached = filterCache.get(cacheKey)
            if (now - cached.timestamp < CACHE_TTL) {
                return cached.data
            }
        }

        // Get cached trades
        const allTrades = await getCachedTrades()
        if (!Array.isArray(allTrades)) {
            return []
        }

        // OPTIMIZATION: Pre-parse filters once
        const symbolSet = new Set()
        const sectorSet = new Set()
        const typeSet = new Set()
        let priceFilter = null

        for (const filter of filters) {
            if (filter.startsWith('symbol_')) {
                symbolSet.add(filter.replace('symbol_', ''))
            } else if (filter.startsWith('sector_')) {
                sectorSet.add(filter.replace('sector_', ''))
            } else if (filter.startsWith('type_')) {
                typeSet.add(filter.replace('type_', ''))
            } else if (filter.startsWith('price_')) {
                priceFilter = filter
            }
        }

        // OPTIMIZATION: Single pass filter with early exits
        const filteredTrades = allTrades.filter(trade => {
            if (symbolSet.size > 0 && !symbolSet.has(trade.symbol)) return false
            if (sectorSet.size > 0 && !sectorSet.has(trade.sector)) return false
            if (typeSet.size > 0 && !typeSet.has(trade.type)) return false

            if (priceFilter) {
                const price = parseFloat(trade.price) || 0
                switch (priceFilter) {
                    case 'price_under_50': return price < 50
                    case 'price_50_200': return price >= 50 && price <= 200
                    case 'price_over_200': return price > 200
                }
            }
            return true
        })

        // Cache result
        filterCache.set(cacheKey, { data: filteredTrades, timestamp: now })

        // OPTIMIZATION: Limit cache size
        if (filterCache.size > 50) {
            const firstKey = filterCache.keys().next().value
            filterCache.delete(firstKey)
        }

        return filteredTrades
    } catch (err) {
        console.error('Error filtering trades:', err)
        return []
    }
}

/**
 * OPTIMIZATION: Smart cache clearing
 */
function clearCaches() {
    filterCache.clear()
    tradesCache.data = null
    tradesCache.timestamp = 0
}

/**
 * OPTIMIZATION: Batch and deduplicate client messages
 */
function sendToClient(client, data) {
    if (client.readyState === WebSocket.OPEN) {
        try {
            client.send(JSON.stringify(data))
        } catch (err) {
            console.error('Error sending to client:', err)
            clients.delete(client)
            clientFilters.delete(client)
        }
    }
}

/**
 * OPTIMIZATION: Throttled broadcasting with deduplication
 */
async function broadcastUpdatedTrades() {
    const now = Date.now()

    // Throttle broadcasts
    if (now - lastBroadcastTime < BROADCAST_THROTTLE) {
        if (!pendingBroadcast) {
            pendingBroadcast = setTimeout(() => {
                pendingBroadcast = null
                broadcastUpdatedTrades()
            }, BROADCAST_THROTTLE - (now - lastBroadcastTime))
        }
        return
    }

    lastBroadcastTime = now

    if (!wss || clients.size === 0) return

    clearCaches() // Clear caches for fresh data

    console.log('Broadcasting to', clients.size, 'clients')

    // OPTIMIZATION: Group clients by identical filter sets
    const filterGroups = new Map()

    for (const [client, filters] of clientFilters) {
        if (client.readyState === WebSocket.OPEN) {
            const filterKey = JSON.stringify(filters.sort())
            if (!filterGroups.has(filterKey)) {
                filterGroups.set(filterKey, { filters, clients: [] })
            }
            filterGroups.get(filterKey).clients.push(client)
        }
    }

    // OPTIMIZATION: Process each unique filter set in parallel but limited
    const timestamp = Date.now()
    const promises = Array.from(filterGroups.values()).map(async ({ filters, clients }) => {
        try {
            const data = await getFilteredTrades(filters)
            const message = {
                type: 'financial_update',
                data,
                filters,
                count: data.length,
                message: filters.length === 0
                    ? 'No filters selected'
                    : `${data.length} trades match filters`,
                is_refresh: true,
                timestamp
            }

            // Send to all clients in this group
            clients.forEach(client => sendToClient(client, message))
        } catch (error) {
            console.error('Error processing filter group:', error)
        }
    })

    // OPTIMIZATION: Limit concurrent processing
    const batchSize = 5
    for (let i = 0; i < promises.length; i += batchSize) {
        await Promise.all(promises.slice(i, i + batchSize))
    }
}

/**
 * OPTIMIZATION: Simplified message handling with validation
 */
function handleClientMessage(ws, data) {
    // Basic validation
    if (!data || typeof data !== 'object') {
        sendToClient(ws, {
            type: 'error',
            message: 'Invalid message format',
            timestamp: Date.now()
        })
        return
    }

    switch (data.type) {
        case 'connection':
            sendToClient(ws, {
                type: 'connection_confirmed',
                message: 'Connected',
                timestamp: Date.now()
            })
            break

        case 'filter_request':
            handleFilterRequest(ws, data.filters)
            break

        case 'get_all_trades':
            handleGetAllTrades(ws)
            break

        case 'ping':
            sendToClient(ws, { type: 'pong', timestamp: Date.now() })
            break

        default:
            sendToClient(ws, {
                type: 'error',
                message: 'Unknown message type',
                timestamp: Date.now()
            })
    }
}

async function handleFilterRequest(ws, filters) {
    console.log('Filter request:', filters)
    clientFilters.set(ws, filters || [])

    try {
        const filteredTrades = await getFilteredTrades(filters)
        const message = filters?.length === 0
            ? 'No filters selected'
            : `${filteredTrades.length} trades found`

        sendToClient(ws, {
            type: 'filtered_data',
            data: filteredTrades,
            filters: filters || [],
            count: filteredTrades.length,
            message,
            timestamp: Date.now()
        })
    } catch (error) {
        console.error('Error handling filter request:', error)
        sendToClient(ws, {
            type: 'error',
            message: 'Failed to process filters',
            timestamp: Date.now()
        })
    }
}

async function handleGetAllTrades(ws) {
    try {
        const allTrades = await getCachedTrades()
        sendToClient(ws, {
            type: 'all_trades_data',
            data: allTrades,
            count: allTrades.length,
            message: `${allTrades.length} total trades`,
            timestamp: Date.now()
        })
    } catch (err) {
        console.error('Error fetching all trades:', err)
        sendToClient(ws, {
            type: 'error',
            message: 'Failed to fetch trades',
            timestamp: Date.now()
        })
    }
}

/**
 * Server startup (unchanged)
 */
async function startTradesApiServer(port = financeConfig.port, options = {}) {
    const app = express()
    app.use(cors())
    app.use(express.json())

    // REST API routes
    app.get('/trades', async (req, res) => {
        try {
            const trades = await getCachedTrades()
            res.json(trades)
        } catch (err) {
            console.error('Error fetching trades:', err)
            res.status(500).json({ error: 'Server Error' })
        }
    })

    app.get('/trades/symbol/:symbol', async (req, res) => {
        try {
            const symbol = req.params.symbol.toUpperCase()
            const allTrades = await getCachedTrades()
            const symbolTrades = allTrades.filter(trade => trade.symbol === symbol)
            res.json(symbolTrades)
        } catch (err) {
            console.error('Error fetching symbol trades:', err)
            res.status(500).json({ error: 'Server Error' })
        }
    })

    // Health check endpoint
    app.get('/health', async (req, res) => {
        const health = {
            status: 'healthy',
            timestamp: Date.now(),
            service: 'finance',
            version: '1.0.0',
            message: 'Trades API server is running',
            uptime: process.uptime(),
            memory_usage: process.memoryUsage(),
            websocket_clients: clients.size,
            cache_size: filterCache.size,
            trades_cache_age: tradesCache.timestamp ? Date.now() - tradesCache.timestamp : 0,
            database_connected: false,
            finnhub_connected: false,
            finnhub_api_key_configured: false,
            environment: process.env.NODE_ENV || 'development'
        };

        try {
            // Check database connection
            await pool.query('SELECT 1');
            health.database_connected = true;

            // Check Finnhub connection
            health.finnhub_connected = finnhubWS.socket &&
                finnhubWS.socket.readyState === WebSocket.OPEN;

            // Check Finnhub API key configuration
            const { financeConfig } = await import('./config.js');
            health.finnhub_api_key_configured = !!(financeConfig.finnhubApiKey && financeConfig.finnhubApiKey.length > 0);

            // Set status based on critical components
            if (!health.database_connected) {
                health.status = 'unhealthy';
                health.message = 'Database connection failed';
                return res.status(503).json(health);
            }

            if (!health.finnhub_api_key_configured) {
                health.status = 'degraded';
                health.message = 'Finnhub API key not configured - real-time data unavailable';
                return res.status(200).json(health);
            }

            if (!health.finnhub_connected && health.finnhub_api_key_configured) {
                health.status = 'degraded';
                health.message = 'Finnhub WebSocket disconnected - real-time data may be delayed';
            }

            res.json(health);
            
        } catch (error) {
            health.status = 'unhealthy';
            health.database_connected = false;
            health.message = `Health check failed: ${error.message}`;
            res.status(503).json(health);
        }
    });

    const httpServer = http.createServer(app)

    // WebSocket server
    wss = new WebSocketServer({ server: httpServer, path: '/ws' })

    wss.on('connection', (ws) => {
        clients.add(ws)
        clientFilters.set(ws, [])
        console.log('Client connected. Total:', clients.size)

        // Send initial message
        sendToClient(ws, {
            type: 'initial_data',
            data: [],
            count: 0,
            message: 'Connected. Select filters to view trades.',
            timestamp: Date.now()
        })

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString())
                await handleClientMessage(ws, data)
            } catch (error) {
                console.error('Message parse error:', error)
                sendToClient(ws, {
                    type: 'error',
                    message: 'Invalid JSON',
                    timestamp: Date.now()
                })
            }
        })

        ws.on('close', () => {
            clients.delete(ws)
            clientFilters.delete(ws)
            console.log('Client disconnected. Total:', clients.size)
        })

        ws.on('error', (error) => {
            console.error('WebSocket error:', error)
            clients.delete(ws)
            clientFilters.delete(ws)
        })
    })

    // Start Finnhub with enhanced throttling
    try {
        await finnhubWS.start(options)
        setupFinnhubIntegration()
    } catch (error) {
        console.error('Finnhub setup error:', error)
    }

    return new Promise((resolve, reject) => {
        httpServer.listen(port, () => {
            console.log(`Trades API running on http://localhost:${port}`)
            resolve({ httpServer, wss })
        }).on('error', reject)
    })
}

/**
 * OPTIMIZATION: Enhanced throttling for Finnhub integration
 */
function setupFinnhubIntegration() {
    let updatePending = false
    let updateCount = 0
    const BATCH_SIZE = 10 // Process updates in batches

    if (finnhubWS.socket) {
        finnhubWS.socket.on('message', () => {
            updateCount++

            if (updatePending) return

            updatePending = true

            // Batch updates - wait for multiple updates or timeout
            setTimeout(async () => {
                updatePending = false
                const processedCount = updateCount
                updateCount = 0

                try {
                    console.log(`Processing ${processedCount} Finnhub updates`)
                    await broadcastUpdatedTrades()
                } catch (err) {
                    console.error('Broadcast error:', err)
                }
            }, updateCount >= BATCH_SIZE ? 500 : 1500) // Faster for batches
        })
    }
}

// Rest of the functions remain the same...
function setupGracefulShutdown(httpServer) {
    console.log('Setting up graceful shutdown handlers...')

    function shutdown(signal) {
        console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`)

        httpServer.close(() => {
            console.log('✅ HTTP server closed')
        })

        if (wss) {
            console.log('🔌 Closing WebSocket connections...')
            wss.clients.forEach((ws) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close()
                }
            })
            wss.close(() => {
                console.log('✅ WebSocket server closed')
            })
        }

        if (finnhubWS) {
            console.log('📡 Disconnecting Finnhub WebSocket...')
            finnhubWS.disconnect()
            finnhubWS.stopCronJobs()
        }

        clearCaches()
        console.log('✅ Graceful shutdown complete')
        process.exit(0)
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
    process.on('SIGUSR2', () => shutdown('SIGUSR2'))

    process.on('uncaughtException', (error) => {
        console.error('❌ Uncaught Exception:', error)
        shutdown('uncaughtException')
    })

    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
        shutdown('unhandledRejection')
    })
}

function getConnectionStats() {
    return {
        total_clients: clients.size,
        active_filters: clientFilters.size,
        cache_size: filterCache.size,
        trades_cache_age: tradesCache.timestamp ? Date.now() - tradesCache.timestamp : 0
    }
}

export {
    startTradesApiServer,
    setupGracefulShutdown,
    broadcastUpdatedTrades,
    getConnectionStats,
    clearCaches
};