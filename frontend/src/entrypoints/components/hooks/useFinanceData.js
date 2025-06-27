import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { STOCK_PRESETS, CRYPTO_PRESETS } from "@/entrypoints/popup/tabs/data";
import { createWebSocketConnection } from "./connectionUtils";
import { SERVICE_CONFIG } from "@/entrypoints/config/endpoints.js";
import debugLogger, {
  DEBUG_CATEGORIES,
} from "@/entrypoints/utils/debugLogger.js";

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

  return useCallback(
    (...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    },
    [callback, delay]
  );
}

// OPTIMIZATION: Static helper functions outside component
function getSymbolsForPreset(type, activePreset, customSelections) {
  if (activePreset === "custom") {
    return Object.entries(customSelections || {})
      .filter(([symbol, enabled]) => enabled)
      .map(([symbol]) => symbol);
  } else {
    const presets = type === "stocks" ? STOCK_PRESETS : CRYPTO_PRESETS;
    const preset = presets.find((p) => p.key === activePreset);
    return preset ? preset.symbols || [] : [];
  }
}

function symbolToFilter(symbol) {
  if (symbol.startsWith("BINANCE:")) {
    return `symbol_${symbol.replace("BINANCE:", "")}`;
  }
  return `symbol_${symbol}`;
}

// FIX: Immediate filter calculation without debouncing for initial load
function calculateFinanceFilters(financeState) {
  const filters = [];

  if (financeState) {
    // Handle stocks
    if (financeState.stocks?.enabled && financeState.stocks?.activePreset) {
      const stockSymbols = getSymbolsForPreset(
        "stocks",
        financeState.stocks.activePreset,
        financeState.stocks.customSelections
      );
      stockSymbols.forEach((symbol) => {
        filters.push(symbolToFilter(symbol));
      });
    }

    // Handle crypto
    if (financeState.crypto?.enabled && financeState.crypto?.activePreset) {
      const cryptoSymbols = getSymbolsForPreset(
        "crypto",
        financeState.crypto.activePreset,
        financeState.crypto.customSelections
      );
      cryptoSymbols.forEach((symbol) => {
        filters.push(symbolToFilter(symbol));
      });
    }
  }

  return filters.sort(); // Sort for consistent comparison
}

// FIX: Stable filter hook with immediate calculation
function useStableFinanceFilters(financeState) {
  const [stableFilters, setStableFilters] = useState([]);

  // Calculate filters immediately when state changes
  const currentFilters = useMemo(
    () => calculateFinanceFilters(financeState),
    [
      financeState?.stocks?.enabled,
      financeState?.stocks?.activePreset,
      financeState?.crypto?.enabled,
      financeState?.crypto?.activePreset,
      JSON.stringify(financeState?.stocks?.customSelections),
      JSON.stringify(financeState?.crypto?.customSelections),
    ]
  );

  // Update stable filters immediately when current filters change
  useEffect(() => {
    // Fast array comparison - much faster than JSON.stringify
    const filtersChanged =
      currentFilters.length !== stableFilters.length ||
      currentFilters.some((filter, index) => filter !== stableFilters[index]);

    if (filtersChanged) {
      debugLogger.stateChange("Finance filters changed", {
        from: stableFilters.length,
        to: currentFilters.length,
        new: currentFilters.slice(0, 3), // First 3 for debugging
      });
      setStableFilters(currentFilters);
    }
  }, [currentFilters, stableFilters]);

  return stableFilters;
}

