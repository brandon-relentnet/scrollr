/**
 * Simple test file to verify endpoints configuration
 * This can be run in development to check all URLs are correctly configured
 */

import {
  API_ENDPOINTS,
  WS_ENDPOINTS,
  SERVICE_CONFIG,
  buildUrl,
  buildWsUrl,
} from "./endpoints.js";
import debugLogger, { DEBUG_CATEGORIES } from "../utils/debugLogger.js";

// Test function to log all configurations
export function testEndpointsConfiguration() {
  debugLogger.group("Testing Endpoints Configuration", DEBUG_CATEGORIES.CONFIG);

  // Test API endpoints
  debugLogger.info(DEBUG_CATEGORIES.CONFIG, "API Endpoints", {
    accountsBase: API_ENDPOINTS.accounts.base,
    accountsAuthLogin: API_ENDPOINTS.accounts.auth.login,
    financeBase: API_ENDPOINTS.finance.base,
    sportsBase: API_ENDPOINTS.sports.base
  });

  // Test WebSocket endpoints
  debugLogger.info(DEBUG_CATEGORIES.CONFIG, "WebSocket Endpoints", {
    financeWS: WS_ENDPOINTS.finance,
    sportsWS: WS_ENDPOINTS.sports
  });

  // Test service configuration
  debugLogger.info(DEBUG_CATEGORIES.CONFIG, "Service Configuration", {
    accounts: SERVICE_CONFIG.accounts,
    finance: SERVICE_CONFIG.finance,
    sports: SERVICE_CONFIG.sports
  });

  // Test helper functions
  try {
    debugLogger.info(DEBUG_CATEGORIES.CONFIG, "Helper Functions", {
      buildUrlAccounts: buildUrl("accounts", "/health"),
      buildUrlFinance: buildUrl("finance", "/api/trades"),
      buildWsUrlFinance: buildWsUrl("finance"),
      buildWsUrlSports: buildWsUrl("sports")
    });
  } catch (error) {
    debugLogger.error(DEBUG_CATEGORIES.CONFIG, "Helper function error", error);
  }

  // Test validation
  // Validation logic
  const expectedPorts = { accounts: 5000, finance: 4001, sports: 4000 };
  let allValid = true;

  Object.entries(expectedPorts).forEach(([service, expectedPort]) => {
    const actualPort = SERVICE_CONFIG[service]?.port;
    const isValid = actualPort === expectedPort;
    allValid = allValid && isValid;
    debugLogger.info(DEBUG_CATEGORIES.CONFIG, `${service} port validation`, {
      actualPort,
      expectedPort,
      isValid
    });
  });

  // Check URL formats
  const urlPattern = /^https?:\/\/.+:\d+/;
  const wsPattern = /^wss?:\/\/.+:\d+/;

  const apiUrlValid = urlPattern.test(API_ENDPOINTS.accounts.base);
  const wsUrlValid = wsPattern.test(WS_ENDPOINTS.finance);

  debugLogger.info(DEBUG_CATEGORIES.CONFIG, "API URL format validation", { valid: apiUrlValid });
  debugLogger.info(DEBUG_CATEGORIES.CONFIG, "WebSocket URL format validation", { valid: wsUrlValid });
  const overallValid = allValid && apiUrlValid && wsUrlValid;
  debugLogger.info(DEBUG_CATEGORIES.CONFIG, "Overall configuration validation", {
    valid: overallValid,
    status: overallValid ? "VALID" : "INVALID"
  });
  debugLogger.groupEnd(DEBUG_CATEGORIES.CONFIG);

  return allValid && apiUrlValid && wsUrlValid;
}

// Auto-run test in development
if (
  typeof window !== "undefined" &&
  window.location?.hostname === "localhost"
) {
  // Small delay to ensure imports are loaded
  setTimeout(() => {
    testEndpointsConfiguration();
  }, 100);
}
