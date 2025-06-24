/**
 * Centralized configuration for all API and WebSocket endpoints
 * This file contains all connection URLs used throughout the frontend
 */

// Environment detection
const isDevelopment = () => {
  // For browser extensions, we generally use development settings
  // unless explicitly configured otherwise
  return false;
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
    host: import.meta.env.VITE_API_URL, // Replace with actual production domain
    ports: {
      accounts: import.meta.env.VITE_ACCOUNTS_PORT || 5000,
      finance: import.meta.env.VITE_FINANCE_PORT || 4001,
      sports: import.meta.env.VITE_SPORTS_PORT || 4000,
    },
  },
};

// Get current environment configuration
const getConfig = () => {
  return isDevelopment() ? BASE_CONFIG.development : BASE_CONFIG.production;
};

const config = getConfig();

// API Base URLs
export const API_ENDPOINTS = {
  accounts: {
    base: `${config.protocol}://${config.host}:${config.ports.accounts}/api`,
    auth: {
      login: `${config.protocol}://${config.host}:${config.ports.accounts}/api/auth/login`,
      register: `${config.protocol}://${config.host}:${config.ports.accounts}/api/auth/register`,
      me: `${config.protocol}://${config.host}:${config.ports.accounts}/api/auth/me`,
      settings: `${config.protocol}://${config.host}:${config.ports.accounts}/api/auth/settings`,
      profile: `${config.protocol}://${config.host}:${config.ports.accounts}/api/auth/profile`,
      changePassword: `${config.protocol}://${config.host}:${config.ports.accounts}/api/auth/change-password`,
      rssFeeds: `${config.protocol}://${config.host}:${config.ports.accounts}/api/auth/rss-feeds`,
    },
    health: `${config.protocol}://${config.host}:${config.ports.accounts}/health`,
  },
  finance: {
    base: `${config.protocol}://${config.host}:${config.ports.finance}/api`,
    trades: `${config.protocol}://${config.host}:${config.ports.finance}/api/trades`,
    health: `${config.protocol}://${config.host}:${config.ports.finance}/health`,
  },
  sports: {
    base: `${config.protocol}://${config.host}:${config.ports.sports}/api`,
    games: `${config.protocol}://${config.host}:${config.ports.sports}/api/games`,
    health: `${config.protocol}://${config.host}:${config.ports.sports}/health`,
  },
};

// WebSocket URLs
export const WS_ENDPOINTS = {
  finance: `${config.wsProtocol}://${config.host}:${config.ports.finance}/ws`,
  sports: `${config.wsProtocol}://${config.host}:${config.ports.sports}/ws`,
};

// Service configuration for health checks and connection utils
export const SERVICE_CONFIG = {
  accounts: {
    port: config.ports.accounts,
    host: config.host,
    protocol: config.protocol,
  },
  finance: {
    port: config.ports.finance,
    host: config.host,
    protocol: config.protocol,
    wsProtocol: config.wsProtocol,
  },
  sports: {
    port: config.ports.sports,
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

  return `${serviceConfig.protocol}://${serviceConfig.host}:${serviceConfig.port}${path}`;
};

// Helper function to build WebSocket URLs
export const buildWsUrl = (service, path = "/ws") => {
  const serviceConfig = SERVICE_CONFIG[service];
  if (!serviceConfig) {
    throw new Error(`Unknown service: ${service}`);
  }

  return `${serviceConfig.wsProtocol}://${serviceConfig.host}:${serviceConfig.port}${path}`;
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
