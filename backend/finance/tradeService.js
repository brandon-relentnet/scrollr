// tradeService.js
import pool from './db.js';

async function getTrades() {
    const { rows } = await pool.query(`
    SELECT symbol, price, previous_close, price_change, 
           percentage_change, direction, last_updated
    FROM trades
    ORDER BY symbol ASC
  `);
    return rows;
}

async function insertSymbol(symbol) {
    await pool.query(
        `INSERT INTO trades (symbol)
     VALUES ($1)
     ON CONFLICT (symbol) DO NOTHING`,
        [symbol]
    );
}

async function updatePreviousClose(symbol, previousClose) {
    await pool.query(
        `UPDATE trades
     SET previous_close = $1
     WHERE symbol = $2`,
        [previousClose, symbol]
    );
}

async function updateTrade(symbol, price, priceChange, percentageChange, direction) {
    await pool.query(
        `UPDATE trades
     SET price = $1,
         price_change = $2,
         percentage_change = $3,
         direction = $4,
         last_updated = CURRENT_TIMESTAMP
     WHERE symbol = $5`,
        [price, priceChange, percentageChange, direction, symbol]
    );
}

export default {
    getTrades,
    insertSymbol,
    updatePreviousClose,
    updateTrade,
};
