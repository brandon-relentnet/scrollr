import {
  buildUrl,
  buildWsUrl,
  SERVICE_CONFIG,
} from "@/entrypoints/config/endpoints.js";
import debugLogger, {
  DEBUG_CATEGORIES,
} from "@/entrypoints/utils/debugLogger.js";

/**
 * Check if a server is ready by hitting its health endpoint
 */
async function checkServerHealth(service, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const healthUrl = buildUrl(service, "/health");

    const response = await fetch(healthUrl, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const health = await response.json();
      return health.status === "healthy";
    }
    return false;
  } catch (error) {
    clearTimeout(timeoutId);
    debugLogger.networkEvent(`Health check failed for ${service}`, {
      error: error.message,
    });
    return false;
  }
}

/**
 * Wait for server to be ready with exponential backoff
 */
async function waitForServerReady(service, maxAttempts = 10) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    debugLogger.networkEvent(`Checking server health (${service})`, {
      attempt,
      maxAttempts,
    });

    const isReady = await checkServerHealth(service);
    if (isReady) {
      debugLogger.networkEvent(`${service} service is ready`);
      return true;
    }

    if (attempt < maxAttempts) {
      // Exponential backoff: 1s, 2s, 4s, 8s, etc.
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
      debugLogger.networkEvent(`Server not ready, waiting before retry`, {
        delay,
        service,
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  debugLogger.error(
    DEBUG_CATEGORIES.NETWORK,
    `${service} service failed to become ready`,
    { maxAttempts }
  );
  return false;
}

/**
 * Create WebSocket connection with server readiness check
 */
async function createWebSocketConnection(service, path = "/ws") {
  debugLogger.networkEvent(`Waiting for ${service} service to be ready`);

  const isReady = await waitForServerReady(service);
  if (!isReady) {
    throw new Error(`${service} service is not ready`);
  }

  const wsUrl = buildWsUrl(service, path);

  debugLogger.websocketEvent(`Creating WebSocket connection`, { wsUrl });
  return new WebSocket(wsUrl);
}

export { checkServerHealth, waitForServerReady, createWebSocketConnection };
