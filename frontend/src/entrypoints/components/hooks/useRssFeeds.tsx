import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setRssFeeds,
  addRssFeed,
  removeRssFeed,
  updateRssFeed,
} from "@/entrypoints/store/rssSlice.js";
import { useAuth } from "./useAuth.tsx";
import { API_ENDPOINTS } from "@/entrypoints/config/endpoints.js";
import debugLogger, {
  DEBUG_CATEGORIES,
} from "@/entrypoints/utils/debugLogger.js";

interface RssFeed {
  id: number;
  name: string;
  url: string;
  category: string;
  created_at: string;
  updated_at: string;
}

interface RssFeedInput {
  name: string;
  url: string;
  category?: string;
}

export function useRssFeeds() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useDispatch();
  const { isAuthenticated, token } = useAuth();
  const rssState = useSelector((state: any) => state.rss);

  // Load RSS feeds from server
  const loadFeeds = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.accounts.auth.rssFeeds, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const { feeds } = await response.json();
        dispatch(setRssFeeds(feeds));
      } else {
        const { error: errorMessage } = await response.json();
        setError(errorMessage || "Failed to load RSS feeds");
      }
    } catch (err) {
      debugLogger.error(DEBUG_CATEGORIES.RSS, "Error loading RSS feeds", err);
      setError("Network error loading RSS feeds");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token, dispatch]);

  // Add new RSS feed
  const addFeed = useCallback(
    async (
      feedData: RssFeedInput
    ): Promise<{ success: boolean; error?: string }> => {
      if (!isAuthenticated || !token) {
        return { success: false, error: "Authentication required" };
      }

      setError(null);

      try {
        const response = await fetch(API_ENDPOINTS.accounts.auth.rssFeeds, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(feedData),
        });

        const data = await response.json();

        if (response.ok) {
          dispatch(addRssFeed(data.feed));
          return { success: true };
        } else {
          setError(data.error || "Failed to add RSS feed");
          return {
            success: false,
            error: data.error || "Failed to add RSS feed",
          };
        }
      } catch (err) {
        debugLogger.error(DEBUG_CATEGORIES.RSS, "Error adding RSS feed", err);
        const errorMessage = "Network error adding RSS feed";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [isAuthenticated, token, dispatch]
  );

  // Update RSS feed
  const updateFeed = useCallback(
    async (
      feedId: number,
      updates: Partial<RssFeedInput>
    ): Promise<{ success: boolean; error?: string }> => {
      if (!isAuthenticated || !token) {
        return { success: false, error: "Authentication required" };
      }

      setError(null);

      try {
        const response = await fetch(
          `${API_ENDPOINTS.accounts.auth.rssFeeds}/${feedId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updates),
          }
        );

        const data = await response.json();

        if (response.ok) {
          dispatch(updateRssFeed({ id: feedId, updates: data.feed }));
          return { success: true };
        } else {
          setError(data.error || "Failed to update RSS feed");
          return {
            success: false,
            error: data.error || "Failed to update RSS feed",
          };
        }
      } catch (err) {
        debugLogger.error(DEBUG_CATEGORIES.RSS, "Error updating RSS feed", err);
        const errorMessage = "Network error updating RSS feed";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [isAuthenticated, token, dispatch]
  );

  // Delete RSS feed
  const deleteFeed = useCallback(
    async (feedId: number): Promise<{ success: boolean; error?: string }> => {
      if (!isAuthenticated || !token) {
        return { success: false, error: "Authentication required" };
      }

      setError(null);

      try {
        const response = await fetch(
          `${API_ENDPOINTS.accounts.auth.rssFeeds}/${feedId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          dispatch(removeRssFeed(feedId));
          return { success: true };
        } else {
          setError(data.error || "Failed to delete RSS feed");
          return {
            success: false,
            error: data.error || "Failed to delete RSS feed",
          };
        }
      } catch (err) {
        debugLogger.error(DEBUG_CATEGORIES.RSS, "Error deleting RSS feed", err);
        const errorMessage = "Network error deleting RSS feed";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [isAuthenticated, token, dispatch]
  );

  // Load feeds when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      loadFeeds();
    }
  }, [isAuthenticated, token, loadFeeds]);

  return {
    feeds: rssState?.feeds || [],
    customSelections: rssState?.customSelections || {},
    searchTerm: rssState?.searchTerm || "",
    enabled: rssState?.enabled || false,
    isLoading,
    error,
    loadFeeds,
    addFeed,
    updateFeed,
    deleteFeed,
  };
}
