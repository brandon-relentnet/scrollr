import express from 'express';
import pool from '../db.js';
import { authenticateToken, authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/users', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT u.id, u.username, u.email, u.phone, u.is_active, 
                   u.created_at, u.updated_at, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
        `;
        let queryParams = [];

        if (search) {
            query += ` WHERE u.username ILIKE $1 OR u.email ILIKE $1`;
            queryParams.push(`%${search}%`);
        }

        query += ` ORDER BY u.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);

        const result = await pool.query(query, queryParams);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM users';
        let countParams = [];
        if (search) {
            countQuery += ' WHERE username ILIKE $1 OR email ILIKE $1';
            countParams.push(`%${search}%`);
        }

        const countResult = await pool.query(countQuery, countParams);
        const totalUsers = parseInt(countResult.rows[0].count);

        res.json({
            users: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalUsers,
                pages: Math.ceil(totalUsers / limit)
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error fetching users' });
    }
});

// Get user details (admin only)
router.get('/users/:userId', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { userId } = req.params;

        const userResult = await pool.query(
            `SELECT u.id, u.username, u.email, u.phone, u.is_active, 
                    u.created_at, u.updated_at, r.name as role_name
             FROM users u
             LEFT JOIN roles r ON u.role_id = r.id
             WHERE u.id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user's linked accounts
        const linkedAccountsResult = await pool.query(
            `SELECT id, service_name, external_id, account_data, is_active, created_at
             FROM linked_accounts 
             WHERE user_id = $1`,
            [userId]
        );

        res.json({
            user: userResult.rows[0],
            linkedAccounts: linkedAccountsResult.rows
        });

    } catch (error) {
        console.error('Get user details error:', error);
        res.status(500).json({ error: 'Server error fetching user details' });
    }
});

// Update user status (admin only)
router.put('/users/:userId/status', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ error: 'isActive must be a boolean value' });
        }

        // Prevent admin from deactivating themselves
        if (req.user.id === parseInt(userId) && !isActive) {
            return res.status(400).json({ 
                error: 'Cannot deactivate your own account' 
            });
        }

        const result = await pool.query(
            `UPDATE users 
             SET is_active = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING id, username, email, is_active`,
            [isActive, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ error: 'Server error updating user status' });
    }
});

// Delete user (admin only)
router.delete('/users/:userId', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { userId } = req.params;

        // Prevent admin from deleting themselves
        if (req.user.id === parseInt(userId)) {
            return res.status(400).json({ 
                error: 'Cannot delete your own account' 
            });
        }

        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING username, email',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'User deleted successfully',
            deletedUser: result.rows[0]
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Server error deleting user' });
    }
});

// Get system statistics (admin only)
router.get('/stats', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        // Get total users
        const totalUsersResult = await pool.query('SELECT COUNT(*) FROM users');
        
        // Get active users
        const activeUsersResult = await pool.query('SELECT COUNT(*) FROM users WHERE is_active = true');
        
        // Get recent registrations (last 30 days)
        const recentRegistrationsResult = await pool.query(
            "SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days'"
        );
        
        // Get linked accounts by service
        const linkedAccountsResult = await pool.query(`
            SELECT service_name, COUNT(*) as count
            FROM linked_accounts 
            WHERE is_active = true
            GROUP BY service_name
            ORDER BY count DESC
        `);

        res.json({
            totalUsers: parseInt(totalUsersResult.rows[0].count),
            activeUsers: parseInt(activeUsersResult.rows[0].count),
            recentRegistrations: parseInt(recentRegistrationsResult.rows[0].count),
            linkedAccountsByService: linkedAccountsResult.rows
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Server error fetching statistics' });
    }
});

export default router;