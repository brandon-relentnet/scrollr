import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { STOCK_PRESETS, CRYPTO_PRESETS } from '@/entrypoints/popup/tabs/data';

// OPTIMIZATION: Debounce utility
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// OPTIMIZATION: Throttle utility for WebSocket messages
function useThrottle(callback, delay) {
    const lastRun = useRef(Date.now());

    return useCallback((...args) => {
        if (Date.now() - lastRun.current >= delay) {
            callback(...args);
            lastRun.current = Date.now();
        }
    }, [callback, delay]);
}

// OPTIMIZATION: Static helper functions outside component
function getSymbolsForPreset(type, activePreset, customSelections) {
    if (activePreset === 'custom') {
        return Object.entries(customSelections || {})
            .filter(([symbol, enabled]) => enabled)
            .map(([symbol]) => symbol);
    } else {
        const presets = type === 'stocks' ? STOCK_PRESETS : CRYPTO_PRESETS;
        const preset = presets.find(p => p.key === activePreset);
        return preset ? preset.symbols || [] : [];
    }
}

function symbolToFilter(symbol) {
    if (symbol.startsWith('BINANCE:')) {
        return `symbol_${symbol.replace('BINANCE:', '')}`;
    }
    return `symbol_${symbol}`;
}

function useFinanceFilters(financeState) {
    return useMemo(() => {
        const filters = [];

        if (financeState) {
            // Handle stocks
            if (financeState.stocks?.enabled && financeState.stocks?.activePreset) {
                const stockSymbols = getSymbolsForPreset('stocks', financeState.stocks.activePreset, financeState.stocks.customSelections);
                stockSymbols.forEach(symbol => {
                    filters.push(symbolToFilter(symbol));
                });
            }

            // Handle crypto
            if (financeState.crypto?.enabled && financeState.crypto?.activePreset) {
                const cryptoSymbols = getSymbolsForPreset('crypto', financeState.crypto.activePreset, financeState.crypto.customSelections);
                cryptoSymbols.forEach(symbol => {
                    filters.push(symbolToFilter(symbol));
                });
            }
        }

        return filters;
    }, [
        financeState?.stocks?.enabled,
        financeState?.stocks?.activePreset,
        financeState?.crypto?.enabled,
        financeState?.crypto?.activePreset,
        JSON.stringify(financeState?.stocks?.customSelections || {}),
        JSON.stringify(financeState?.crypto?.customSelections || {})
    ]);
}

// Custom hook to handle finance data and WebSocket connection
export default function useFinanceData() {
    const [connectionStatus, setConnectionStatus] = useState('Connecting');
    const [tradesData, setTradesData] = useState(null);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    // Get Redux state
    const financeState = useSelector((state) => state.finance);

    // FIX: Separate finance and sports filters
    const financeFilters = useFinanceFilters(financeState);

    // Only send finance filters to the finance WebSocket
    const debouncedFinanceFilters = useDebounce(financeFilters, 300);

    // Check if we have active finance filters
    const hasFinanceFilters = useMemo(() => {
        return debouncedFinanceFilters.length > 0;
    }, [debouncedFinanceFilters.length]);

    // OPTIMIZATION: Throttled WebSocket send function
    const throttledSendMessage = useThrottle((message) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    }, 100); // Max 10 messages per second

    // OPTIMIZATION: Memoized WebSocket functions
    const sendFilterRequest = useCallback((filters = debouncedFinanceFilters) => {
        // FIX: Only send finance-related filters to the finance WebSocket
        const financeOnlyFilters = filters.filter(f =>
            f.startsWith('symbol_') ||
            f.startsWith('sector_') ||
            f.startsWith('type_') ||
            f.startsWith('price_')
        );

        throttledSendMessage({
            type: 'filter_request',
            filters: financeOnlyFilters,
            timestamp: Date.now()
        });
    }, [debouncedFinanceFilters, throttledSendMessage]);

    // OPTIMIZATION: Effect for filter updates with debounced filters
    useEffect(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            sendFilterRequest(debouncedFinanceFilters);
        }
    }, [debouncedFinanceFilters, sendFilterRequest]);

    // OPTIMIZATION: Single WebSocket connection effect
    useEffect(() => {
        let isComponentMounted = true;

        if (!hasFinanceFilters) {
            // Clear data if no finance filters
            setTradesData({data: [], type: "filtered_data"});
            setConnectionStatus('No Finance Filters');

            // Close existing connection if any
            if (wsRef.current) {
                wsRef.current.close(1000, 'No finance filters');
                wsRef.current = null;
            }
            return;
        }

        const connectWebSocket = () => {
            if (!isComponentMounted) return;

            // Clear any existing reconnection timeout
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }

            try {
                const ws = new WebSocket("ws://localhost:4001/ws");
                wsRef.current = ws;

                ws.onopen = () => {
                    if (!isComponentMounted) return;
                    setConnectionStatus('Connected');
                    throttledSendMessage({type: 'connection', timestamp: Date.now()});
                };

                ws.onclose = (event) => {
                    if (!isComponentMounted) return;
                    setConnectionStatus('Disconnected');

                    if (event.code !== 1000 && hasFinanceFilters) {
                        setConnectionStatus('Reconnecting');
                        reconnectTimeoutRef.current = setTimeout(() => {
                            if (isComponentMounted) connectWebSocket();
                        }, 2000);
                    }
                };

                ws.onmessage = (event) => {
                    if (!isComponentMounted) return;

                    try {
                        const receivedData = JSON.parse(event.data);

                        switch (receivedData.type) {
                            case 'initial_data':
                            case 'filtered_data':
                            case 'financial_update':
                            case 'all_trades_data':
                                setTradesData(receivedData);
                                break;
                            case 'connection_confirmed':
                                // Send initial filter request when connection is confirmed
                                sendFilterRequest(debouncedFinanceFilters);
                                break;
                        }
                    } catch (err) {
                        console.error('Message parse error:', err);
                    }
                };

                ws.onerror = () => {
                    if (!isComponentMounted) return;
                    setConnectionStatus('Connection Error');
                };

            } catch (error) {
                if (!isComponentMounted) return;
                setConnectionStatus('Connection Error');
                reconnectTimeoutRef.current = setTimeout(() => {
                    if (isComponentMounted) connectWebSocket();
                }, 2000);
            }
        };

        setConnectionStatus('Connecting');
        // Small initial delay to let the page settle
        const initialTimeout = setTimeout(() => {
            if (isComponentMounted) connectWebSocket();
        }, 150);

        return () => {
            isComponentMounted = false;
            clearTimeout(initialTimeout);
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close(1000, 'Component unmounting');
            }
        };
    }, [hasFinanceFilters]); // Only depend on whether we have filters

    return {
        tradesData,
        connectionStatus,
        hasFinanceFilters
    };
}