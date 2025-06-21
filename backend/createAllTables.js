import { initializeDatabase as createAccountsTables } from './accounts/createTables.js';
import { initializeDatabase as createFinanceTables } from './finance/createTables.js';
import { initializeDatabase as createSportsTables } from './sports/createTables.js';

async function createAllTables() {
    console.log('🚀 Creating all database tables for Scrollr backend services...\n');
    
    const results = {
        accounts: false,
        finance: false,
        sports: false
    };
    
    // Create accounts tables
    console.log('📂 Setting up Accounts service tables...');
    try {
        await createAccountsTables();
        results.accounts = true;
        console.log('✅ Accounts tables created successfully\n');
    } catch (error) {
        console.error('❌ Accounts tables failed:', error.code === 'ECONNREFUSED' ? 'Database connection refused' : error.message);
        console.log('⚠️  Skipping accounts service (database may not be accessible)\n');
    }
    
    // Create finance tables
    console.log('📂 Setting up Finance service tables...');
    try {
        await createFinanceTables();
        results.finance = true;
        console.log('✅ Finance tables created successfully\n');
    } catch (error) {
        console.error('❌ Finance tables failed:', error.code === 'ECONNREFUSED' ? 'Database connection refused' : error.message);
        console.log('⚠️  Skipping finance service (database may not be accessible)\n');
    }
    
    // Create sports tables
    console.log('📂 Setting up Sports service tables...');
    try {
        await createSportsTables();
        results.sports = true;
        console.log('✅ Sports tables created successfully\n');
    } catch (error) {
        console.error('❌ Sports tables failed:', error.code === 'ECONNREFUSED' ? 'Database connection refused' : error.message);
        console.log('⚠️  Skipping sports service (database may not be accessible)\n');
    }
    
    // Summary
    const successful = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;
    
    if (successful === total) {
        console.log('🎉 All database tables created successfully!');
        console.log('✅ Your backend services are ready to run.');
    } else if (successful > 0) {
        console.log(`⚠️  Partial success: ${successful}/${total} services completed`);
        console.log('✅ Tables created for:', Object.entries(results).filter(([_, success]) => success).map(([name, _]) => name).join(', '));
        console.log('❌ Failed services:', Object.entries(results).filter(([_, success]) => !success).map(([name, _]) => name).join(', '));
        console.log('\n💡 Failed services will create tables automatically when they start');
    } else {
        console.log('❌ No tables were created - all database connections failed');
        console.log('💡 Check your database connections and try again');
        console.log('💡 Tables will be created automatically when services start');
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    createAllTables()
        .then(() => {
            console.log('\n✅ Database setup process completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Unexpected error during database setup:', error);
            process.exit(1);
        });
}