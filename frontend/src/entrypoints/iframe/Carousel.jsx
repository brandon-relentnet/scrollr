import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import GameCard from "./GameCard";
import TradeCard from "./TradeCard";
import RssCard from "./RssCard";
import useSportsData from "../components/hooks/useSportsData";
import useFinanceData from "../components/hooks/useFinanceData";
import useRssData from "../components/hooks/useRssData";
import { memo, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updatePinnedFinanceData } from "../store/pinnedSlice.js";

// Pre-computed breakpoints - moved outside component to prevent recreation
const BREAKPOINTS = (() => {
  const breakpoints = {};
  for (let i = 0; i <= 8000; i += 320) {
    breakpoints[i] = {
      slidesPerView: Math.max(1, Math.floor(i / 320)),
    };
  }
  return breakpoints;
})();

// Speed configurations
const SPEED_CONFIG = {
  slow: { delay: 5000, speed: 1000 },
  classic: { delay: 3000, speed: 600 },
  fast: { delay: 1500, speed: 300 },
};

export const Carousel = memo(function Carousel() {
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

  return (
    <div className="flex-grow overflow-hidden">
      {hasData && (
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: speedConfig.delay, disableOnInteraction: false }}
          breakpointsBase={"container"}
          loop={true}
          speed={speedConfig.speed}
          spaceBetween={8}
          breakpoints={BREAKPOINTS}
          watchSlidesProgress={true}
        >
          {tradesData?.data?.length > 0 &&
            tradesData.data.map((trade) => (
              <SwiperSlide key={trade.symbol} className="h-full py-2">
                <TradeCard trade={trade} />
              </SwiperSlide>
            ))}
          {sportsData?.length > 0 &&
            sportsData.map((game) => (
              <SwiperSlide key={game.id} className="h-full py-2">
                <GameCard game={game} />
              </SwiperSlide>
            ))}
          {rssItems?.length > 0 &&
            rssItems.map((rssItem) => (
              <SwiperSlide key={rssItem.id} className="h-full py-2">
                <RssCard rssItem={rssItem} />
              </SwiperSlide>
            ))}
        </Swiper>
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
