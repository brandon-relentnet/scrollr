import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { accountsConfig } from '../config.js';

const router = express.Router();

// Generate JWT token
function generateToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username, 
            email: user.email,
            role_id: user.role_id 
        },
        accountsConfig.jwtSecret,
        { expiresIn: '24h' }
    );
}

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, phone } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ 
                error: 'Username, email, and password are required' 
            });
        }

        // Check username format (alphanumeric and underscore only)
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({ 
                error: 'Username can only contain letters, numbers, and underscores' 
            });
        }

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ 
                error: 'User with this email or username already exists' 
            });
        }

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const result = await pool.query(
            `INSERT INTO users (username, email, password, phone) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, username, email, phone, role_id, created_at`,
            [username, email, passwordHash, phone]
        );

        const user = result.rows[0];
        const token = generateToken(user);

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role_id: user.role_id,
                created_at: user.created_at
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    if (accountsConfig.nodeEnv === 'development') {
        console.log('🔑 LOGIN ROUTE HIT!');
    }
    
    try {
        const { identifier, password } = req.body; // identifier can be email or username
        
        if (accountsConfig.nodeEnv === 'development') {
            console.log('🔑 Parsed identifier:', identifier);
            console.log('🔑 Password provided:', password ? 'Yes' : 'No');
        }

        if (!identifier || !password) {
            console.log('🔑 Missing credentials');
            return res.status(400).json({ 
                error: 'Email/username and password are required' 
            });
        }

        if (accountsConfig.nodeEnv === 'development') {
            console.log('🔑 Querying database for user...');
        }
        
        // Find user by email or username
        const result = await pool.query(
            `SELECT id, username, email, password, phone, role_id, is_active 
             FROM users 
             WHERE email = $1 OR username = $1`,
            [identifier]
        );

        if (accountsConfig.nodeEnv === 'development') {
            console.log('🔑 Database query result:', result.rows.length, 'users found');
        }

        if (result.rows.length === 0) {
            if (accountsConfig.nodeEnv === 'development') {
                console.log('🔑 No user found with identifier:', identifier);
            }
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        if (accountsConfig.nodeEnv === 'development') {
            console.log('🔑 User found:', { id: user.id, username: user.username, email: user.email, is_active: user.is_active });
        }

        if (!user.is_active) {
            if (accountsConfig.nodeEnv === 'development') {
                console.log('🔑 User account is deactivated');
            }
            return res.status(401).json({ error: 'Account is deactivated' });
        }

        if (accountsConfig.nodeEnv === 'development') {
            console.log('🔑 Checking password...');
        }
        
        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (accountsConfig.nodeEnv === 'development') {
            console.log('🔑 Password valid:', isValidPassword);
        }
        
        if (!isValidPassword) {
            if (accountsConfig.nodeEnv === 'development') {
                console.log('🔑 Invalid password for user:', identifier);
            }
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (accountsConfig.nodeEnv === 'development') {
            console.log('🔑 Generating token...');
        }
        const token = generateToken(user);
        if (accountsConfig.nodeEnv === 'development') {
            console.log('🔑 Token generated successfully');
        }

        if (accountsConfig.nodeEnv === 'development') {
            console.log('🔑 Sending successful response');
        }
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role_id: user.role_id
            }
        });

    } catch (error) {
        console.error('🔑 Login error:', error);
        console.error('🔑 Error stack:', error.stack);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, email, phone, role_id, created_at, updated_at 
             FROM users 
             WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { email, phone } = req.body;
        const userId = req.user.id;

        // Check if email is already taken by another user
        if (email) {
            const existingUser = await pool.query(
                'SELECT id FROM users WHERE email = $1 AND id != $2',
                [email, userId]
            );

            if (existingUser.rows.length > 0) {
                return res.status(400).json({ 
                    error: 'Email is already taken by another user' 
                });
            }
        }

        const result = await pool.query(
            `UPDATE users 
             SET email = COALESCE($1, email), 
                 phone = COALESCE($2, phone),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3 
             RETURNING id, username, email, phone, role_id, updated_at`,
            [email, phone, userId]
        );

        res.json({
            message: 'Profile updated successfully',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error updating profile' });
    }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                error: 'Current password and new password are required' 
            });
        }

        // Get current password hash
        const result = await pool.query(
            'SELECT password FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(
            currentPassword, 
            result.rows[0].password
        );

        if (!isValidPassword) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await pool.query(
            'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newPasswordHash, userId]
        );

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Server error changing password' });
    }
});

