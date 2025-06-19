import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const isQuiet = args.includes('--quiet');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Configuration for each backend
const backends = [
  {
    name: "accounts",
    dir: path.join(__dirname, "accounts"),
    command: "node",
    args: ["server.js"],
    logFile: path.join(logsDir, "accounts.log"),
    port: 5000,
    readyPattern: /Accounts server running on port \d+/,
    urls: (port) => [`http://localhost:${port}`]
  },
  {
    name: "finance",
    dir: path.join(__dirname, "finance"),
    command: "node",
    args: ["app.js"],
    logFile: path.join(logsDir, "finance.log"),
    port: 4001,
    readyPattern: /✅ Trades API ready!/,
    urls: (port) => [
      `http://localhost:${port}/api/trades`,
      `ws://localhost:${port}/ws`,
      `http://localhost:${port}/health`
    ]
  },
  {
    name: "sports",
    dir: path.join(__dirname, "sports"),
    command: "node",
    args: ["server.js"],
    logFile: path.join(logsDir, "sports.log"),
    port: 4000,
    readyPattern: /✅ Sports API server is ready!/,
    urls: (port) => [
      `http://localhost:${port}/api/games`,
      `ws://localhost:${port}/ws`,
      `http://localhost:${port}/health`
    ]
  },
];

const processes = [];
const serverStatus = new Map(); // Track server status

// Function to start a backend
function startBackend(backend) {
  console.log(`🚀 Starting ${backend.name} backend...`);
  
  // Initialize server status
  serverStatus.set(backend.name, { 
    status: 'starting', 
    startTime: new Date(),
    ready: false,
    port: backend.port
  });

  const child = spawn(backend.command, backend.args, {
    cwd: backend.dir,
    stdio: ["pipe", "pipe", "pipe"],
  });

  // Create log file streams
  const logStream = fs.createWriteStream(backend.logFile, { flags: "a" });

  // Log timestamp
  const timestamp = new Date().toISOString();
  logStream.write(
    `\n=== ${backend.name.toUpperCase()} BACKEND STARTED AT ${timestamp} ===\n`
  );

  // Pipe stdout to log file and console
  child.stdout.on("data", (data) => {
    const message = data.toString();
    logStream.write(message);
    
    // Check if server is ready
    if (backend.readyPattern.test(message) && !serverStatus.get(backend.name).ready) {
      serverStatus.set(backend.name, { 
        ...serverStatus.get(backend.name), 
        status: 'ready', 
        ready: true 
      });
      
      console.log(`✅ ${backend.name.toUpperCase()} server is live!`);
      const urls = backend.urls(backend.port);
      urls.forEach(url => console.log(`   📍 ${url}`));
    }
    
    // Only show detailed logs if not quiet
    if (!isQuiet) console.log(`[${backend.name.toUpperCase()}] ${message.trim()}`);
  });

  // Pipe stderr to log file and console
  child.stderr.on("data", (data) => {
    const message = data.toString();
    logStream.write(`ERROR: ${message}`);
    
    // Always show errors
    console.error(`❌ [${backend.name.toUpperCase()}] ERROR: ${message.trim()}`);
  });

  // Handle process exit
  child.on("close", (code) => {
    const message = `Process exited with code ${code}\n`;
    logStream.write(message);
    
    // Update server status
    serverStatus.set(backend.name, { 
      ...serverStatus.get(backend.name), 
      status: 'stopped', 
      ready: false 
    });
    
    // Alert that server went down
    console.log(`🔴 ${backend.name.toUpperCase()} server went down! (exit code: ${code})`);
    logStream.end();
  });

  child.on("error", (err) => {
    const message = `Failed to start process: ${err.message}\n`;
    logStream.write(message);
    
    // Update server status
    serverStatus.set(backend.name, { 
      ...serverStatus.get(backend.name), 
      status: 'error', 
      ready: false 
    });
    
    console.error(`❌ ${backend.name.toUpperCase()} failed to start: ${err.message}`);
    logStream.end();
  });

  processes.push({ name: backend.name, process: child, logStream });
  return child;
}

// Start all backends
console.log("🎯 Starting all backends...\n");

backends.forEach((backend) => {
  startBackend(backend);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n⚡ Shutting down all backends...");

  processes.forEach(({ name, process, logStream }) => {
    console.log(`Stopping ${name}...`);
    process.kill("SIGTERM");
    logStream.end();
  });

  setTimeout(() => {
    console.log("🔴 Force killing remaining processes...");
    processes.forEach(({ process }) => {
      process.kill("SIGKILL");
    });
    process.exit(0);
  }, 5000);
});

process.on("SIGTERM", () => {
  console.log("\n⚡ Received SIGTERM, shutting down...");
  processes.forEach(({ process }) => {
    process.kill("SIGTERM");
  });
});

console.log(`📝 Logs are being written to: ${logsDir}`);
console.log("Press Ctrl+C to stop all services.\n");

if (isQuiet) {
  console.log("Running in quiet mode - only showing server status and errors.");
} else {
  console.log("--- LIVE OUTPUT ---\n");
}
