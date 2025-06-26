import React, { useMemo, memo, useEffect } from "react";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";
import { LockClosedIcon, LockOpenIcon } from "@heroicons/react/24/solid";
import { useSelector, useDispatch } from "react-redux";
import {
  addPinnedItem,
  removePinnedItem,
  selectIsItemPinned,
} from "../store/pinnedSlice.js";
import debugLogger, { DEBUG_CATEGORIES } from "../utils/debugLogger.js";

const TradeCard = memo(
  ({ trade }) => {
    const dispatch = useDispatch();
    const layout = useSelector((state) => state.layout?.mode || "compact");
    const isCompact = layout === "compact";
    const isPositive = trade.direction === "up";
    const isPinned = useSelector((state) =>
      selectIsItemPinned(state, "finance", trade.symbol)
    );

    // Debug logging for trade updates
    useEffect(() => {
      debugLogger.stateChange(`TradeCard ${trade.symbol} updated`, {
        price: trade.price,
        change: trade.price_change,
        percentage: trade.percentage_change,
        direction: trade.direction,
        lastUpdated: trade.last_updated,
        timestamp: Date.now(),
      });
    }, [
      trade.price,
      trade.price_change,
      trade.percentage_change,
      trade.direction,
      trade.last_updated,
      trade.symbol,
    ]);

    // OPTIMIZATION: Pre-calculated values with proper rounding and type conversion
    const formattedPrice = useMemo(() => {
      const price = parseFloat(trade.price);
      return isNaN(price) ? "0.00" : price.toFixed(2);
    }, [trade.price]);

    const formattedChange = useMemo(() => {
      const num = parseFloat(trade.price_change);
      if (isNaN(num)) return "0.00";
      return num >= 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
    }, [trade.price_change]);

    const formattedPercentage = useMemo(() => {
      const num = parseFloat(trade.percentage_change);
      if (isNaN(num)) return "0.00%";
      return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
    }, [trade.percentage_change]);

    const formattedTime = useMemo(() => {
      if (!trade.last_updated) return "Unknown";
      try {
        return new Date(trade.last_updated).toLocaleTimeString();
      } catch {
        return "Invalid";
      }
    }, [trade.last_updated]);

    const formattedPreviousClose = useMemo(() => {
      const price = parseFloat(trade.previous_close);
      return isNaN(price) ? "0.00" : price.toFixed(2);
    }, [trade.previous_close]);

    // Handle pin/unpin
    const handlePinToggle = (e) => {
      e.stopPropagation();
      if (isPinned) {
        dispatch(removePinnedItem({ type: "finance", id: trade.symbol }));
      } else {
        dispatch(addPinnedItem({ type: "finance", data: trade }));
      }
    };

    // Handle card click to open Yahoo Finance
    const handleCardClick = () => {
      const yahooUrl = `https://finance.yahoo.com/quote/${trade.symbol}/`;
      window.open(yahooUrl, "_blank");
    };

    const DirectionIcon = () => (
      <div
        className={`flex items-center ${
          isPositive ? "text-success" : "text-error"
        }`}
      >
        {isPositive ? (
          <ArrowUpIcon className="size-4" />
        ) : (
          <ArrowDownIcon className="size-4" />
        )}
      </div>
    );

    const PinButton = ({ size = "w-4 h-4" }) => (
      <button
        onClick={handlePinToggle}
        className={`${size} text-base-content/60 hover:text-base-content transition-colors p-1 rounded hover:bg-base-300`}
        title={isPinned ? "Unpin item" : "Pin item"}
      >
        {isPinned ? (
          <LockClosedIcon className="w-full h-full" />
        ) : (
          <LockOpenIcon className="w-full h-full" />
        )}
      </button>
    );

    if (isCompact) {
      return (
        <div
          className="card bg-base-200 group cursor-pointer border border-base-300 transition duration-150 h-14 relative"
          onClick={handleCardClick}
        >
          {/* Pin Button - Top Right */}
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <PinButton size="size-8" />
          </div>

          <div className="card-body py-2 px-2 flex-row justify-evenly items-center">
            {/* Symbol and Direction */}
            <div className="flex items-center gap-2">
              <DirectionIcon />
              <span className="font-bold text-sm">{trade.symbol}</span>
            </div>

            {/* Price */}
            <div className="flex items-center">
              <span className="font-mono font-bold text-base">
                ${formattedPrice}
              </span>
            </div>

            {/* Change */}
            <div className="flex items-center">
              <span
                className={`font-mono font-bold text-sm ${
                  isPositive ? "text-success" : "text-error"
                }`}
              >
                {formattedPercentage}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Comfort Mode
    return (
      <div
        className="card bg-base-200 group cursor-pointer border border-base-300 hover:border-base-content/20 transition-all duration-150 h-40 shadow-sm hover:shadow-md relative"
        onClick={handleCardClick}
      >
        {/* Pin Button - Top Right */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <PinButton size="size-8" />
        </div>

        <div className="card-body flex justify-center gap-0 p-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="card-title text-lg font-bold">{trade.symbol}</h3>
              <p className="text-2xl font-mono font-bold">${formattedPrice}</p>
            </div>
            <div className="flex flex-col items-end">
              <div
                className={`flex items-center gap-1 ${
                  isPositive ? "text-success" : "text-error"
                }`}
              >
                {isPositive ? (
                  <ArrowUpIcon className="size-5" />
                ) : (
                  <ArrowDownIcon className="size-5" />
                )}
                <span className="font-bold">{formattedPercentage}</span>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-base-content/60">
                <ClockIcon className="w-3 h-3" />
                <span>Updated: {formattedTime}</span>
              </div>
            </div>
          </div>

          <div className="divider -my-1"></div>

          {/* Details */}
          <div className="flex justify-between gap-2 text-sm">
            <div>
              <span className="text-base-content/60">Previous Close:</span>
              <p className="font-mono">${formattedPreviousClose}</p>
            </div>
            <div>
              <span className="text-base-content/60">Change:</span>
              <p
                className={`font-mono font-bold ${
                  isPositive ? "text-success" : "text-error"
                }`}
              >
                ${formattedChange}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // IMPROVED: More robust comparison that handles type differences
    const prev = prevProps.trade;
    const next = nextProps.trade;

    // Convert to strings for comparison to handle type differences
    const prevPrice = String(prev.price || "0");
    const nextPrice = String(next.price || "0");
    const prevChange = String(prev.price_change || "0");
    const nextChange = String(next.price_change || "0");
    const prevPercentage = String(prev.percentage_change || "0");
    const nextPercentage = String(next.percentage_change || "0");
    const prevDirection = String(prev.direction || "");
    const nextDirection = String(next.direction || "");
    const prevUpdated = String(prev.last_updated || "");
    const nextUpdated = String(next.last_updated || "");

    const areEqual =
      prev.symbol === next.symbol &&
      prevPrice === nextPrice &&
      prevChange === nextChange &&
      prevPercentage === nextPercentage &&
      prevDirection === nextDirection &&
      prevUpdated === nextUpdated;

    // Debug logging for memoization decisions
    if (!areEqual) {
      debugLogger.debug(DEBUG_CATEGORIES.STATE, `TradeCard ${prev.symbol} will re-render`, {
        priceChanged: prevPrice !== nextPrice,
        changeChanged: prevChange !== nextChange,
        percentageChanged: prevPercentage !== nextPercentage,
        directionChanged: prevDirection !== nextDirection,
        timeChanged: prevUpdated !== nextUpdated,
        prevData: {
          price: prevPrice,
          change: prevChange,
          percentage: prevPercentage,
        },
        nextData: {
          price: nextPrice,
          change: nextChange,
          percentage: nextPercentage,
        },
      });
    }

    return areEqual;
  }
);

export default TradeCard;