// Custom hook to handle finance data and WebSocket connection
export default function useFinanceData() {
  const [connectionStatus, setConnectionStatus] = useState("Initializing");
  const [tradesData, setTradesData] = useState({
    data: [],
    type: "initial_data",
    count: 0,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const lastSentFiltersRef = useRef("");
  const pendingFiltersRef = useRef(null);

  // Get Redux state
  const financeState = useSelector((state) => state.finance);

  // Get stable filters without debouncing for immediate response
  const financeFilters = useStableFinanceFilters(financeState);

  // Still debounce for some network requests, but with reduced time
  const debouncedFinanceFilters = useDebounce(financeFilters, 100);

  // Check if we have active finance filters
  const hasFinanceFilters = useMemo(() => {
    return financeFilters.length > 0;
  }, [financeFilters.length]);

  // OPTIMIZATION: Throttled WebSocket send function
  const throttledSendMessage = useThrottle((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, 100);

  // FIX: Enhanced sendFilterRequest function
  const sendFilterRequest = useCallback(
    (filters, force = false) => {
      if (
        !filters ||
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN
      ) {
        // Store pending filters to send when connection is ready
        if (filters && filters.length > 0) {
          pendingFiltersRef.current = filters;
        }
        return false;
      }

      const financeOnlyFilters = filters.filter(
        (f) =>
          f.startsWith("symbol_") ||
          f.startsWith("sector_") ||
          f.startsWith("type_") ||
          f.startsWith("price_")
      );

      // Optimized filter comparison
      const sortedFilters = financeOnlyFilters.sort();
      const filtersString = sortedFilters.join(",");

      if (!force && filtersString === lastSentFiltersRef.current) {
        debugLogger.websocketEvent("Skipping duplicate filter request", {
          filtersString: filtersString.substring(0, 50) + "...",
        });
        return false;
      }

      lastSentFiltersRef.current = filtersString;
      pendingFiltersRef.current = null; // Clear pending filters

      debugLogger.websocketEvent("Sending filter request", {
        count: financeOnlyFilters.length,
        first3: financeOnlyFilters.slice(0, 3),
        force,
      });

      throttledSendMessage({
        type: "filter_request",
        filters: financeOnlyFilters,
        timestamp: Date.now(),
      });

      return true;
    },
    [throttledSendMessage]
  );

  // FIX: Send filters when they change and connection is ready
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (financeFilters.length > 0) {
        sendFilterRequest(financeFilters);
      }
    }
  }, [financeFilters, sendFilterRequest]);

  // FIX: Initialization effect - show empty state immediately if no filters
  useEffect(() => {
    if (!isInitialized) {
      if (!hasFinanceFilters) {
        setTradesData({
          data: [],
          type: "initial_data",
          count: 0,
          message: "No filters selected",
          timestamp: Date.now(),
        });
        setConnectionStatus("No Finance Filters");
      }
      setIsInitialized(true);
    }
  }, [hasFinanceFilters, isInitialized]);

  // Main WebSocket connection effect
  useEffect(() => {
    let isComponentMounted = true;

    // FIX: Handle no filters case immediately
    if (!hasFinanceFilters) {
      if (wsRef.current) {
        wsRef.current.close(1000, "No finance filters");
        wsRef.current = null;
      }
      lastSentFiltersRef.current = "";
      pendingFiltersRef.current = null;
      setConnectionStatus("No Finance Filters");
      setTradesData({
        data: [],
        type: "filtered_data",
        count: 0,
        message: "No filters selected",
        timestamp: Date.now(),
      });
      return;
    }

    const connectWebSocket = async () => {
      if (!isComponentMounted) return;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      try {
        setConnectionStatus("Connecting");

        const ws = await createWebSocketConnection("finance");
        if (!isComponentMounted) {
          ws.close();
          return;
        }

        wsRef.current = ws;

        ws.onopen = () => {
          if (!isComponentMounted) return;
          debugLogger.websocketEvent("WebSocket opened");
          setConnectionStatus("Connected");
          reconnectTimeoutRef.attempts = 0;
          lastSentFiltersRef.current = "";

          // Send connection message
          throttledSendMessage({ type: "connection", timestamp: Date.now() });

          // FIX: Immediately try to send any pending or current filters
          const filtersToSend = pendingFiltersRef.current || financeFilters;
          if (filtersToSend && filtersToSend.length > 0) {
            debugLogger.websocketEvent(
              "Sending filters immediately on connection",
              {
                count: filtersToSend.length,
              }
            );
            // Use a small delay to ensure server is ready to receive
            setTimeout(() => {
              if (isComponentMounted && wsRef.current) {
                sendFilterRequest(filtersToSend, true);
              }
            }, 100);
          }
        };

        ws.onclose = (event) => {
          if (!isComponentMounted) return;
          setConnectionStatus("Disconnected");
          lastSentFiltersRef.current = "";

          if (event.code !== 1000 && hasFinanceFilters) {
            setConnectionStatus("Reconnecting");
            const attempt = (reconnectTimeoutRef.attempts || 0) + 1;
            const delay = Math.min(1000 * Math.pow(2, attempt), 10000);

            reconnectTimeoutRef.current = setTimeout(() => {
              if (isComponentMounted) {
                reconnectTimeoutRef.attempts = attempt;
                connectWebSocket();
              }
            }, delay);
          }
        };

        ws.onmessage = (event) => {
          if (!isComponentMounted) return;

          try {
            const receivedData = JSON.parse(event.data);
            debugLogger.websocketEvent("Received message", {
              type: receivedData.type,
              count: receivedData.data?.length || receivedData.count,
            });

            switch (receivedData.type) {
              case "initial_data":
              case "filtered_data":
              case "financial_update":
              case "all_trades_data":
                debugLogger.stateChange("Updating tradesData", {
                  type: receivedData.type,
                  itemCount: receivedData.data?.length,
                });
                setTradesData(receivedData);
                break;
              case "connection_confirmed":
                debugLogger.websocketEvent("Connection confirmed");
                // FIX: Send current filters immediately upon confirmation
                const currentFilters =
                  pendingFiltersRef.current || financeFilters;
                if (currentFilters && currentFilters.length > 0) {
                  debugLogger.websocketEvent(
                    "Sending filters on connection confirmation",
                    {
                      count: currentFilters.length,
                    }
                  );
                  sendFilterRequest(currentFilters, true);
                }
                break;
              case "error":
                debugLogger.error(
                  DEBUG_CATEGORIES.WEBSOCKET,
                  "Server error",
                  receivedData.message
                );
                break;
            }
          } catch (err) {
            debugLogger.error(
              DEBUG_CATEGORIES.WEBSOCKET,
              "Message parse error",
              err
            );
          }
        };

        ws.onerror = (error) => {
          if (!isComponentMounted) return;
          debugLogger.error(
            DEBUG_CATEGORIES.WEBSOCKET,
            "WebSocket error",
            error
          );
          setConnectionStatus("Connection Error");
        };
      } catch (error) {
        if (!isComponentMounted) return;
        debugLogger.error(
          DEBUG_CATEGORIES.WEBSOCKET,
          "Failed to create WebSocket connection",
          error
        );
        setConnectionStatus("Server Not Ready");

        const attempt = (reconnectTimeoutRef.attempts || 0) + 1;
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);

        reconnectTimeoutRef.current = setTimeout(() => {
          if (isComponentMounted) {
            reconnectTimeoutRef.attempts = attempt;
            connectWebSocket();
          }
        }, delay);
      }
    };

    connectWebSocket();

    return () => {
      isComponentMounted = false;
      lastSentFiltersRef.current = "";
      pendingFiltersRef.current = null;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting");
      }
    };
  }, [hasFinanceFilters]); // Only reconnect when hasFinanceFilters changes

  // FIX: Add debug logging for state changes
  useEffect(() => {
    debugLogger.stateChange("useFinanceData state", {
      hasFilters: hasFinanceFilters,
      filterCount: financeFilters.length,
      connectionStatus,
      dataCount: tradesData?.count || 0,
      isInitialized,
      pendingFilters: pendingFiltersRef.current?.length || 0,
    });
  }, [
    hasFinanceFilters,
    financeFilters.length,
    connectionStatus,
    tradesData?.count,
    isInitialized,
  ]);

  return {
    tradesData,
    connectionStatus,
    hasFinanceFilters,
    isInitialized,
  };
}
