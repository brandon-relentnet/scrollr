import React, {useEffect, useState, useRef} from 'react';
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

export function Carousel() {
    const toggles = useSelector((state) => state.toggles);
    const finance = useSelector((state) => state.finance);
    const [connectionStatus, setConnectionStatus] = useState('Connecting');
    const [filteredData, setFilteredData] = useState(null);
    const wsRef = useRef(null);

    // Helper function to check if any toggles are active
    const hasActiveToggles = () => {
        // Check sports toggles
        const activeSportsToggles = Object.values(toggles).some(value => value);

        // Check finance toggles
        const activeFinanceToggles = finance && (
            (finance.stocks?.enabled && finance.stocks?.activePreset) ||
            (finance.crypto?.enabled && finance.crypto?.activePreset)
        );

        return activeSportsToggles || activeFinanceToggles;
    };

    useEffect(() => {
        let reconnectTimer;
        let isComponentMounted = true;

        const connectWebSocket = (attempt = 1) => {
            if (!isComponentMounted) return;

            try {
                // Updated WebSocket URL to match your server setup
                const ws = new WebSocket("ws://localhost:4000/ws");
                wsRef.current = ws;

                ws.onopen = function open() {
                    if (!isComponentMounted) return;
                    setConnectionStatus('Connected');
                    // Send initial connection message
                    ws.send(JSON.stringify({type: 'connection', timestamp: Date.now()}));
                };

                ws.onclose = function close(event) {
                    if (!isComponentMounted) return;

                    // Only log if it's not an expected initial connection failure
                    if (attempt > 1 || event.code === 1000) {
                        console.log("WebSocket disconnected", event.code);
                    }

                    // Don't show "Disconnected" on initial failed attempts
                    if (attempt === 1 && event.code === 1006) {
                        console.log("Initial connection attempt failed, retrying...");
                    } else {
                        setConnectionStatus('Disconnected');
                    }

                    // Only try to reconnect if it wasn't a manual close
                    if (event.code !== 1000) {
                        setConnectionStatus('Reconnecting');
                        reconnectTimer = setTimeout(() => {
                            if (isComponentMounted) {
                                connectWebSocket(attempt + 1);
                            }
                        }, 2000);
                    }
                };

                ws.onmessage = function incoming(event) {
                    if (!isComponentMounted) return;
                    const receivedData = JSON.parse(event.data);
                    if (receivedData.type === "filtered_data") {
                        setFilteredData(receivedData);
                    }
                };

                ws.onerror = function error(err) {
                    if (!isComponentMounted) return;

                    // Only log errors after the first attempt to reduce console noise
                    if (attempt > 1) {
                        console.error('WebSocket error on attempt', attempt, err);
                        setConnectionStatus('Connection Error');
                    }
                };

            } catch (error) {
                if (!isComponentMounted) return;

                console.error('Failed to create WebSocket:', error);
                setConnectionStatus('Connection Error');
                reconnectTimer = setTimeout(() => {
                    if (isComponentMounted) {
                        setConnectionStatus('Reconnecting');
                        connectWebSocket(attempt + 1);
                    }
                }, 2000);
            }
        };

        // Add a small delay before initial connection to let the page settle
        const initialDelay = setTimeout(() => {
            if (isComponentMounted) {
                connectWebSocket();
            }
        }, 150);

        // Cleanup on unmount
        return () => {
            isComponentMounted = false;
            clearTimeout(initialDelay);
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
            }
            if (wsRef.current) {
                wsRef.current.close(1000, 'Component unmounting');
            }
        };
    }, []);

    // Send filter request to server
    const sendFilterRequest = (currentToggles = toggles) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            // Check if any toggles are active before sending request
            if (!hasActiveToggles()) {
                // No toggles active, set empty filtered data
                setFilteredData({data: [], type: "filtered_data"});
                return;
            }

            // Get array of active toggles
            const activeFilters = Object.entries(currentToggles)
                .filter(([key, value]) => value)
                .map(([key]) => key);

            const filterData = {
                type: 'filter_request',
                filters: activeFilters,
                timestamp: Date.now()
            };

            wsRef.current.send(JSON.stringify(filterData));
            console.log('Sent filter request:', filterData);
        } else {
            console.log('WebSocket is not connected');
        }
    };

    // Handle toggles change
    useEffect(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            sendFilterRequest(toggles);
            console.log('Toggles changed, sent new filter request:', toggles);
        } else if (!hasActiveToggles()) {
            // If no toggles are active and WebSocket isn't connected, still clear the data
            setFilteredData({data: [], type: "filtered_data"});
        }
    }, [toggles, finance]);

    // Load initial data when connected
    useEffect(() => {
        if (connectionStatus === 'Connected') {
            // Send initial filter request
            sendFilterRequest();
        }
    }, [connectionStatus]);

    console.log('Carousel rendered with:', {filteredData, hasActiveToggles: hasActiveToggles()});

    return (
        <div className="flex-grow h-full">
            <TradesTest/>
            <Swiper
                //modules={[Autoplay]}
                autoplay={{delay: 3000, disableOnInteraction: false}}
                breakpointsBase={'container'}
                loop={true}
                speed={600}
                spaceBetween={8}
                breakpoints={breakpointsArray}
                watchSlidesProgress={true}
                className='h-full'
            >
                <>
                    {filteredData?.data && filteredData.data.length > 0 ? (
                        filteredData.data.map((game) => (
                            <SwiperSlide key={game.id} className='h-full py-2'>
                                <div className="card bg-base-100 shadow-sm h-full">
                                    <div className="card-body">
                                        <GameCard game={game}/>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            {!hasActiveToggles() ? 'Select sports or finance options to see games' :
                                filteredData ? 'No games match your current filters' : 'Loading games...'}
                        </div>
                    )}
                </>
            </Swiper>
        </div>
    )
}