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
        console.log('🏈 Creating sports database tables...');
        
        const createGamesTable = `
            CREATE TABLE IF NOT EXISTS games (
                id SERIAL PRIMARY KEY,
                league VARCHAR(50) NOT NULL,
                external_game_id VARCHAR(100) NOT NULL,
                link VARCHAR(500),
                home_team_name VARCHAR(100) NOT NULL,
                home_team_logo VARCHAR(500),
                home_team_score INTEGER,
                away_team_name VARCHAR(100) NOT NULL,
                away_team_logo VARCHAR(500),
                away_team_score INTEGER,
                start_time TIMESTAMP WITH TIME ZONE NOT NULL,
                short_detail VARCHAR(200),
                state VARCHAR(50) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(league, external_game_id)
            );
        `;
        
        await client.query(createGamesTable);
        console.log('✅ Table "games" created successfully');
        
        console.log('✅ All sports database tables created successfully');
        
    } catch (error) {
        console.error('❌ Error creating sports database tables:', error);
        throw error;
    } finally {
        client.release();
    }
}

export async function initializeDatabase() {
    try {
        console.log('🚀 Initializing sports database...');
        await createTables();
        console.log('✅ Sports database initialization complete');
    } catch (error) {
        console.error('❌ Sports database initialization failed:', error);
        throw error;
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    initializeDatabase()
        .then(() => {
            console.log('✅ Sports database setup complete');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Sports database setup failed:', error);
            process.exit(1);
        });
}