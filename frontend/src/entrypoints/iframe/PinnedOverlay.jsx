import React, { memo } from "react";
import { useSelector } from "react-redux";
import {
  selectPinnedItems,
  selectHasPinnedItems,
} from "../store/pinnedSlice.js";
import TradeCard from "./TradeCard.jsx";
import GameCard from "./GameCard.jsx";
import RssCard from "./RssCard.jsx";

const PinnedOverlay = memo(function PinnedOverlay() {
  const pinnedItems = useSelector(selectPinnedItems);
  const hasPinnedItems = useSelector(selectHasPinnedItems);

  if (!hasPinnedItems) {
    return null;
  }

  return (
    <div className="flex flex-none items-center gap-2 pr-2">
      {pinnedItems.map((item, index) => {
        const key = item.type === "finance" ? item.data.symbol : item.data.id;

        return (
          <div key={`${item.type}-${key}`} className="w-80 flex-shrink-0">
            {item.type === "finance" && <TradeCard trade={item.data} />}
            {item.type === "sports" && <GameCard game={item.data} />}
            {item.type === "rss" && <RssCard rssItem={item.data} />}
          </div>
        );
      })}
    </div>
  );
});

export default PinnedOverlay;
