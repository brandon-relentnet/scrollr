import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user's linked accounts
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, service_name, external_id, account_data, is_active, created_at, updated_at
             FROM linked_accounts 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [req.user.id]
        );

        res.json({ linkedAccounts: result.rows });

    } catch (error) {
        console.error('Get linked accounts error:', error);
        res.status(500).json({ error: 'Server error fetching linked accounts' });
    }
});

// Add/Update linked account
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { 
            serviceName, 
            externalId, 
            accessToken, 
            refreshToken, 
            tokenExpires, 
            accountData 
        } = req.body;

        if (!serviceName || !externalId) {
            return res.status(400).json({ 
                error: 'Service name and external ID are required' 
            });
        }

        // Check if linked account already exists
        const existingAccount = await pool.query(
            'SELECT id FROM linked_accounts WHERE user_id = $1 AND service_name = $2',
            [req.user.id, serviceName]
        );

        let result;
        if (existingAccount.rows.length > 0) {
            // Update existing linked account
            result = await pool.query(
                `UPDATE linked_accounts 
                 SET external_id = $1, 
                     access_token = $2, 
                     refresh_token = $3, 
                     token_expires = $4, 
                     account_data = $5,
                     is_active = true,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $6 AND service_name = $7
                 RETURNING *`,
                [externalId, accessToken, refreshToken, tokenExpires, 
                 accountData ? JSON.stringify(accountData) : null, req.user.id, serviceName]
            );
        } else {
            // Create new linked account
            result = await pool.query(
                `INSERT INTO linked_accounts 
                 (user_id, service_name, external_id, access_token, refresh_token, token_expires, account_data)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [req.user.id, serviceName, externalId, accessToken, refreshToken, 
                 tokenExpires, accountData ? JSON.stringify(accountData) : null]
            );
        }

        res.status(201).json({
            message: 'Linked account saved successfully',
            linkedAccount: result.rows[0]
        });

    } catch (error) {
        console.error('Save linked account error:', error);
        res.status(500).json({ error: 'Server error saving linked account' });
    }
});

// Remove linked account
router.delete('/:serviceName', authenticateToken, async (req, res) => {
    try {
        const { serviceName } = req.params;

        const result = await pool.query(
            'DELETE FROM linked_accounts WHERE user_id = $1 AND service_name = $2 RETURNING *',
            [req.user.id, serviceName]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Linked account not found' });
        }

        res.json({ message: 'Linked account removed successfully' });

    } catch (error) {
        console.error('Remove linked account error:', error);
        res.status(500).json({ error: 'Server error removing linked account' });
    }
});

// Toggle linked account status
router.put('/:serviceName/toggle', authenticateToken, async (req, res) => {
    try {
        const { serviceName } = req.params;

        const result = await pool.query(
            `UPDATE linked_accounts 
             SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND service_name = $2
             RETURNING *`,
            [req.user.id, serviceName]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Linked account not found' });
        }

        res.json({
            message: 'Linked account status updated',
            linkedAccount: result.rows[0]
        });

    } catch (error) {
        console.error('Toggle linked account error:', error);
        res.status(500).json({ error: 'Server error updating linked account' });
    }
});

export default router;