// trades.js
const express = require('express');
const router = express.Router();
const tradeService = require('./tradeService');

/**
 * @route   GET /api/trades
 * @desc    Retrieve all trade records
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const trades = await tradeService.getTrades();
        res.json(trades);
    } catch (error) {
        console.error('Error fetching trades:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/trades/:symbol
 * @desc    Retrieve trade details for a specific symbol
 * @access  Public
 */
router.get('/:symbol', async (req, res) => {
    const { symbol } = req.params;
    try {
        const trades = await tradeService.getTrades();
        const trade = trades.find(
            (t) => t.symbol.toLowerCase() === symbol.toLowerCase()
        );
        if (!trade) {
            return res.status(404).json({ error: 'Trade not found' });
        }
        res.json(trade);
    } catch (error) {
        console.error(`Error fetching trade for ${symbol}:`, error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   POST /api/trades
 * @desc    Insert a new symbol into the trades table
 * @access  Public
 *
 * Expected JSON body:
 * {
 *   "symbol": "AAPL"
 * }
 */
router.post('/', async (req, res) => {
    const { symbol } = req.body;
    if (!symbol) {
        return res.status(400).json({ error: 'Symbol is required' });
    }
    try {
        await tradeService.insertSymbol(symbol);
        res.status(201).json({ message: 'Symbol inserted', symbol });
    } catch (error) {
        console.error(`Error inserting symbol ${symbol}:`, error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   PUT /api/trades/:symbol
 * @desc    Update a trade record. This endpoint allows you to update the previous close,
 *          current price, price change, percentage change, and direction.
 * @access  Public
 *
 * Expected JSON body:
 * {
 *   "price": 150.25,
 *   "previous_close": 148.50,
 *   "price_change": 1.75,
 *   "percentage_change": 1.18,
 *   "direction": "up"
 * }
 */
router.put('/:symbol', async (req, res) => {
    const { symbol } = req.params;
    const { price, previous_close, price_change, percentage_change, direction } = req.body;

    try {
        // If a new previous close is provided, update it
        if (previous_close !== undefined) {
            await tradeService.updatePreviousClose(symbol, previous_close);
        }

        // If trade data is provided, update the trade record
        if (
            price !== undefined &&
            price_change !== undefined &&
            percentage_change !== undefined &&
            direction
        ) {
            await tradeService.updateTrade(symbol, price, price_change, percentage_change, direction);
        }

        res.json({ message: 'Trade updated', symbol });
    } catch (error) {
        console.error(`Error updating trade for ${symbol}:`, error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
