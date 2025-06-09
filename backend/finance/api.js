// trades-api.js - Optimized version with performance improvements
const express = require('express')
const cors = require('cors')
const http = require('http')
const WebSocket = require('ws')
const tradeService = require('./tradeService')
const finnhubWS = require('./finnhubWebSocket')
require('dotenv').config()

let wss = null
const clients = new Set()
const clientFilters = new Map()

// OPTIMIZATION: Cache filtered results to avoid recomputing
const filterCache = new Map()
const CACHE_TTL = 5000 // 5 seconds
let lastTradesUpdate = 0

/**
 * OPTIMIZED: Simplified and cached filtering
 */
async function getFilteredTrades(filters) {
    try {
        if (!filters || filters.length === 0) {
            return []
        }

        // Create cache key
        const cacheKey = JSON.stringify(filters.sort())
        const now = Date.now()

        // Check cache first
        if (filterCache.has(cacheKey)) {
            const cached = filterCache.get(cacheKey)
            if (now - cached.timestamp < CACHE_TTL) {
                return cached.data
            }
        }

        // Get trades (cache this too if needed)
        const allTrades = await tradeService.getTrades()
        if (!Array.isArray(allTrades)) {
            return []
        }

        // OPTIMIZED: Single pass filtering with early returns
        const symbolFilters = new Set()
        const sectorFilters = new Set()
        const typeFilters = new Set()
        let priceFilter = null

        // Parse filters once
        for (const filter of filters) {
            if (filter.startsWith('symbol_')) {
                symbolFilters.add(filter.replace('symbol_', ''))
            } else if (filter.startsWith('sector_')) {
                sectorFilters.add(filter.replace('sector_', ''))
            } else if (filter.startsWith('type_')) {
                typeFilters.add(filter.replace('type_', ''))
            } else if (filter.startsWith('price_')) {
                priceFilter = filter
            }
        }

        // Single pass filter
        const filteredTrades = allTrades.filter(trade => {
            // Symbol check
            if (symbolFilters.size > 0 && !symbolFilters.has(trade.symbol)) {
                return false
            }

            // Sector check
            if (sectorFilters.size > 0 && !sectorFilters.has(trade.sector)) {
                return false
            }

            // Type check
            if (typeFilters.size > 0 && !typeFilters.has(trade.type)) {
                return false
            }

            // Price check
            if (priceFilter) {
                const price = parseFloat(trade.price) || 0
                switch (priceFilter) {
                    case 'price_under_50': return price < 50
                    case 'price_50_200': return price >= 50 && price <= 200
                    case 'price_over_200': return price > 200
                    default: break
                }
            }

            return true
        })

        // Cache result
        filterCache.set(cacheKey, {
            data: filteredTrades,
            timestamp: now
        })

        return filteredTrades

    } catch (err) {
        console.error('Error filtering trades:', err)
        return []
    }
}

/**
 * OPTIMIZATION: Clear cache when trades update
 */
function clearFilterCache() {
    filterCache.clear()
    lastTradesUpdate = Date.now()
}

/**
 * OPTIMIZED: Batch message sending
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
 * OPTIMIZED: Batch broadcasting with change detection
 */
async function broadcastUpdatedTrades() {
    if (!wss || clients.size === 0) return

    clearFilterCache() // Clear cache on new data

    console.log('Broadcasting to', clients.size, 'clients')

    // Collect unique filter sets to avoid duplicate work
    const uniqueFilters = new Map()
    for (const [client, filters] of clientFilters) {
        if (client.readyState === WebSocket.OPEN) {
            const filterKey = JSON.stringify(filters.sort())
            if (!uniqueFilters.has(filterKey)) {
                uniqueFilters.set(filterKey, {
                    filters,
                    clients: []
                })
            }
            uniqueFilters.get(filterKey).clients.push(client)
        }
    }

    // Process each unique filter set once
    const results = await Promise.all(
        Array.from(uniqueFilters.values()).map(async ({ filters, clients }) => {
            const data = await getFilteredTrades(filters)
            return { filters, clients, data }
        })
    )

    // Send results to clients
    const timestamp = Date.now()
    for (const { filters, clients, data } of results) {
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

        clients.forEach(client => sendToClient(client, message))
    }
}

/**
 * OPTIMIZED: Simplified message handler
 */
function handleClientMessage(ws, data) {
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
}

async function handleGetAllTrades(ws) {
    try {
        const allTrades = await tradeService.getTrades()
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
 * OPTIMIZED: Server startup with less complexity
 */
async function startTradesApiServer(port = 4001, options = {}) {
    const app = express()
    app.use(cors())
    app.use(express.json())

    // REST API routes
    app.get('/api/trades', async (req, res) => {
        try {
            const trades = await tradeService.getTrades()
            res.json(trades)
        } catch (err) {
            console.error('Error fetching trades:', err)
            res.status(500).json({ error: 'Server Error' })
        }
    })

    app.get('/api/trades/symbol/:symbol', async (req, res) => {
        try {
            const symbol = req.params.symbol.toUpperCase()
            const allTrades = await tradeService.getTrades()
            const symbolTrades = allTrades.filter(trade => trade.symbol === symbol)
            res.json(symbolTrades)
        } catch (err) {
            console.error('Error fetching symbol trades:', err)
            res.status(500).json({ error: 'Server Error' })
        }
    })

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            timestamp: Date.now(),
            message: 'Trades API server is running',
            websocket_clients: clients.size,
            cache_size: filterCache.size
        })
    })

    const httpServer = http.createServer(app)

    // WebSocket server
    wss = new WebSocket.Server({ server: httpServer, path: '/ws' })

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

    // Start Finnhub with throttled integration
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
 * OPTIMIZED: Throttled Finnhub integration
 */
function setupFinnhubIntegration() {
    let updatePending = false

    if (finnhubWS.socket) {
        finnhubWS.socket.on('message', () => {
            if (updatePending) return

            updatePending = true
            setTimeout(async () => {
                updatePending = false
                try {
                    await broadcastUpdatedTrades()
                } catch (err) {
                    console.error('Broadcast error:', err)
                }
            }, 1000)
        })
    }
}

/**
 * Setup graceful shutdown handling
 */
function setupGracefulShutdown(httpServer) {
    console.log('Setting up graceful shutdown handlers...')

    function shutdown(signal) {
        console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`)

        // Stop accepting new connections
        httpServer.close(() => {
            console.log('✅ HTTP server closed')
        })

        // Close all WebSocket connections
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

        // Disconnect Finnhub
        if (finnhubWS) {
            console.log('📡 Disconnecting Finnhub WebSocket...')
            finnhubWS.disconnect()
            finnhubWS.stopCronJobs()
        }

        // Clear caches
        clearFilterCache()

        console.log('✅ Graceful shutdown complete')
        process.exit(0)
    }

    // Handle different shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
    process.on('SIGUSR2', () => shutdown('SIGUSR2')) // nodemon restart

    // Handle uncaught exceptions
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
        cache_size: filterCache.size
    }
}

module.exports = {
    startTradesApiServer,
    setupGracefulShutdown,
    broadcastUpdatedTrades,
    getConnectionStats,
    clearFilterCache
}