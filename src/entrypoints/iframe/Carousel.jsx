import React, {useEffect, useState, useRef, useMemo, useCallback, memo} from 'react';
import {Autoplay} from 'swiper/modules';
import {Swiper, SwiperSlide} from 'swiper/react';
import 'swiper/css';
import {useSelector} from 'react-redux';
import GameCard from './GameCard';
import TradesTest from './TradesTest';

const breakpointsArray = {};
const startBreakpoint = 0;
const endBreakpoint = 8000;
const breakpointStep = 320;
for (let i = startBreakpoint; i <= endBreakpoint; i += breakpointStep) {
    breakpointsArray[i] = {
        slidesPerView: Math.floor(i / 320),
    };
}

// OPTIMIZATION: Memoized component to prevent unnecessary re-renders
const SportsCarousel = memo(({ sportsData, hasActiveSportsToggles }) => {
    if (!hasActiveSportsToggles) {
        return (
            <div className="text-center py-8 text-gray-500">
                Select sports options to see games
            </div>
        );
    }

    if (!sportsData || sportsData.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No games match your current sports filters
            </div>
        );
    }

    return (
        <Swiper
            modules={[Autoplay]}
            autoplay={{delay: 3000, disableOnInteraction: false}}
            breakpointsBase={'container'}
            loop={true}
            speed={600}
            spaceBetween={8}
            breakpoints={breakpointsArray}
            watchSlidesProgress={true}
            className='h-full'
        >
            {sportsData.map((game) => (
                <SwiperSlide key={game.id} className='h-full py-2'>
                    <div className="card bg-base-100 shadow-sm h-full">
                        <div className="card-body">
                            <GameCard game={game}/>
                        </div>
                    </div>
                </SwiperSlide>
            ))}
        </Swiper>
    );
});

// OPTIMIZATION: Debounce hook
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

