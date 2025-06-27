import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import debugLogger, {
  DEBUG_CATEGORIES,
} from "@/entrypoints/utils/debugLogger.js";

// Debounce utility for RSS feed updates
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

// Static helper functions
function getSelectedRssFeeds(rssState) {
  if (!rssState?.feeds || !rssState?.customSelections) {
    return [];
  }

  return rssState.feeds.filter(
    (feed) => rssState.customSelections[feed.id] === true
  );
}

// Multiple CORS proxy options for better reliability
const CORS_PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url) => `https://proxy.cors.sh/${url}`,
];

// RSS feed parser and fetcher with fallback proxies
async function fetchRssFeed(feed) {
  let lastError = null;

  // Try each CORS proxy
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    try {
      const proxyUrl = CORS_PROXIES[i](feed.url);
      debugLogger.rssEvent(`Attempting to fetch RSS feed via proxy ${i + 1}`, {
        feedName: feed.name,
        proxyIndex: i + 1,
      });

      // Create timeout controller for better browser compatibility
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(proxyUrl, {
        headers: {
          Accept: "application/rss+xml, application/xml, text/xml, */*",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let xmlText;

      // Handle different proxy response formats
      if (i === 0) {
        // corsproxy.io returns raw content
        xmlText = await response.text();
      } else if (i === 1) {
        // allorigins.win returns JSON with contents
        const data = await response.json();
        xmlText = data.contents;
      } else {
        // proxy.cors.sh returns raw content
        xmlText = await response.text();
      }

      if (!xmlText || xmlText.trim().length === 0) {
        throw new Error("Empty response from proxy");
      }

      // Parse XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      // Check for parsing errors
      const parseError = xmlDoc.querySelector("parsererror");
      if (parseError) {
        throw new Error(`XML parsing error: ${parseError.textContent}`);
      }

      // Extract RSS items
      const items = Array.from(xmlDoc.querySelectorAll("item, entry")).slice(
        0,
        10
      ); // Limit to 10 items per feed

      if (items.length === 0) {
        throw new Error("No RSS items found in feed");
      }

      const parsedItems = items.map((item, index) => {
        const title =
          item.querySelector("title")?.textContent?.trim() || "No Title";
        const description =
          item
            .querySelector("description, summary, content")
            ?.textContent?.trim() || "";
        const link =
          item.querySelector("link")?.textContent?.trim() ||
          item.querySelector("link")?.getAttribute("href") ||
          "";
        const pubDate =
          item
            .querySelector("pubDate, published, updated")
            ?.textContent?.trim() || "";

        return {
          id: `${feed.id}-${index}`,
          title,
          description: description.replace(/<[^>]*>/g, ""), // Strip HTML tags
          link,
          publishedDate: pubDate
            ? new Date(pubDate).toISOString()
            : new Date().toISOString(),
          sourceName: feed.name,
          category: feed.category,
          feedId: feed.id,
        };
      });

      debugLogger.rssEvent(`Successfully fetched RSS feed via proxy ${i + 1}`, {
        feedName: feed.name,
        itemCount: parsedItems.length,
        proxyIndex: i + 1,
      });
      return parsedItems;
    } catch (error) {
      lastError = error;
      debugLogger.warn(
        DEBUG_CATEGORIES.RSS,
        `Proxy ${i + 1} failed for RSS feed`,
        { feedName: feed.name, error: error.message }
      );

      // If this was the last proxy, we'll throw the error below
      if (i === CORS_PROXIES.length - 1) {
        break;
      }

      // Wait a bit before trying the next proxy
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // If we get here, all proxies failed
  debugLogger.error(
    DEBUG_CATEGORIES.RSS,
    `All CORS proxies failed for RSS feed`,
    { feedName: feed.name, error: lastError }
  );
  return [];
}

// Custom hook to handle RSS data
export default function useRssData() {
  const [rssItems, setRssItems] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Initializing");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const fetchTimeoutRef = useRef(null);
  const lastFetchRef = useRef(0);

  // Get Redux state - check if user is authenticated by checking if RSS feeds exist
  const rssState = useSelector((state) => state.rss);
  const isAuthenticated = rssState?.feeds && rssState.feeds.length > 0;

  // Check if RSS is enabled and we have selected feeds
  const hasActiveRssFeeds = useMemo(() => {
    return (
      isAuthenticated &&
      rssState?.enabled &&
      rssState?.feeds?.length > 0 &&
      Object.values(rssState?.customSelections || {}).some(Boolean)
    );
  }, [
    isAuthenticated,
    rssState?.enabled,
    rssState?.feeds?.length,
    rssState?.customSelections,
  ]);

  // Get selected feeds
  const selectedFeeds = useMemo(() => {
    return hasActiveRssFeeds ? getSelectedRssFeeds(rssState) : [];
  }, [hasActiveRssFeeds, rssState]);

  // Debounce feed changes to avoid too frequent updates
  const debouncedSelectedFeeds = useDebounce(selectedFeeds, 500);

  // Fetch RSS data function
  const fetchRssData = useCallback(async (feeds) => {
    if (!feeds.length) {
      setRssItems([]);
      setConnectionStatus("No RSS Feeds Selected");
      return;
    }

    setIsLoading(true);
    setConnectionStatus("Fetching RSS Feeds");

    try {
      // Fetch all feeds in parallel
      const feedPromises = feeds.map((feed) => fetchRssFeed(feed));
      const feedResults = await Promise.all(feedPromises);

      // Flatten and combine all RSS items
      const allItems = feedResults.flat();

      // Sort by published date (newest first)
      const sortedItems = allItems.sort(
        (a, b) => new Date(b.publishedDate) - new Date(a.publishedDate)
      );

      setRssItems(sortedItems);
      setConnectionStatus(`Connected - ${sortedItems.length} articles`);
      lastFetchRef.current = Date.now();
    } catch (error) {
      debugLogger.error(DEBUG_CATEGORIES.RSS, "Error fetching RSS data", error);
      setConnectionStatus("Error Fetching RSS");
      setRssItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize empty state when no active feeds
  useEffect(() => {
    if (!isInitialized) {
      if (!hasActiveRssFeeds) {
        setRssItems([]);
        setConnectionStatus("No RSS Feeds");
      }
      setIsInitialized(true);
    }
  }, [hasActiveRssFeeds, isInitialized]);

  // Main effect to fetch RSS data when feeds change
  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    if (!hasActiveRssFeeds) {
      setRssItems([]);
      setConnectionStatus("No RSS Feeds");
      return;
    }

    // Immediate fetch for first load, then debounced
    const timeSinceLastFetch = Date.now() - lastFetchRef.current;
    const shouldFetchImmediately = timeSinceLastFetch > 30000; // 30 seconds

    if (shouldFetchImmediately) {
      fetchRssData(debouncedSelectedFeeds);
    } else {
      fetchTimeoutRef.current = setTimeout(() => {
        fetchRssData(debouncedSelectedFeeds);
      }, 1000);
    }

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [hasActiveRssFeeds, debouncedSelectedFeeds, fetchRssData]);

  // Auto-refresh RSS feeds every 5 minutes when active
  useEffect(() => {
    if (!hasActiveRssFeeds || !selectedFeeds.length) {
      return;
    }

    const refreshInterval = setInterval(() => {
      debugLogger.rssEvent("Auto-refreshing RSS feeds");
      fetchRssData(selectedFeeds);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, [hasActiveRssFeeds, selectedFeeds, fetchRssData]);

  // Debug logging
  useEffect(() => {
    debugLogger.debug(DEBUG_CATEGORIES.RSS, "useRssData state", {
      hasActiveFeeds: hasActiveRssFeeds,
      selectedFeedsCount: selectedFeeds.length,
      itemsCount: rssItems.length,
      connectionStatus,
      isLoading,
      isInitialized,
    });
  }, [
    hasActiveRssFeeds,
    selectedFeeds.length,
    rssItems.length,
    connectionStatus,
    isLoading,
    isInitialized,
  ]);

  return {
    rssItems,
    connectionStatus,
    hasActiveRssFeeds,
    isLoading,
    isInitialized,
  };
}
