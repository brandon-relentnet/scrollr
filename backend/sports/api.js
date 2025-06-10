// api.js - Updated API server with WebSocket filtering instead of Socket.IO
const express = require('express')
const cors = require('cors')
const http = require('http')
const WebSocket = require('ws')
const { getAllGames, getGamesByLeague } = require('./dbQueries')

let wss = null  // WebSocket server reference
const clients = new Set()  // Track connected clients and their filters
const clientFilters = new Map()  // Map client to their current filters

/**
 * Filter games based on selected filters
 * NOW PROPERLY HANDLES EMPTY FILTERS
 */
async function getFilteredGames(filters) {
    try {
        if (!filters || filters.length === 0) {
            // No filters = return empty array (not all games)
            return []
        }

        // Extract league filters - your filters will be like ["NFL", "MLB"] directly
        const leagueFilters = filters.filter(f => ['NFL', 'NBA', 'MLB', 'NHL'].includes(f))

        // Extract state filters
        const stateFilters = filters.filter(f => f.startsWith('state_')).map(f => f.replace('state_', ''))

        // If we have league filters, get games for those leagues
        if (leagueFilters.length > 0) {
            let allFilteredGames = []
            for (const league of leagueFilters) {
                const leagueGames = await getGamesByLeague(league)
                allFilteredGames = allFilteredGames.concat(leagueGames)
            }

            // If we also have state filters, filter further
            if (stateFilters.length > 0) {
                allFilteredGames = allFilteredGames.filter(game =>
                    stateFilters.includes(game.state)
                )
            }

            return allFilteredGames
        }

        // If only state filters (no league filters), get all games then filter by state
        if (stateFilters.length > 0) {
            const allGames = await getAllGames()
            return allGames.filter(game => stateFilters.includes(game.state))
        }

        // For any other unrecognized filters, return empty array
        return []

    } catch (err) {
        console.error('Error filtering games:', err)
        return []
    }
}

/**
 * Get all games (separate function for when you actually want all games)
 */
async function getAllGamesForAPI() {
    try {
        return await getAllGames()
    } catch (err) {
        console.error('Error fetching all games:', err)
        return []
    }
}

/**
 * startApiServer(port):
 *   1) Creates Express app with API routes (optional - keep if you need REST endpoints)
 *   2) Creates WebSocket server for real-time filtering
 *   3) Listens on the specified port
 */
