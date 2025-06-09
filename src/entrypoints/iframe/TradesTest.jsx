import React, { useEffect, useState, useRef, useMemo, useCallback, memo } from 'react';
import { useSelector } from 'react-redux';
import {
    ArrowUpIcon,
    ArrowDownIcon,
    WifiIcon,
    XCircleIcon,
    ArrowPathIcon,
    ClockIcon,
    CogIcon
} from '@heroicons/react/24/solid';
import { STOCK_PRESETS, CRYPTO_PRESETS } from '@/entrypoints/popup/tabs/data';

// OPTIMIZATION: Memoized components to prevent unnecessary re-renders
const StatusBadge = memo(({ connectionStatus }) => {
    const statusConfig = {
        'Connected': { class: 'badge-success', icon: WifiIcon },
        'Connecting': { class: 'badge-warning', icon: ArrowPathIcon },
        'Reconnecting': { class: 'badge-warning', icon: ArrowPathIcon },
        'Disconnected': { class: 'badge-error', icon: XCircleIcon },
        'Connection Error': { class: 'badge-error', icon: XCircleIcon }
    };

    const config = statusConfig[connectionStatus] || statusConfig['Disconnected'];
    const IconComponent = config.icon;

    return (
        <div className={`badge ${config.class} gap-2`}>
            <IconComponent className="w-3 h-3" />
            {connectionStatus}
        </div>
    );
});

const TradeCard = memo(({ trade }) => {
    const isPositive = trade.direction === 'up';
    const cardClass = isPositive
        ? 'border-l-4 border-l-success bg-success/5'
        : 'border-l-4 border-l-error bg-error/5';

    // OPTIMIZATION: Memoize expensive calculations
    const formattedPrice = useMemo(() => parseFloat(trade.price).toFixed(2), [trade.price]);
    const formattedChange = useMemo(() => {
        const num = parseFloat(trade.price_change);
        return num >= 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
    }, [trade.price_change]);
    const formattedPercentage = useMemo(() => {
        const num = parseFloat(trade.percentage_change);
        return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
    }, [trade.percentage_change]);
    const formattedTime = useMemo(() =>
            new Date(trade.last_updated).toLocaleTimeString(),
        [trade.last_updated]
    );
    const formattedPreviousClose = useMemo(() =>
            parseFloat(trade.previous_close).toFixed(2),
        [trade.previous_close]
    );

    return (
        <div className={`card bg-base-100 shadow-md hover:shadow-lg transition-shadow ${cardClass}`}>
            <div className="card-body p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="card-title text-lg font-bold">{trade.symbol}</h3>
                        <p className="text-2xl font-mono font-bold">
                            ${formattedPrice}
                        </p>
                    </div>
                    <div className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-error'}`}>
                        {isPositive ? (
                            <ArrowUpIcon className="w-5 h-5" />
                        ) : (
                            <ArrowDownIcon className="w-5 h-5" />
                        )}
                        <span className="font-bold">{formattedPercentage}</span>
                    </div>
                </div>

                <div className="divider my-2"></div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <span className="text-base-content/60">Previous Close:</span>
                        <p className="font-mono">${formattedPreviousClose}</p>
                    </div>
                    <div>
                        <span className="text-base-content/60">Change:</span>
                        <p className={`font-mono font-bold ${isPositive ? 'text-success' : 'text-error'}`}>
                            ${formattedChange}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1 mt-2 text-xs text-base-content/60">
                    <ClockIcon className="w-3 h-3" />
                    <span>Updated: {formattedTime}</span>
                </div>
            </div>
        </div>
    );
});

// OPTIMIZATION: Extract filter logic to separate memoized hook
function useTradeFilters(financeState, sportsToggles) {
    return useMemo(() => {
        const filters = [];

        // Add sports filters
        if (sportsToggles) {
            Object.entries(sportsToggles).forEach(([sport, enabled]) => {
                if (enabled) {
                    filters.push(sport);
                }
            });
        }

        // Add finance filters
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
    }, [financeState, sportsToggles]);
}

// OPTIMIZATION: Extract helper functions outside component
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

