/**
 * Centralized configuration for all API and WebSocket endpoints
 * This file contains all connection URLs used throughout the frontend
 */

// Environment detection
const isDevelopment = () => {
  // Check if we're in development by looking for localhost or dev environment
  if (typeof window !== 'undefined') {
    return window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1';
  }
  
  // For build-time/extension context, check environment variables
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // If API_URL contains localhost or is not set, assume development
  return !apiUrl || apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');
};

// Base configuration
const BASE_CONFIG = {
  development: {
    protocol: "http",
    wsProtocol: "ws",
    host: "localhost",
    ports: {
      accounts: 5000,
      finance: 4001,
      sports: 4000,
    },
  },
  production: {
    protocol: "https",
    wsProtocol: "wss",
    host: import.meta.env.VITE_API_URL, // scrollr.olvyx.com
    paths: {
      accounts: import.meta.env.VITE_ACCOUNTS_PORT || "/api/accounts",
      finance: import.meta.env.VITE_FINANCE_PORT || "/api/finance",
      sports: import.meta.env.VITE_SPORTS_PORT || "/api/sports",
    },
  },
};

// Get current environment configuration
const getConfig = () => {
  return isDevelopment() ? BASE_CONFIG.development : BASE_CONFIG.production;
};

const config = getConfig();

// Helper function to build service base URL
const buildServiceUrl = (service) => {
  if (isDevelopment()) {
    return `${config.protocol}://${config.host}:${config.ports[service]}`;
  } else {
    // Remove trailing slash from path to prevent double slashes
    const path = config.paths[service].replace(/\/$/, '');
    return `${config.protocol}://${config.host}${path}`;
  }
};

// API Base URLs
export const API_ENDPOINTS = {
  accounts: {
    base: `${buildServiceUrl('accounts')}/api`,
    auth: {
      login: `${buildServiceUrl('accounts')}/api/auth/login`,
      register: `${buildServiceUrl('accounts')}/api/auth/register`,
      me: `${buildServiceUrl('accounts')}/api/auth/me`,
      settings: `${buildServiceUrl('accounts')}/api/auth/settings`,
      profile: `${buildServiceUrl('accounts')}/api/auth/profile`,
      changePassword: `${buildServiceUrl('accounts')}/api/auth/change-password`,
      rssFeeds: `${buildServiceUrl('accounts')}/api/auth/rss-feeds`,
    },
    health: `${buildServiceUrl('accounts')}/health`,
  },
  finance: {
    base: `${buildServiceUrl('finance')}/api`,
    trades: `${buildServiceUrl('finance')}/api/trades`,
    health: `${buildServiceUrl('finance')}/health`,
  },
  sports: {
    base: `${buildServiceUrl('sports')}/api`,
    games: `${buildServiceUrl('sports')}/api/games`,
    health: `${buildServiceUrl('sports')}/health`,
  },
};

// WebSocket URLs
export const WS_ENDPOINTS = {
  finance: isDevelopment() 
    ? `${config.wsProtocol}://${config.host}:${config.ports.finance}/ws`
    : `${config.wsProtocol}://${config.host}${config.paths.finance.replace(/\/$/, '')}/ws`,
  sports: isDevelopment()
    ? `${config.wsProtocol}://${config.host}:${config.ports.sports}/ws` 
    : `${config.wsProtocol}://${config.host}${config.paths.sports.replace(/\/$/, '')}/ws`,
};

// Service configuration for health checks and connection utils
export const SERVICE_CONFIG = {
  accounts: {
    ...(isDevelopment() ? { port: config.ports.accounts } : { path: config.paths.accounts }),
    host: config.host,
    protocol: config.protocol,
  },
  finance: {
    ...(isDevelopment() ? { port: config.ports.finance } : { path: config.paths.finance }),
    host: config.host,
    protocol: config.protocol,
    wsProtocol: config.wsProtocol,
  },
  sports: {
    ...(isDevelopment() ? { port: config.ports.sports } : { path: config.paths.sports }),
    host: config.host,
    protocol: config.protocol,
    wsProtocol: config.wsProtocol,
  },
};

// Helper function to build custom URLs if needed
export const buildUrl = (service, path = "") => {
  const serviceConfig = SERVICE_CONFIG[service];
  if (!serviceConfig) {
    throw new Error(`Unknown service: ${service}`);
  }

  if (isDevelopment()) {
    return `${serviceConfig.protocol}://${serviceConfig.host}:${serviceConfig.port}${path}`;
  } else {
    // Remove trailing slash from service path to prevent double slashes
    const cleanPath = serviceConfig.path.replace(/\/$/, '');
    return `${serviceConfig.protocol}://${serviceConfig.host}${cleanPath}${path}`;
  }
};

// Helper function to build WebSocket URLs
export const buildWsUrl = (service, path = "/ws") => {
  const serviceConfig = SERVICE_CONFIG[service];
  if (!serviceConfig) {
    throw new Error(`Unknown service: ${service}`);
  }

  if (isDevelopment()) {
    return `${serviceConfig.wsProtocol}://${serviceConfig.host}:${serviceConfig.port}${path}`;
  } else {
    // Remove trailing slash from service path to prevent double slashes
    const cleanPath = serviceConfig.path.replace(/\/$/, '');
    return `${serviceConfig.wsProtocol}://${serviceConfig.host}${cleanPath}${path}`;
  }
};

// Legacy compatibility - for files that expect just the base URL
export const API_BASE_URL = API_ENDPOINTS.accounts.base;

// Export default for easier importing
export default {
  API_ENDPOINTS,
  WS_ENDPOINTS,
  SERVICE_CONFIG,
  buildUrl,
  buildWsUrl,
  API_BASE_URL,
};