function startApiServer(port = 4000) {
    const app = express()
    app.use(cors())
    app.use(express.json())

    // Optional: Keep REST API routes if you still need them
    app.get('/api/games', async (req, res) => {
        try {
            const games = await getAllGamesForAPI()
            res.json(games)
        } catch (err) {
            console.error('Error fetching all games:', err)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    })

    app.get('/api/games/:league', async (req, res) => {
        try {
            const leagueName = req.params.league
            const games = await getGamesByLeague(leagueName)
            res.json(games)
        } catch (err) {
            console.error('Error fetching league games:', err)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    })

    app.get('/health', async (req, res) => {
        const health = {
            status: 'healthy',
            timestamp: Date.now(),
            message: 'Sports API server is running',
            websocket_clients: clients.size,
            database_connected: false
        };

        try {
            // Test database connection
            await pool.query('SELECT 1');
            health.database_connected = true;
            res.json(health);
        } catch (error) {
            health.status = 'unhealthy';
            health.database_connected = false;
            health.message = 'Database connection failed';
            res.status(503).json(health);
        }
    });

    // Create HTTP server
    const httpServer = http.createServer(app)

    // Create WebSocket server
    wss = new WebSocket.Server({
        server: httpServer,  // Attach to HTTP server so both REST and WS work
        path: '/ws'  // Optional: specific path for WebSocket connections
    })

    console.log('WebSocket server created')

    wss.on('connection', (ws) => {
        clients.add(ws)
        clientFilters.set(ws, [])  // Initialize with no filters
        console.log('Client connected. Total clients:', clients.size)

        // Send welcome message
        ws.send(JSON.stringify({
            type: 'welcome',
            message: 'Connected to games API WebSocket',
            timestamp: Date.now()
        }))

        // Handle incoming messages
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString())
                console.log('Received message:', data)

                switch (data.type) {
                    case 'connection':
                        console.log('Client connected at:', new Date(data.timestamp))
                        // Don't send initial data - wait for filter request
                        ws.send(JSON.stringify({
                            type: 'connection_confirmed',
                            message: 'Connection established. Send filter_request to get games.',
                            timestamp: Date.now()
                        }))
                        break

                    case 'filter_request':
                        console.log('Filter request:', data.filters)
                        // Store client's current filters
                        clientFilters.set(ws, data.filters)

                        // Get filtered results
                        const filteredGames = await getFilteredGames(data.filters)
                        const responseMessage = data.filters.length === 0
                            ? 'No filters selected. Select sports or finance options to see games.'
                            : `Found ${filteredGames.length} games matching your filters`

                        ws.send(JSON.stringify({
                            type: 'filtered_data',
                            data: filteredGames,
                            filters: data.filters,
                            count: filteredGames.length,
                            message: responseMessage,
                            timestamp: Date.now()
                        }))
                        break

                    case 'get_all_games':
                        // Explicit request for all games (if needed)
                        console.log('Request for all games')
                        const allGames = await getAllGamesForAPI()
                        ws.send(JSON.stringify({
                            type: 'all_games_data',
                            data: allGames,
                            count: allGames.length,
                            message: `Loaded ${allGames.length} total games`,
                            timestamp: Date.now()
                        }))
                        break

                    case 'user_message':
                        console.log('User message:', data.message)
                        ws.send(JSON.stringify({
                            type: 'echo',
                            original_message: data.message,
                            timestamp: Date.now(),
                            message: `Server received: "${data.message}"`
                        }))
                        break

                    case 'test_request':
                        console.log('Test request received')
                        ws.send(JSON.stringify({
                            type: 'new_data',
                            data: {
                                random_number: Math.floor(Math.random() * 1000),
                                server_time: new Date().toISOString(),
                                message: 'This is test data from the games API server'
                            },
                            timestamp: Date.now()
                        }))
                        break

                    default:
                        console.log('Unknown message type:', data.type)
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Unknown message type',
                            timestamp: Date.now()
                        }))
                }
            } catch (error) {
                console.error('Error parsing message:', error)
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid JSON format',
                    timestamp: Date.now()
                }))
            }
        })

        ws.on('close', () => {
            clients.delete(ws)
            clientFilters.delete(ws)
            console.log('Client disconnected. Total clients:', clients.size)
        })

        ws.on('error', (error) => {
            console.error('WebSocket error:', error)
            clients.delete(ws)
            clientFilters.delete(ws)
        })
    })

    // Start listening
    return new Promise((resolve, reject) => {
        httpServer.listen(port, () => {
            console.log(`\n🚀 Express + WebSocket running on http://localhost:${port}`)
            console.log(`🔌 WebSocket endpoint: ws://localhost:${port}/ws`)
            resolve()
        }).on('error', (err) => {
            reject(err)
        })
    })
}

/**
 * broadcastUpdatedGames(optionalLeague):
 *   Send updates to all connected clients based on their current filters
 *   This replaces the old Socket.IO broadcast function
 */
async function broadcastUpdatedGames(optionalLeague) {
    if (!wss || clients.size === 0) return

    console.log(`Broadcasting game updates${optionalLeague ? ` for league: ${optionalLeague}` : ' for all leagues'}`)

    // Notify all clients that data has been updated
    const updateNotification = {
        type: 'games_updated',
        league: optionalLeague || 'ALL',
        message: optionalLeague ?
            `New data available for ${optionalLeague} league` :
            'New game data available',
        timestamp: Date.now()
    }

    // Send notification to all clients
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(updateNotification))
        }
    })

    // Optionally: refresh each client's current filtered view
    // This sends updated filtered data based on each client's current filters
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            try {
                const currentFilters = clientFilters.get(client) || []
                const refreshedData = await getFilteredGames(currentFilters)

                const responseMessage = currentFilters.length === 0
                    ? 'No filters selected. Select sports or finance options to see games.'
                    : `Updated: ${refreshedData.length} games match your current filters`

                client.send(JSON.stringify({
                    type: 'filtered_data',
                    data: refreshedData,
                    filters: currentFilters,
                    count: refreshedData.length,
                    message: responseMessage,
                    is_refresh: true,
                    timestamp: Date.now()
                }))
            } catch (err) {
                console.error('Error refreshing client data:', err)
            }
        }
    }
}

/**
 * Utility function to broadcast to all clients
 */
function broadcast(data) {
    const message = JSON.stringify(data)
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message)
        }
    })
}

/**
 * Get current connection stats
 */
function getConnectionStats() {
    return {
        total_clients: clients.size,
        clients_with_filters: Array.from(clientFilters.entries())
            .filter(([client, filters]) => filters.length > 0).length
    }
}

module.exports = {
    startApiServer,
    broadcastUpdatedGames,
    broadcast,
    getConnectionStats
}