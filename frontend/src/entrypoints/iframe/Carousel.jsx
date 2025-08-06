"use client";

import { Ticker } from "motion-plus/react";
import { motion, useMotionValue } from "motion/react";
import GameCard from "./GameCard";
import TradeCard from "./TradeCard";
import RssCard from "./RssCard";
import useSportsData from "../components/hooks/useSportsData";
import useFinanceData from "../components/hooks/useFinanceData";
import useRssData from "../components/hooks/useRssData";
import { memo, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updatePinnedFinanceData } from "../store/pinnedSlice.js";

// Speed configurations mapped to Ticker speeds
const SPEED_CONFIG = {
  slow: { speed: 50, hoverFactor: 0 },
  classic: { speed: 100, hoverFactor: 0.25 },
  fast: { speed: 150, hoverFactor: 0.5 },
};

// Wrapper component for consistent card styling
const CardWrapper = ({ children, index }) => (
  <motion.div
    className="h-full py-2 px-1 flex-shrink-0"
    style={{ width: "320px" }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
  >
    {children}
  </motion.div>
);

export const Carousel = memo(function Carousel() {
  const offset = useMotionValue(0);

  // Use all custom hooks to get data
  const {
    sportsData,
    connectionStatus: sportsConnectionStatus,
    hasActiveSportsToggles,
  } = useSportsData();

  const {
    tradesData,
    connectionStatus: financeConnectionStatus,
    hasFinanceFilters,
  } = useFinanceData();

  const {
    rssItems,
    connectionStatus: rssConnectionStatus,
    hasActiveRssFeeds,
  } = useRssData();

  // Get speed setting from Redux
  const speed = useSelector((state) => state.layout?.speed || "classic");

  // Get dispatch function to update pinned items
  const dispatch = useDispatch();

  // Update pinned finance items whenever fresh data arrives
  useEffect(() => {
    if (tradesData?.data?.length > 0) {
      dispatch(updatePinnedFinanceData(tradesData.data));
    }
  }, [tradesData?.data, dispatch]);

  // Memoize expensive computations
  const hasData = useMemo(() => {
    return (
      tradesData?.data?.length > 0 ||
      sportsData?.length > 0 ||
      rssItems?.length > 0
    );
  }, [tradesData?.data?.length, sportsData?.length, rssItems?.length]);

  const showEmptyMessage = useMemo(() => {
    return !hasFinanceFilters && !hasActiveSportsToggles && !hasActiveRssFeeds;
  }, [hasFinanceFilters, hasActiveSportsToggles, hasActiveRssFeeds]);

  // Get speed configuration based on current speed setting
  const speedConfig = useMemo(() => {
    return SPEED_CONFIG[speed] || SPEED_CONFIG.classic;
  }, [speed]);

  // Combine all items into a single array for the ticker
  const tickerItems = useMemo(() => {
    const items = [];
    let index = 0;

    // Add trade cards
    if (tradesData?.data?.length > 0) {
      tradesData.data.forEach((trade) => {
        items.push(
          <CardWrapper key={`trade-${trade.symbol}`} index={index++}>
            <TradeCard trade={trade} />
          </CardWrapper>
        );
      });
    }

    // Add sports cards
    if (sportsData?.length > 0) {
      sportsData.forEach((game) => {
        items.push(
          <CardWrapper key={`game-${game.id}`} index={index++}>
            <GameCard game={game} />
          </CardWrapper>
        );
      });
    }

    // Add RSS cards
    if (rssItems?.length > 0) {
      rssItems.forEach((rssItem) => {
        items.push(
          <CardWrapper key={`rss-${rssItem.id}`} index={index++}>
            <RssCard rssItem={rssItem} />
          </CardWrapper>
        );
      });
    }

    return items;
  }, [tradesData?.data, sportsData, rssItems]);

  return (
    <div className="flex-grow overflow-hidden">
      {hasData && tickerItems.length > 0 && (
        <div className="relative">
          <Ticker
            items={tickerItems}
            velocity={speedConfig.speed}
            hoverFactor={speedConfig.hoverFactor}
            style={{
              maskImage:
                "linear-gradient(to right, transparent 1%, black 8%, black 92%, transparent 99%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 1%, black 8%, black 92%, transparent 99%)",
            }}
          />
        </div>
      )}

      {/* Show message when no filters are selected */}
      {showEmptyMessage && (
        <div className="mt-4">
          <div className="text-center py-8 text-gray-500">
            Select finance, sports, or RSS options to see data
          </div>
        </div>
      )}
    </div>
  );
});
