// errorHandler.js - Unified error handling middleware

export function errorHandler(err, req, res, next) {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
}

export function notFoundHandler(req, res) {
    res.status(404).json({ error: 'Route not found' });
}