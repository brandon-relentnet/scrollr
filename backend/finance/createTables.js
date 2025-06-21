import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    max: 100,
    idleTimeoutMillis: 30000,
    ssl: { rejectUnauthorized: false }
});

export async function createTables() {
    const client = await pool.connect();
    
    try {
        console.log('📊 Creating finance database tables...');
        
        const createTradesTable = `
            CREATE TABLE IF NOT EXISTS trades (
                id SERIAL PRIMARY KEY,
                symbol VARCHAR(10) UNIQUE NOT NULL,
                price DECIMAL(10,2),
                previous_close DECIMAL(10,2),
                price_change DECIMAL(10,2),
                percentage_change DECIMAL(5,2),
                direction VARCHAR(10),
                last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        await client.query(createTradesTable);
        console.log('✅ Table "trades" created successfully');
        
        console.log('✅ All finance database tables created successfully');
        
    } catch (error) {
        console.error('❌ Error creating finance database tables:', error);
        throw error;
    } finally {
        client.release();
    }
}

export async function initializeDatabase() {
    try {
        console.log('🚀 Initializing finance database...');
        await createTables();
        console.log('✅ Finance database initialization complete');
    } catch (error) {
        console.error('❌ Finance database initialization failed:', error);
        throw error;
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    initializeDatabase()
        .then(() => {
            console.log('✅ Finance database setup complete');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Finance database setup failed:', error);
            process.exit(1);
        });
}