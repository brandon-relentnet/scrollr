import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { STOCK_PRESETS, CRYPTO_PRESETS } from "@/entrypoints/popup/tabs/data";
import { createWebSocketConnection } from "./connectionUtils";

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
  const lastStateRef = useRef(null);

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

  // Optimized filter comparison - avoid JSON.stringify in hot path
  useEffect(() => {
    // Fast array comparison - much faster than JSON.stringify
    const filtersChanged =
      currentFilters.length !== stableFilters.length ||
      currentFilters.some((filter, index) => filter !== stableFilters[index]);

    if (filtersChanged) {
      console.log("Finance filters changed:", {
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

  // Get Redux state
  const financeState = useSelector((state) => state.finance);

  // FIX: Use stable filters without debouncing for immediate response
  const financeFilters = useStableFinanceFilters(financeState);

  // FIX: Still debounce for network requests, but not for filter calculation
  const debouncedFinanceFilters = useDebounce(financeFilters, 150); // Reduced debounce time

  // Check if we have active finance filters
  const hasFinanceFilters = useMemo(() => {
    return financeFilters.length > 0; // Use immediate filters, not debounced
  }, [financeFilters.length]);

  // OPTIMIZATION: Throttled WebSocket send function
  const throttledSendMessage = useThrottle((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, 100);

  // FIX: Stable sendFilterRequest function
  const sendFilterRequest = useCallback(
    (filters) => {
      if (
        !filters ||
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN
      ) {
        return;
      }

      const financeOnlyFilters = filters.filter(
        (f) =>
          f.startsWith("symbol_") ||
          f.startsWith("sector_") ||
          f.startsWith("type_") ||
          f.startsWith("price_")
      );

      // Optimized filter comparison - avoid JSON.stringify overhead
      const sortedFilters = financeOnlyFilters.sort();
      const filtersString = sortedFilters.join(",");
      if (filtersString === lastSentFiltersRef.current) {
        //console.log('Skipping duplicate filter request');
        return;
      }

      lastSentFiltersRef.current = filtersString;
      console.log("Sending filter request:", {
        count: financeOnlyFilters.length,
        first3: financeOnlyFilters.slice(0, 3),
      });

      throttledSendMessage({
        type: "filter_request",
        filters: financeOnlyFilters,
        timestamp: Date.now(),
      });
    },
    [throttledSendMessage]
  );

  // FIX: Separate effect for sending filters to avoid connection recreation
  useEffect(() => {
    if (
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN &&
      debouncedFinanceFilters
    ) {
      sendFilterRequest(debouncedFinanceFilters);
    }
  }, [debouncedFinanceFilters, sendFilterRequest]);

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

        const ws = await createWebSocketConnection(4001);
        if (!isComponentMounted) {
          ws.close();
          return;
        }

        wsRef.current = ws;

        ws.onopen = () => {
          if (!isComponentMounted) return;
          console.log("WebSocket connected, sending initial request");
          setConnectionStatus("Connected");
          reconnectTimeoutRef.attempts = 0;
          lastSentFiltersRef.current = "";

          // Send connection message
          throttledSendMessage({ type: "connection", timestamp: Date.now() });
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
            //console.log("Received data:", {
            //  type: receivedData.type,
            //  count: receivedData.count,
            //});

            switch (receivedData.type) {
              case "initial_data":
              case "filtered_data":
              case "financial_update":
              case "all_trades_data":
                setTradesData(receivedData);
                break;
              case "connection_confirmed":
                console.log("Connection confirmed, sending current filters");
                // FIX: Send current filters immediately, not debounced ones
                if (financeFilters.length > 0) {
                  sendFilterRequest(financeFilters);
                }
                break;
            }
          } catch (err) {
            console.error("Message parse error:", err);
          }
        };

        ws.onerror = (error) => {
          if (!isComponentMounted) return;
          console.error("WebSocket error:", error);
          setConnectionStatus("Connection Error");
        };
      } catch (error) {
        if (!isComponentMounted) return;
        console.error("Failed to create WebSocket connection:", error);
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
    console.log("useFinanceData state:", {
      hasFilters: hasFinanceFilters,
      filterCount: financeFilters.length,
      debouncedCount: debouncedFinanceFilters.length,
      connectionStatus,
      dataCount: tradesData?.count || 0,
      isInitialized,
    });
  }, [
    hasFinanceFilters,
    financeFilters.length,
    debouncedFinanceFilters.length,
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
