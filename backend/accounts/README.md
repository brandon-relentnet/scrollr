# Accounts Backend

Authentication and user management backend for the browser extension.

## Features

- User registration and login
- JWT token-based authentication
- Password hashing with bcrypt
- Profile management
- Linked accounts (for external services)
- Admin functionality
- Role-based access control

## Setup

### 1. Install Dependencies

```bash
cd backend/accounts
npm install
```

### 2. Database Setup

Make sure you have PostgreSQL installed and running.

Create a database for the accounts:

```sql
CREATE DATABASE extension_accounts;
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
PORT=5000
JWT_SECRET=your_secure_jwt_secret_here_change_in_production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=extension_accounts
DB_USER=postgres
DB_PASSWORD=your_database_password
```

**Important**: Change the `JWT_SECRET` to a long, random string in production.

### 4. Run the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will automatically create the necessary database tables on first run.

## API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - Register a new user
- `POST /login` - Login user
- `GET /me` - Get current user profile (requires auth)
- `PUT /profile` - Update user profile (requires auth)
- `PUT /change-password` - Change password (requires auth)
- `DELETE /account` - Delete user account (requires auth)

### Linked Accounts (`/api/linked-accounts`)

- `GET /` - Get user's linked accounts (requires auth)
- `POST /` - Add/update linked account (requires auth)
- `DELETE /:serviceName` - Remove linked account (requires auth)
- `PUT /:serviceName/toggle` - Toggle linked account status (requires auth)

### Admin (`/api/admin`)

- `GET /users` - Get all users with pagination (requires admin)
- `GET /users/:userId` - Get user details (requires admin)
- `PUT /users/:userId/status` - Update user status (requires admin)
- `DELETE /users/:userId` - Delete user (requires admin)
- `GET /stats` - Get system statistics (requires admin)

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email address
- `password` - Bcrypt hashed password
- `phone` - Optional phone number
- `role_id` - Foreign key to roles table
- `is_active` - Account status
- `created_at`, `updated_at` - Timestamps

### Roles Table
- `id` - Primary key (1=admin, 2=user)
- `name` - Role name

### Linked Accounts Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `service_name` - External service name
- `external_id` - External account ID
- `access_token`, `refresh_token` - OAuth tokens
- `account_data` - JSON data for additional account info
- `is_active` - Account status

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token authentication
- Input validation
- Role-based access control
- Secure password requirements
- Token expiration (24 hours)

## Usage with Extension

The extension's AccountsTab connects to this backend at `http://localhost:5000/api`.

Make sure the accounts backend is running when using the extension's accounts functionality.

## Default Admin Account

After setting up, you can create an admin account by:

1. Register a normal user through the extension
2. Manually update the database to set `role_id = 1` for admin access:

```sql
UPDATE users SET role_id = 1 WHERE username = 'your_username';
```