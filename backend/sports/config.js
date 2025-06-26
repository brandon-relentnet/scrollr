import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the centralized .env file
dotenv.config({ path: join(__dirname, "..", ".env") });

// Common database configuration
export const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
};

// Service-specific configurations
export const accountsConfig = {
  port: parseInt(process.env.ACCOUNTS_PORT) || 5000,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || "development",
};

export const financeConfig = {
  port: parseInt(process.env.FINANCE_PORT) || 4001,
  finnhubApiKey: process.env.FINNHUB_API_KEY,
  nodeEnv: process.env.NODE_ENV || "development",
  // Optional WebSocket settings
  wsHeartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 30000,
  wsReconnectInterval: parseInt(process.env.WS_RECONNECT_INTERVAL) || 5000,
  // Optional rate limiting
  apiRateLimitWindow: parseInt(process.env.API_RATE_LIMIT_WINDOW) || 60000,
  apiRateLimitMax: parseInt(process.env.API_RATE_LIMIT_MAX) || 60,
  // Optional cache settings
  redisUrl: process.env.REDIS_URL,
  cacheTtl: parseInt(process.env.CACHE_TTL) || 300,
};

export const sportsConfig = {
  port: parseInt(process.env.SPORTS_PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  // ESPN API configuration
  espnApiUrl:
    process.env.ESPN_API_URL || "https://site.api.espn.com/apis/site/v2/sports",
  // Optional ESPN API settings
  espnApiKey: process.env.ESPN_API_KEY,
  espnApiSecret: process.env.ESPN_API_SECRET,
  // Optional WebSocket settings
  wsHeartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 30000,
  wsMaxConnections: parseInt(process.env.WS_MAX_CONNECTIONS) || 1000,
  // Optional polling configuration
  pollIntervalMinutes: parseInt(process.env.POLL_INTERVAL_MINUTES) || 1,
  dailyScheduleHour: parseInt(process.env.DAILY_SCHEDULE_HOUR) || 3,
  dailyScheduleTimezone:
    process.env.DAILY_SCHEDULE_TIMEZONE || "America/New_York",
  // Optional cache settings
  enableCache: process.env.ENABLE_CACHE === "true",
  cacheDurationMinutes: parseInt(process.env.CACHE_DURATION_MINUTES) || 5,
  // Optional logging
  logLevel: process.env.LOG_LEVEL || "info",
  logFilePath: process.env.LOG_FILE_PATH || "./logs/finance.log",
};

// Validation function to ensure required configs are present
export function validateConfig(serviceName) {
  const requiredCommon = ["DB_HOST", "DB_DATABASE", "DB_USER", "DB_PASSWORD"];
  const requiredByService = {
    accounts: ["JWT_SECRET", "ACCOUNTS_PORT"],
    finance: ["FINNHUB_API_KEY", "FINANCE_PORT"],
    sports: ["ESPN_API_URL", "SPORTS_PORT"],
  };

  const missing = [];

  // Check common requirements
  requiredCommon.forEach((key) => {
    if (!process.env[key]) missing.push(key);
  });

  // Check service-specific requirements
  if (requiredByService[serviceName]) {
    requiredByService[serviceName].forEach((key) => {
      if (!process.env[key]) missing.push(key);
    });
  }

  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
    console.error("Please check your .env file in the backend directory");
    process.exit(1);
  }
}
