import { buildUrl, buildWsUrl, SERVICE_CONFIG } from '../config/endpoints.js';

/**
 * Check if a server is ready by hitting its health endpoint
 */
async function checkServerHealth(service, timeout = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
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
        console.log(`Health check failed for ${service}:`, error.message);
        return false;
    }
}

/**
 * Wait for server to be ready with exponential backoff
 */
async function waitForServerReady(service, maxAttempts = 10) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`Checking server health (${service}), attempt ${attempt}/${maxAttempts}`);

        const isReady = await checkServerHealth(service);
        if (isReady) {
            console.log(`${service} service is ready!`);
            return true;
        }

        if (attempt < maxAttempts) {
            // Exponential backoff: 1s, 2s, 4s, 8s, etc.
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
            console.log(`Server not ready, waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    console.error(`${service} service failed to become ready after ${maxAttempts} attempts`);
    return false;
}

/**
 * Create WebSocket connection with server readiness check
 */
async function createWebSocketConnection(service, path = '/ws') {
    console.log(`Waiting for ${service} service to be ready...`);

    const isReady = await waitForServerReady(service);
    if (!isReady) {
        throw new Error(`${service} service is not ready`);
    }

    const wsUrl = buildWsUrl(service, path);
    
    console.log(`Creating WebSocket connection to ${wsUrl}`);
    return new WebSocket(wsUrl);
}

export { checkServerHealth, waitForServerReady, createWebSocketConnection };