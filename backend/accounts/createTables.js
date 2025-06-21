import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  max: 100,
  idleTimeoutMillis: 30000,
  ssl: { rejectUnauthorized: false },
});

export async function createTables() {
  const client = await pool.connect();

  try {
    console.log("👤 Creating accounts database tables...");

    const createRolesTable = `
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;

    const createUsersTable = `
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
            );
        `;

    const createLinkedAccountsTable = `
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
            );
        `;

    const createUserSettingsTable = `
            CREATE TABLE IF NOT EXISTS user_settings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                settings_data JSONB NOT NULL DEFAULT '{}',
                version VARCHAR(20) DEFAULT '2.0.0-beta.1',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id)
            );
        `;

    const createRssFeedsTable = `
            CREATE TABLE IF NOT EXISTS rss_feeds (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                url VARCHAR(1000) NOT NULL,
                category VARCHAR(100) DEFAULT 'General',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;

    const insertDefaultRoles = `
            INSERT INTO roles (name) VALUES ('admin'), ('user') 
            ON CONFLICT (name) DO NOTHING;
        `;

    await client.query(createRolesTable);
    console.log('✅ Table "roles" created successfully');

    await client.query(createUsersTable);
    console.log('✅ Table "users" created successfully');

    await client.query(createLinkedAccountsTable);
    console.log('✅ Table "linked_accounts" created successfully');

    await client.query(createUserSettingsTable);
    console.log('✅ Table "user_settings" created successfully');

    await client.query(createRssFeedsTable);
    console.log('✅ Table "rss_feeds" created successfully');

    await client.query(insertDefaultRoles);
    console.log("✅ Default roles inserted successfully");

    console.log("✅ All accounts database tables created successfully");
  } catch (error) {
    console.error("❌ Error creating accounts database tables:", error);
    throw error;
  } finally {
    client.release();
  }
}

export async function initializeDatabase() {
  try {
    console.log("🚀 Initializing accounts database...");
    await createTables();
    console.log("✅ Accounts database initialization complete");
  } catch (error) {
    console.error("❌ Accounts database initialization failed:", error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log("✅ Accounts database setup complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Accounts database setup failed:", error);
      process.exit(1);
    });
}
