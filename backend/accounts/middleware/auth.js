import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { accountsConfig } from '../config.js';

export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, accountsConfig.jwtSecret, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

export async function authenticateAdmin(req, res, next) {
    try {
        const result = await pool.query(
            'SELECT role_id FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userRole = result.rows[0].role_id;
        if (userRole !== 1) { // 1 = admin role
            return res.status(403).json({ error: 'Admin access required' });
        }

        next();
    } catch (error) {
        console.error('Admin authentication error:', error);
        res.status(500).json({ error: 'Server error during authentication' });
    }
}