function formatFilterForDisplay(filter) {
    if (filter.startsWith('symbol_')) {
        const symbol = filter.replace('symbol_', '');
        if (symbol === 'BTCUSDT') return 'BTC';
        return symbol;
    }
    return filter;
}

// OPTIMIZATION: Memoized filter display components
const FilterSummary = memo(({ activeFilters }) => {
    const summary = useMemo(() => {
        const sportsFilters = activeFilters.filter(f => ['NFL', 'NBA', 'MLB', 'NHL'].includes(f));
        const symbolFilters = activeFilters.filter(f => f.startsWith('symbol_'));

        const parts = [];
        if (sportsFilters.length > 0) {
            parts.push(`${sportsFilters.length} sport${sportsFilters.length > 1 ? 's' : ''}`);
        }
        if (symbolFilters.length > 0) {
            parts.push(`${symbolFilters.length} symbol${symbolFilters.length > 1 ? 's' : ''}`);
        }

        return parts.length > 0 ? parts.join(', ') : 'No filters active';
    }, [activeFilters]);

    return <p className="text-sm text-base-content/60">{summary}</p>;
});

const FilterTags = memo(({ activeFilters }) => {
    if (activeFilters.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1">
            {activeFilters.map(filter => (
                <span key={filter} className="badge badge-outline badge-sm">
                    {formatFilterForDisplay(filter)}
                </span>
            ))}
        </div>
    );
});

// OPTIMIZATION: Simplified debug component (only shows when needed)
const DebugInfo = memo(({ activeFilters, tradesCount, isOpen, onToggle }) => {
    if (!isOpen) {
        return (
            <button onClick={onToggle} className="btn btn-xs btn-outline">
                Show Debug
            </button>
        );
    }

    return (
        <div className="border border-base-300 bg-base-100 p-2 rounded">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Debug Info</span>
                <button onClick={onToggle} className="btn btn-xs">Hide</button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                    <strong>Filter Count:</strong> {activeFilters.length}
                </div>
                <div>
                    <strong>Trades Count:</strong> {tradesCount}
                </div>
            </div>
        </div>
    );
});

