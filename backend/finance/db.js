// db.js is a utility file that creates a connection pool to the database using the 'pg' library.
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Create a connection pool with config from environment variables
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    // Optional pool tuning:
    max: 100,         // maximum number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
    ssl: { rejectUnauthorized: false }
});

// Initialize database connection
export async function initializeDatabase() {
    try {
        await pool.query('SELECT 1');
        console.log('✅ Database connection successful');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
}

export default pool;
