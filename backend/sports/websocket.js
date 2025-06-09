const WebSocket = require('ws');

// Mock database data
const mockData = [
    { id: 1, name: 'Item 1', category: 'category1', status: 'active', priority: 'high', value: 100 },
    { id: 2, name: 'Item 2', category: 'category2', status: 'pending', priority: 'medium', value: 250 },
    { id: 3, name: 'Item 3', category: 'category1', status: 'active', priority: 'low', value: 75 },
    { id: 4, name: 'Item 4', category: 'category3', status: 'pending', priority: 'high', value: 300 },
    { id: 5, name: 'Item 5', category: 'category2', status: 'active', priority: 'medium', value: 180 },
    { id: 6, name: 'Item 6', category: 'category1', status: 'pending', priority: 'low', value: 90 },
    { id: 7, name: 'Item 7', category: 'category3', status: 'active', priority: 'high', value: 400 },
    { id: 8, name: 'Item 8', category: 'category2', status: 'pending', priority: 'medium', value: 220 }
];

// Function to filter data based on selected filters
function filterData(filters) {
    if (!filters || filters.length === 0) {
        return mockData; // Return all data if no filters
    }

    // TODO: Replace this with actual database query
    // Example with SQL: SELECT * FROM your_table WHERE category IN (?) AND status IN (?) AND priority IN (?)

    return mockData.filter(item => {
        // Check category filters
        const categoryFilters = filters.filter(f => f.startsWith('category'));
        const categoryMatch = categoryFilters.length === 0 || categoryFilters.includes(item.category);

        // Check status filters
        const statusFilters = filters.filter(f => f.startsWith('status_')).map(f => f.replace('status_', ''));
        const statusMatch = statusFilters.length === 0 || statusFilters.includes(item.status);

        // Check priority filters
        const priorityFilters = filters.filter(f => f.startsWith('priority_')).map(f => f.replace('priority_', ''));
        const priorityMatch = priorityFilters.length === 0 || priorityFilters.includes(item.priority);

        return categoryMatch && statusMatch && priorityMatch;
    });
}

// WebSocket server
const wss = new WebSocket.Server({ port: 8080 });
const clients = new Set();

console.log('WebSocket server started on port 8080');

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected. Total clients:', clients.size);

    // Send welcome message to the newly connected client
    ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to WebSocket server',
        timestamp: Date.now()
    }));

    // Handle incoming messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log('Received message:', data);

            // Handle different message types
            switch (data.type) {
                case 'connection':
                    console.log('Client connected at:', new Date(data.timestamp));
                    // Send initial data load
                    const initialData = filterData([]);
                    ws.send(JSON.stringify({
                        type: 'filtered_data',
                        data: initialData,
                        filters: [],
                        count: initialData.length,
                        timestamp: Date.now()
                    }));
                    break;

                case 'filter_request':
                    console.log('Filter request:', data.filters);
                    const filteredResults = filterData(data.filters);
                    ws.send(JSON.stringify({
                        type: 'filtered_data',
                        data: filteredResults,
                        filters: data.filters,
                        count: filteredResults.length,
                        message: `Found ${filteredResults.length} items matching your filters`,
                        timestamp: Date.now()
                    }));
                    break;

                case 'user_message':
                    console.log('User message:', data.message);
                    // Echo the message back to the sender
                    ws.send(JSON.stringify({
                        type: 'echo',
                        original_message: data.message,
                        timestamp: Date.now(),
                        message: `Server received: "${data.message}"`
                    }));
                    break;

                case 'test_request':
                    console.log('Test request received');
                    // Send test data back
                    ws.send(JSON.stringify({
                        type: 'new_data',
                        data: {
                            random_number: Math.floor(Math.random() * 1000),
                            server_time: new Date().toISOString(),
                            message: 'This is test data from the server'
                        },
                        timestamp: Date.now()
                    }));
                    break;

                default:
                    console.log('Unknown message type:', data.type);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Unknown message type',
                        timestamp: Date.now()
                    }));
            }
        } catch (error) {
            console.error('Error parsing message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid JSON format',
                timestamp: Date.now()
            }));
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        console.log('Client disconnected. Total clients:', clients.size);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
    });
});

// Function to broadcast to all connected clients
function broadcast(data) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Example: Send periodic updates to all clients
setInterval(() => {
    if (clients.size > 0) {
        broadcast({
            type: 'periodic_update',
            data: {
                server_time: new Date().toISOString(),
                connected_clients: clients.size,
                uptime: process.uptime()
            },
            timestamp: Date.now()
        });
    }
}, 30000); // Every 30 seconds

// Function to trigger updates (call this from your injest.js)
function notifyClients(newData) {
    // Add new data to mock database
    const newItem = {
        id: mockData.length + 1,
        ...newData,
        timestamp: Date.now()
    };
    mockData.push(newItem);

    // Notify all clients about the new data
    broadcast({
        type: 'new_data',
        data: newItem,
        message: 'New data added to database',
        timestamp: Date.now()
    });

    // Also send updated filtered results to clients
    // Note: In a real app, you'd track each client's current filters
    // For now, we'll just broadcast that data has been updated
    broadcast({
        type: 'data_updated',
        message: 'Database updated - refresh your filters to see latest data',
        total_records: mockData.length,
        timestamp: Date.now()
    });
}

// Export the function so it can be used by other modules
module.exports = { notifyClients };

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down WebSocket server...');
    wss.close(() => {
        console.log('WebSocket server closed');
        process.exit(0);
    });
});