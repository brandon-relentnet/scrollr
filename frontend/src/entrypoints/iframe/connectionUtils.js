/**
 * Check if a server is ready by hitting its health endpoint
 */
async function checkServerHealth(port, timeout = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(`http://localhost:${port}/health`, {
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

    console.log(`Creating WebSocket connection to ws://localhost:${port}${path}`);
    return new WebSocket(`ws://localhost:${port}${path}`);
}

export { checkServerHealth, waitForServerReady, createWebSocketConnection };