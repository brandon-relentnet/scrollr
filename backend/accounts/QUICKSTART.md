# Accounts System Quick Start

## 1. Database Setup (One-time)

```bash
# Install PostgreSQL if not already installed
# On macOS: brew install postgresql
# On Ubuntu: sudo apt install postgresql

# Start PostgreSQL service
# On macOS: brew services start postgresql
# On Ubuntu: sudo systemctl start postgresql

# Create database
createdb extension_accounts

# Optional: Create dedicated user
psql -c "CREATE USER extension_user WITH PASSWORD 'your_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE extension_accounts TO extension_user;"
```

## 2. Backend Setup

```bash
# Navigate to accounts backend
cd backend/accounts

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

Edit `.env`:
```env
PORT=5000
JWT_SECRET=your_super_secure_jwt_secret_change_this_in_production
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=extension_accounts
DB_USER=postgres
DB_PASSWORD=your_db_password
```

## 3. Start the Backend

```bash
# Development mode (auto-reload)
npm run dev

# OR Production mode
npm start
```

You should see:
```
Database tables initialized successfully
Accounts server running on port 5000
```

## 4. Using the Extension

1. Build the extension: `npm run build` (from project root)
2. Load the extension in Chrome
3. Open extension popup → Accounts tab
4. Create account or sign in

**Settings Sync**: When logged in, your extension settings (themes, speed, position, toggles) are automatically saved to your account and synced across devices. When you log out, settings are saved. When you log in, your saved settings are restored.

## 5. Testing the API

```bash
# Test server is running
curl http://localhost:5000

# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "password123"
  }'
```

## 6. Create Admin User

After registering through the extension:

```sql
# Connect to database
psql extension_accounts

# Make user admin (replace 'username' with actual username)
UPDATE users SET role_id = 1 WHERE username = 'your_username';
```

## Troubleshooting

### Database Connection Issues
- Check PostgreSQL is running: `pg_isready`
- Verify database exists: `psql -l | grep extension_accounts`
- Check credentials in `.env`

### Port Already in Use
- Change PORT in `.env` to different number (e.g., 5001)
- Update API_BASE_URL in `useAuth.tsx` if needed

### Extension Not Connecting
- Ensure backend is running on correct port
- Check browser console for CORS errors
- Verify API_BASE_URL in frontend matches backend port

## Default File Locations

- Backend: `backend/accounts/`
- Frontend Hook: `src/entrypoints/popup/hooks/useAuth.tsx`
- UI Component: `src/entrypoints/popup/tabs/AccountsTab.tsx`