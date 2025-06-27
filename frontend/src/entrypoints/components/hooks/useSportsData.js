import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { createWebSocketConnection } from "./connectionUtils";
import debugLogger, {
  DEBUG_CATEGORIES,
} from "@/entrypoints/utils/debugLogger.js";

// Custom hook to handle sports data and WebSocket connection
export default function useSportsData() {
  const toggles = useSelector((state) => state.toggles);
  const [connectionStatus, setConnectionStatus] = useState("Connecting");
  const [sportsData, setSportsData] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isConnectingRef = useRef(false);

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
    const sportKeys = ["NFL", "NBA", "MLB", "NHL"]; // Add your sports here
    const filtered = {};
    sportKeys.forEach((key) => {
      if (toggles[key]) filtered[key] = toggles[key];
    });
    return filtered;
  }, [toggles]);

  // Debounce sports toggles to prevent rapid WebSocket requests
  const debouncedSportsToggles = useDebounce(sportsToggles, 500); // Increased from 300ms to 500ms

  // Helper function to check if any sports toggles are active
  const hasActiveSportsToggles = useMemo(() => {
    return Object.values(debouncedSportsToggles).some(
      (value) => value === true
    );
  }, [debouncedSportsToggles]);

  // OPTIMIZATION: Throttled WebSocket send
  const throttledSendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Send filter request to sports server (port 4000)
  const sendSportsFilterRequest = useCallback(
    (sportsFilters) => {
      if (!hasActiveSportsToggles) {
        setSportsData([]);
        return;
      }

      // Get array of active sports filters only
      const activeFilters = Object.entries(sportsFilters)
        .filter(([key, value]) => value)
        .map(([key]) => key);

      // Skip if we already sent this exact filter set
      const filterKey = activeFilters.sort().join(",");
      if (wsRef.current._lastFilterKey === filterKey) {
        debugLogger.websocketEvent("Skipping duplicate filter request", {
          filterKey,
        });
        return;
      }
      wsRef.current._lastFilterKey = filterKey;

      const filterData = {
        type: "filter_request",
        filters: activeFilters,
        timestamp: Date.now(),
      };

      throttledSendMessage(filterData);
      debugLogger.websocketEvent("Sent sports filter request", filterData);
    },
    [hasActiveSportsToggles, throttledSendMessage]
  );

  // OPTIMIZATION: Single WebSocket effect for sports only
  useEffect(() => {
    let isComponentMounted = true;

    // If no sports toggles are active, don't connect to sports WebSocket
    if (!hasActiveSportsToggles) {
      setSportsData([]);
      setConnectionStatus("No Sports Selected");

      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close(1000, "No sports filters");
        wsRef.current = null;
      }
      return;
    }

    const connectWebSocket = async () => {
      if (!isComponentMounted || isConnectingRef.current) return;

      // Prevent multiple simultaneous connections
      isConnectingRef.current = true;

      // Clear any existing reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      try {
        setConnectionStatus("Connecting");

        // Connect to sports server with health check
        const ws = await createWebSocketConnection("sports");
        if (!isComponentMounted) {
          ws.close();
          isConnectingRef.current = false;
          return;
        }

        wsRef.current = ws;

        ws.onopen = function open() {
          if (!isComponentMounted) return;
          setConnectionStatus("Connected");
          isConnectingRef.current = false;
          reconnectTimeoutRef.attempts = 0;
          // Clear last filter key on new connection
          if (wsRef.current) {
            wsRef.current._lastFilterKey = null;
          }
          // Send initial connection message
          throttledSendMessage({ type: "connection", timestamp: Date.now() });
        };

        ws.onclose = function close(event) {
          if (!isComponentMounted) return;

          isConnectingRef.current = false;
          debugLogger.websocketEvent("Sports WebSocket disconnected", {
            code: event.code,
          });
          setConnectionStatus("Disconnected");

          // Only try to reconnect if we still have active sports toggles and it wasn't a manual close
          if (event.code !== 1000 && hasActiveSportsToggles) {
            setConnectionStatus("Reconnecting");
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
            debugLogger.websocketEvent("Received Sports data", {
              type: receivedData.type,
              count: receivedData.data?.length || receivedData.count,
              dataPreview: receivedData.data?.slice(0, 2),
            });

            if (receivedData.type === "filtered_data") {
              debugLogger.stateChange("Updating sportsData", {
                itemCount: receivedData.data?.length,
              });
              setSportsData(receivedData.data || []);
            } else if (receivedData.type === "games_updated") {
              // Handle real-time updates
              debugLogger.websocketEvent("Sports data updated", {
                league: receivedData.league,
              });
              // Don't request fresh data here - the server already sent the update notification
              // The server will send the actual data separately
            } else if (receivedData.type === "welcome") {
              debugLogger.websocketEvent(
                "Welcome message received from sports server"
              );
              // Send initial filter request after welcome
              if (hasActiveSportsToggles) {
                setTimeout(() => {
                  sendSportsFilterRequest(debouncedSportsToggles);
                }, 100);
              }
            } else if (receivedData.type === "connection_confirmed") {
              debugLogger.websocketEvent(
                "Connection confirmed by sports server"
              );
            }
          } catch (error) {
            debugLogger.error(
              DEBUG_CATEGORIES.WEBSOCKET,
              "Sports WebSocket message parse error",
              error
            );
          }
        };

        ws.onerror = function error(err) {
          if (!isComponentMounted) return;
          debugLogger.error(
            DEBUG_CATEGORIES.WEBSOCKET,
            "Sports WebSocket error",
            err
          );
          setConnectionStatus("Connection Error");
        };
      } catch (error) {
        isConnectingRef.current = false;
        if (!isComponentMounted) return;
        debugLogger.error(
          DEBUG_CATEGORIES.WEBSOCKET,
          "Failed to create sports WebSocket",
          error
        );
        setConnectionStatus("Server Not Ready");

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

    setConnectionStatus("Connecting");
    // Check if already connected or connecting
    if (wsRef.current && wsRef.current.readyState <= 1) {
      // 0 = CONNECTING, 1 = OPEN
      debugLogger.websocketEvent(
        "WebSocket already connected or connecting, skipping new connection",
        { readyState: wsRef.current.readyState }
      );
      return;
    }

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
        wsRef.current.close(1000, "Component unmounting or no sports filters");
        wsRef.current = null;
      }
    };
  }, [hasActiveSportsToggles, throttledSendMessage]);

  // Handle sports toggles change - removed duplicate effect
  useEffect(() => {
    if (
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN &&
      hasActiveSportsToggles
    ) {
      sendSportsFilterRequest(debouncedSportsToggles);
      debugLogger.websocketEvent(
        "Sports toggles changed, sent new filter request",
        debouncedSportsToggles
      );
    }
  }, [debouncedSportsToggles, sendSportsFilterRequest, hasActiveSportsToggles]);

  // Debug logging
  useEffect(() => {
    debugLogger.debug(DEBUG_CATEGORIES.WEBSOCKET, "Sports WebSocket Debug", {
      hasToggles: hasActiveSportsToggles,
      connectionStatus,
      wsState: wsRef.current?.readyState,
      isConnecting: isConnectingRef.current,
      dataCount: sportsData?.length || 0,
    });
  }, [hasActiveSportsToggles, connectionStatus]);

  return {
    sportsData,
    connectionStatus,
    hasActiveSportsToggles,
  };
}
