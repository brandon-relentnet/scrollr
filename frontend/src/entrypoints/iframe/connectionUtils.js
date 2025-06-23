import { buildUrl, buildWsUrl, SERVICE_CONFIG } from '../config/endpoints.js';

/**
 * Check if a server is ready by hitting its health endpoint
 */
async function checkServerHealth(port, timeout = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        // Determine service by port for health check URL
        const serviceMap = { 5000: 'accounts', 4001: 'finance', 4000: 'sports' };
        const service = serviceMap[port];
        if (!service) {
            throw new Error(`Unknown service port: ${port}`);
        }
        const healthUrl = buildUrl(service, '/health');
        
        const response = await fetch(healthUrl, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json'
            }
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            const health = await response.json();
            return health.status === 'healthy';
        }
        return false;
    } catch (error) {
        clearTimeout(timeoutId);
        console.log(`Health check failed for port ${port}:`, error.message);
        return false;
    }
}

/**
 * Wait for server to be ready with exponential backoff
 */
async function waitForServerReady(port, maxAttempts = 10) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`Checking server health (port ${port}), attempt ${attempt}/${maxAttempts}`);

        const isReady = await checkServerHealth(port);
        if (isReady) {
            console.log(`Server on port ${port} is ready!`);
            return true;
        }

        if (attempt < maxAttempts) {
            // Exponential backoff: 1s, 2s, 4s, 8s, etc.
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
            console.log(`Server not ready, waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    console.error(`Server on port ${port} failed to become ready after ${maxAttempts} attempts`);
    return false;
}

/**
 * Create WebSocket connection with server readiness check
 */
async function createWebSocketConnection(port, path = '/ws') {
    console.log(`Waiting for server on port ${port} to be ready...`);

    const isReady = await waitForServerReady(port);
    if (!isReady) {
        throw new Error(`Server on port ${port} is not ready`);
    }

    // Determine service by port for WebSocket URL
    const serviceMap = { 5000: 'accounts', 4001: 'finance', 4000: 'sports' };
    const service = serviceMap[port];
    if (!service) {
        throw new Error(`Unknown service port: ${port}`);
    }
    const wsUrl = buildWsUrl(service, path);
    
    console.log(`Creating WebSocket connection to ${wsUrl}`);
    return new WebSocket(wsUrl);
}

export { checkServerHealth, waitForServerReady, createWebSocketConnection };