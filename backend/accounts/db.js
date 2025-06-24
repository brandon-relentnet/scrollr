import pkg from 'pg';
import { dbConfig } from './config.js';

const { Pool } = pkg;

const pool = new Pool({
    ...dbConfig,
    // Optional pool tuning:
    max: 100,         // maximum number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
});

// Initialize database tables
export async function initializeDatabase() {
    try {
        // Create roles table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insert default roles
        await pool.query(`
            INSERT INTO roles (id, name) VALUES 
            (1, 'admin'),
            (2, 'user')
            ON CONFLICT (id) DO NOTHING
        `);

        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                role_id INTEGER DEFAULT 2 REFERENCES roles(id),
                is_active BOOLEAN DEFAULT true,
                reset_token VARCHAR(255),
                reset_token_expires TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create linked_accounts table for external service connections
        await pool.query(`
            CREATE TABLE IF NOT EXISTS linked_accounts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                service_name VARCHAR(50) NOT NULL,
                external_id VARCHAR(255) NOT NULL,
                access_token TEXT,
                refresh_token TEXT,
                token_expires TIMESTAMP WITH TIME ZONE,
                account_data JSONB,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, service_name)
            )
        `);

        // Create user_settings table for extension settings
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_settings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                settings_data JSONB NOT NULL DEFAULT '{}',
                version VARCHAR(20) DEFAULT '2.0.0-beta.1',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id)
            )
        `);

        // Create rss_feeds table for user RSS feeds
        await pool.query(`
            CREATE TABLE IF NOT EXISTS rss_feeds (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                url VARCHAR(1000) NOT NULL,
                category VARCHAR(100) DEFAULT 'General',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Database tables initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

export default pool;