// Get user settings
router.get('/settings', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            'SELECT settings_data, version, updated_at FROM user_settings WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            // No settings found, return empty settings
            return res.json({ 
                settings: {},
                version: '2.0.0-beta.1',
                updated_at: null
            });
        }

        const { settings_data, version, updated_at } = result.rows[0];
        
        res.json({ 
            settings: settings_data,
            version: version,
            updated_at: updated_at
        });

    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Server error retrieving settings' });
    }
});

// Save user settings
router.post('/settings', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { settings, version = '2.0.0-beta.1' } = req.body;

        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ 
                error: 'Settings data is required and must be an object' 
            });
        }

        // Use UPSERT (INSERT ... ON CONFLICT ... DO UPDATE)
        const result = await pool.query(`
            INSERT INTO user_settings (user_id, settings_data, version, updated_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                settings_data = $2,
                version = $3,
                updated_at = CURRENT_TIMESTAMP
            RETURNING settings_data, version, updated_at
        `, [userId, JSON.stringify(settings), version]);

        const { settings_data, version: savedVersion, updated_at } = result.rows[0];
        
        res.json({ 
            message: 'Settings saved successfully',
            settings: settings_data,
            version: savedVersion,
            updated_at: updated_at
        });

    } catch (error) {
        console.error('Save settings error:', error);
        res.status(500).json({ error: 'Server error saving settings' });
    }
});

// Get user RSS feeds
router.get('/rss-feeds', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            'SELECT id, name, url, category, created_at, updated_at FROM rss_feeds WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        res.json({ feeds: result.rows });

    } catch (error) {
        console.error('Get RSS feeds error:', error);
        res.status(500).json({ error: 'Server error retrieving RSS feeds' });
    }
});

// Add RSS feed
router.post('/rss-feeds', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, url, category } = req.body;

        if (!name || !url) {
            return res.status(400).json({ 
                error: 'Name and URL are required' 
            });
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch {
            return res.status(400).json({ 
                error: 'Invalid URL format' 
            });
        }

        const result = await pool.query(
            `INSERT INTO rss_feeds (user_id, name, url, category) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, name, url, category, created_at, updated_at`,
            [userId, name, url, category || 'General']
        );

        res.status(201).json({
            message: 'RSS feed added successfully',
            feed: result.rows[0]
        });

    } catch (error) {
        console.error('Add RSS feed error:', error);
        res.status(500).json({ error: 'Server error adding RSS feed' });
    }
});

// Update RSS feed
router.put('/rss-feeds/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const feedId = req.params.id;
        const { name, url, category } = req.body;

        // Check if feed belongs to user
        const existingFeed = await pool.query(
            'SELECT id FROM rss_feeds WHERE id = $1 AND user_id = $2',
            [feedId, userId]
        );

        if (existingFeed.rows.length === 0) {
            return res.status(404).json({ error: 'RSS feed not found' });
        }

        // Validate URL if provided
        if (url) {
            try {
                new URL(url);
            } catch {
                return res.status(400).json({ 
                    error: 'Invalid URL format' 
                });
            }
        }

        const result = await pool.query(
            `UPDATE rss_feeds 
             SET name = COALESCE($1, name), 
                 url = COALESCE($2, url),
                 category = COALESCE($3, category),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4 AND user_id = $5
             RETURNING id, name, url, category, created_at, updated_at`,
            [name, url, category, feedId, userId]
        );

        res.json({
            message: 'RSS feed updated successfully',
            feed: result.rows[0]
        });

    } catch (error) {
        console.error('Update RSS feed error:', error);
        res.status(500).json({ error: 'Server error updating RSS feed' });
    }
});

// Delete RSS feed
router.delete('/rss-feeds/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const feedId = req.params.id;

        const result = await pool.query(
            'DELETE FROM rss_feeds WHERE id = $1 AND user_id = $2 RETURNING id',
            [feedId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'RSS feed not found' });
        }

        res.json({ message: 'RSS feed deleted successfully' });

    } catch (error) {
        console.error('Delete RSS feed error:', error);
        res.status(500).json({ error: 'Server error deleting RSS feed' });
    }
});

// Delete account
router.delete('/account', authenticateToken, async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id;

        if (!password) {
            return res.status(400).json({ 
                error: 'Password confirmation required to delete account' 
            });
        }

        // Get current password hash
        const result = await pool.query(
            'SELECT password FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(
            password, 
            result.rows[0].password
        );

        if (!isValidPassword) {
            return res.status(400).json({ error: 'Password is incorrect' });
        }

        // Delete user (linked accounts and settings will be deleted via CASCADE)
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);

        res.json({ message: 'Account deleted successfully' });

    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Server error deleting account' });
    }
});

export default router;