export function Carousel() {
    const toggles = useSelector((state) => state.toggles);
    const finance = useSelector((state) => state.finance);
    const [connectionStatus, setConnectionStatus] = useState('Connecting');
    const [sportsData, setSportsData] = useState(null);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    // OPTIMIZATION: Separate sports and finance logic
    const sportsToggles = useMemo(() => {
        if (!toggles) return {};
        // Filter out non-sports properties
        const sportKeys = ['NFL', 'NBA', 'MLB', 'NHL']; // Add your sports here
        const filtered = {};
        sportKeys.forEach(key => {
            if (toggles[key]) filtered[key] = toggles[key];
        });
        return filtered;
    }, [toggles]);

    // Debounce sports toggles to prevent rapid WebSocket requests
    const debouncedSportsToggles = useDebounce(sportsToggles, 300);

    // Helper function to check if any sports toggles are active
    const hasActiveSportsToggles = useMemo(() => {
        return Object.values(debouncedSportsToggles).some(value => value === true);
    }, [debouncedSportsToggles]);

    // Helper function to check if any finance options are active
    const hasActiveFinanceToggles = useMemo(() => {
        return finance && (
            (finance.stocks?.enabled && finance.stocks?.activePreset) ||
            (finance.crypto?.enabled && finance.crypto?.activePreset)
        );
    }, [finance]);

    // OPTIMIZATION: Throttled WebSocket send
    const throttledSendMessage = useCallback((message) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    }, []);

    // Send filter request to sports server (port 4000)
    const sendSportsFilterRequest = useCallback((sportsFilters) => {
        if (!hasActiveSportsToggles) {
            setSportsData([]);
            return;
        }

        // Get array of active sports filters only
        const activeFilters = Object.entries(sportsFilters)
            .filter(([key, value]) => value)
            .map(([key]) => key);

        const filterData = {
            type: 'filter_request',
            filters: activeFilters,
            timestamp: Date.now()
        };

        throttledSendMessage(filterData);
        console.log('Sent sports filter request:', filterData);
    }, [hasActiveSportsToggles, throttledSendMessage]);

    // OPTIMIZATION: Single WebSocket effect for sports only
    useEffect(() => {
        let isComponentMounted = true;

        // If no sports toggles are active, don't connect to sports WebSocket
        if (!hasActiveSportsToggles) {
            setSportsData([]);
            setConnectionStatus('No Sports Selected');

            // Close existing connection if any
            if (wsRef.current) {
                wsRef.current.close(1000, 'No sports filters');
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
                // Connect to sports server on port 4000
                const ws = new WebSocket("ws://localhost:4000/ws");
                wsRef.current = ws;

                ws.onopen = function open() {
                    if (!isComponentMounted) return;
                    setConnectionStatus('Connected');
                    // Send initial connection message
                    throttledSendMessage({type: 'connection', timestamp: Date.now()});
                };

                ws.onclose = function close(event) {
                    if (!isComponentMounted) return;

                    console.log("Sports WebSocket disconnected", event.code);
                    setConnectionStatus('Disconnected');

                    // Only try to reconnect if we still have active sports toggles and it wasn't a manual close
                    if (event.code !== 1000 && hasActiveSportsToggles) {
                        setConnectionStatus('Reconnecting');
                        reconnectTimeoutRef.current = setTimeout(() => {
                            if (isComponentMounted && hasActiveSportsToggles) {
                                connectWebSocket();
                            }
                        }, 2000);
                    }
                };

                ws.onmessage = function incoming(event) {
                    if (!isComponentMounted) return;
                    try {
                        const receivedData = JSON.parse(event.data);
                        if (receivedData.type === "filtered_data") {
                            setSportsData(receivedData.data || []);
                        }
                    } catch (error) {
                        console.error('Sports WebSocket message parse error:', error);
                    }
                };

                ws.onerror = function error(err) {
                    if (!isComponentMounted) return;
                    console.error('Sports WebSocket error:', err);
                    setConnectionStatus('Connection Error');
                };

            } catch (error) {
                if (!isComponentMounted) return;
                console.error('Failed to create sports WebSocket:', error);
                setConnectionStatus('Connection Error');

                reconnectTimeoutRef.current = setTimeout(() => {
                    if (isComponentMounted && hasActiveSportsToggles) {
                        setConnectionStatus('Reconnecting');
                        connectWebSocket();
                    }
                }, 2000);
            }
        };

        setConnectionStatus('Connecting');
        // Small delay before initial connection to let the page settle
        const initialDelay = setTimeout(() => {
            if (isComponentMounted && hasActiveSportsToggles) {
                connectWebSocket();
            }
        }, 150);

        // Cleanup on unmount or when sports toggles become inactive
        return () => {
            isComponentMounted = false;
            clearTimeout(initialDelay);
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            if (wsRef.current) {
                wsRef.current.close(1000, 'Component unmounting or no sports filters');
                wsRef.current = null;
            }
        };
    }, [hasActiveSportsToggles, throttledSendMessage]);

    // Handle sports toggles change
    useEffect(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            sendSportsFilterRequest(debouncedSportsToggles);
            console.log('Sports toggles changed, sent new filter request:', debouncedSportsToggles);
        }
    }, [debouncedSportsToggles, sendSportsFilterRequest]);

    // Load initial data when connected
    useEffect(() => {
        if (connectionStatus === 'Connected' && hasActiveSportsToggles) {
            sendSportsFilterRequest(debouncedSportsToggles);
        }
    }, [connectionStatus, hasActiveSportsToggles, debouncedSportsToggles, sendSportsFilterRequest]);

    console.log('Carousel rendered with:', {
        sportsData: sportsData?.length || 0,
        hasActiveSportsToggles,
        hasActiveFinanceToggles,
        connectionStatus
    });

    return (
        <div className="flex-grow h-full">
            {/* Finance section - always show TradesTest component */}
            {hasActiveFinanceToggles && <TradesTest/>}

            {/* Sports section - only show when sports are active */}
            {hasActiveSportsToggles && (
                <div className="mt-4">
                    <h2 className="text-lg font-semibold mb-2">Sports Games</h2>
                    <SportsCarousel
                        sportsData={sportsData}
                        hasActiveSportsToggles={hasActiveSportsToggles}
                    />
                </div>
            )}

            {/* Show message when nothing is selected */}
            {!hasActiveSportsToggles && !hasActiveFinanceToggles && (
                <div className="text-center py-8 text-gray-500">
                    <h3 className="text-lg font-semibold mb-2">No Content Selected</h3>
                    <p>Select sports or finance options from the Display tab to see live data.</p>
                </div>
            )}
        </div>
    )
}