export default function TradesTest() {
    const [connectionStatus, setConnectionStatus] = useState('Connecting');
    const [tradesData, setTradesData] = useState(null);
    const [showDebug, setShowDebug] = useState(false);
    const wsRef = useRef(null);

    // Get Redux state
    const financeState = useSelector((state) => state.finance);
    const sportsToggles = useSelector((state) => state.toggles);

    // OPTIMIZATION: Use custom hook for filters
    const activeFilters = useTradeFilters(financeState, sportsToggles);

    // OPTIMIZATION: Memoize WebSocket functions to prevent recreating
    const sendFilterRequest = useCallback((filters = activeFilters) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const filterData = {
                type: 'filter_request',
                filters: filters,
                timestamp: Date.now()
            };
            wsRef.current.send(JSON.stringify(filterData));
        }
    }, [activeFilters]);

    const sendGetAllTrades = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'get_all_trades',
                timestamp: Date.now()
            }));
        }
    }, []);

    // OPTIMIZATION: Separate effect for filter updates
    useEffect(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            sendFilterRequest(activeFilters);
        }
    }, [activeFilters, sendFilterRequest]);

    // OPTIMIZATION: Simplified WebSocket connection effect
    useEffect(() => {
        let reconnectTimer;
        let isComponentMounted = true;

        const connectWebSocket = () => {
            if (!isComponentMounted) return;

            try {
                const ws = new WebSocket("ws://localhost:4001/ws");
                wsRef.current = ws;

                ws.onopen = () => {
                    if (!isComponentMounted) return;
                    setConnectionStatus('Connected');
                    ws.send(JSON.stringify({ type: 'connection', timestamp: Date.now() }));
                };

                ws.onclose = (event) => {
                    if (!isComponentMounted) return;
                    setConnectionStatus('Disconnected');

                    if (event.code !== 1000) {
                        setConnectionStatus('Reconnecting');
                        reconnectTimer = setTimeout(() => {
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
                                sendFilterRequest(activeFilters);
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
                reconnectTimer = setTimeout(() => {
                    if (isComponentMounted) connectWebSocket();
                }, 2000);
            }
        };

        const initialDelay = setTimeout(() => {
            if (isComponentMounted) connectWebSocket();
        }, 150);

        return () => {
            isComponentMounted = false;
            clearTimeout(initialDelay);
            if (reconnectTimer) clearTimeout(reconnectTimer);
            if (wsRef.current) {
                wsRef.current.close(1000, 'Component unmounting');
            }
        };
    }, []); // OPTIMIZATION: Empty dependency array

    // OPTIMIZATION: Memoize formatted time to prevent recalculation
    const lastUpdatedTime = useMemo(() => {
        return tradesData?.timestamp ? new Date(tradesData.timestamp).toLocaleTimeString() : 'Unknown';
    }, [tradesData?.timestamp]);

    const hasNoFilters = activeFilters.length === 0;
    const hasNoTrades = !tradesData?.data || tradesData.data.length === 0;
    const tradesCount = tradesData?.data?.length || 0;

    return (
        <div className="min-h-screen bg-base-200 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="navbar bg-base-100 rounded-box shadow-md mb-6">
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">📈 Live Trades Ticker</h1>
                    </div>
                    <div className="flex-none gap-2">
                        <StatusBadge connectionStatus={connectionStatus} />
                        <div className="badge badge-info">
                            {tradesCount} stocks
                        </div>
                    </div>
                </div>

                {/* Filter Status & Controls */}
                <div className="card bg-base-100 shadow-md mb-6">
                    <div className="card-body p-4">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="card-title text-lg flex items-center gap-2">
                                    <CogIcon className="w-5 h-5" />
                                    Active Filters
                                </h2>
                                <FilterSummary activeFilters={activeFilters} />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => sendFilterRequest()}
                                    disabled={connectionStatus !== 'Connected'}
                                    className="btn btn-primary btn-sm"
                                >
                                    Refresh Data
                                </button>
                                <button
                                    onClick={sendGetAllTrades}
                                    disabled={connectionStatus !== 'Connected'}
                                    className="btn btn-secondary btn-sm"
                                >
                                    Get All Trades
                                </button>
                            </div>
                        </div>

                        <FilterTags activeFilters={activeFilters} />

                        {hasNoFilters && (
                            <div className="alert alert-info mt-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span>No filters selected. Use the Display tab to select sports or finance options to see live data.</span>
                            </div>
                        )}

                        <div className="mt-4">
                            <DebugInfo
                                activeFilters={activeFilters}
                                tradesCount={tradesCount}
                                isOpen={showDebug}
                                onToggle={() => setShowDebug(!showDebug)}
                            />
                        </div>
                    </div>
                </div>

                {/* Trades Content */}
                {connectionStatus === 'Connected' ? (
                    !hasNoTrades ? (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">Market Data</h2>
                                <div className="text-sm text-base-content/60">
                                    Last updated: {lastUpdatedTime}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {tradesData.data.map((trade) => (
                                    <TradeCard key={trade.symbol} trade={trade} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="hero min-h-[400px] bg-base-100 rounded-box shadow-md">
                            <div className="hero-content text-center">
                                <div className="max-w-md">
                                    {hasNoFilters ? (
                                        <>
                                            <CogIcon className="w-16 h-16 mx-auto mb-4 text-base-content/50" />
                                            <h3 className="text-lg font-bold">No Filters Selected</h3>
                                            <p className="text-base-content/60">
                                                Please use the Display tab to select sports leagues or financial instruments to view live data.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="loading loading-spinner loading-lg mb-4"></div>
                                            <h3 className="text-lg font-bold">Loading trades...</h3>
                                            <p className="text-base-content/60">
                                                No trades match your current filters
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="hero min-h-[400px] bg-base-100 rounded-box shadow-md">
                        <div className="hero-content text-center">
                            <div className="max-w-md">
                                <XCircleIcon className="w-16 h-16 mx-auto mb-4 text-error" />
                                <h3 className="text-lg font-bold">Connection Issue</h3>
                                <p className="text-base-content/60 mb-4">
                                    Unable to connect to the trades server. Make sure your server is running on port 4001.
                                </p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="btn btn-primary"
                                >
                                    Retry Connection
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}