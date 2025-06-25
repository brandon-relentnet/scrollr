import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useSelector } from "react-redux";
import { createWebSocketConnection } from "./connectionUtils";

// Custom hook to handle sports data and WebSocket connection
export default function useSportsData() {
    const toggles = useSelector((state) => state.toggles);
    const [connectionStatus, setConnectionStatus] = useState('Connecting');
    const [sportsData, setSportsData] = useState(null);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

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
        //console.log('Sent sports filter request:', filterData);
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

        const connectWebSocket = async () => {
            if (!isComponentMounted) return;

            // Clear any existing reconnection timeout
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }

            try {
                setConnectionStatus('Connecting');
                
                // Connect to sports server with health check
                const ws = await createWebSocketConnection('sports');
                if (!isComponentMounted) {
                    ws.close();
                    return;
                }
                
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
                        console.log("Received Sports WebSocket data:", {
                            type: receivedData.type,
                            count: receivedData.data?.length || receivedData.count,
                            dataPreview: receivedData.data?.slice(0, 2),
                        });
                        
                        if (receivedData.type === "filtered_data") {
                            console.log("Updating sportsData with:", receivedData.data?.length, "items");
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
                setConnectionStatus('Server Not Ready');

                const attempt = (reconnectTimeoutRef.attempts || 0) + 1;
                const delay = Math.min(1000 * Math.pow(2, attempt), 10000);

                reconnectTimeoutRef.current = setTimeout(() => {
                    if (isComponentMounted && hasActiveSportsToggles) {
                        reconnectTimeoutRef.attempts = attempt;
                        connectWebSocket();
                    }
                }, delay);
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
            //console.log('Sports toggles changed, sent new filter request:', debouncedSportsToggles);
        }
    }, [debouncedSportsToggles, sendSportsFilterRequest]);

    // Load initial data when connected
    useEffect(() => {
        if (connectionStatus === 'Connected' && hasActiveSportsToggles) {
            sendSportsFilterRequest(debouncedSportsToggles);
        }
    }, [connectionStatus, hasActiveSportsToggles, debouncedSportsToggles, sendSportsFilterRequest]);

    return {
        sportsData,
        connectionStatus,
        hasActiveSportsToggles
    };
}