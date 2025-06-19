import React, { useMemo, memo, useCallback } from "react";
import {
  CalendarIcon,
  GlobeAltIcon,
  LinkIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
import { useSelector } from "react-redux";

const RssCard = memo(
  ({ rssItem }) => {
    const layout = useSelector((state) => state.layout?.mode || "compact");
    const isCompact = layout === "compact";

    // Memoized computations for performance
    const formattedDate = useMemo(() => {
      if (!rssItem.publishedDate) return "Unknown";
      try {
        const date = new Date(rssItem.publishedDate);
        return isCompact
          ? date.toLocaleDateString()
          : date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
      } catch {
        return "Invalid Date";
      }
    }, [rssItem.publishedDate, isCompact]);

    const truncatedTitle = useMemo(() => {
      if (!rssItem.title) return "No Title";
      return isCompact && rssItem.title.length > 50
        ? `${rssItem.title.substring(0, 50)}...`
        : rssItem.title;
    }, [rssItem.title, isCompact]);

    const truncatedDescription = useMemo(() => {
      if (!rssItem.description) return "";
      const maxLength = 120;
      return rssItem.description.length > maxLength
        ? `${rssItem.description.substring(0, maxLength)}...`
        : rssItem.description;
    }, [rssItem.description]);

    const sourceName = useMemo(() => {
      return rssItem.sourceName || "RSS Feed";
    }, [rssItem.sourceName]);

    // Tooltip content for compact mode - just the title
    const tooltipContent = useMemo(() => {
      return rssItem.title || "No Title";
    }, [rssItem.title]);

    // Compact title for better layout
    const compactTitle = useMemo(() => {
      if (!rssItem.title) return "No Title";
      return rssItem.title.length > 35
        ? `${rssItem.title.substring(0, 35)}...`
        : rssItem.title;
    }, [rssItem.title]);

    // Time display for compact mode
    const compactTime = useMemo(() => {
      if (!rssItem.publishedDate) return "Unknown";
      try {
        const date = new Date(rssItem.publishedDate);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) return "Now";
        if (diffInHours < 24) return `${Math.floor(diffInHours)}h`;
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`;
        return date.toLocaleDateString();
      } catch {
        return "Unknown";
      }
    }, [rssItem.publishedDate]);

    // Event handlers
    const handleCardClick = useCallback(() => {
      if (rssItem.link) {
        window.open(rssItem.link, "_blank");
      }
    }, [rssItem.link]);

    const handleImageError = useCallback((e) => {
      e.target.style.display = "none";
    }, []);

    const CategoryBadge = () => (
      <div className="badge badge-primary badge-sm">
        {rssItem.category || "General"}
      </div>
    );

    // Status display component similar to GameCard
    const StatusDisplay = () => (
      <div
        className="tooltip tooltip-primary tooltip-right"
        data-tip={tooltipContent}
      >
        {isCompact ? (
          <InformationCircleIcon className="size-5 text-primary/70 hover:text-primary transition-colors" />
        ) : (
          <CategoryBadge />
        )}
      </div>
    );

    if (isCompact) {
      return (
        <div
          className="card bg-base-200 group cursor-pointer border border-base-300 transition duration-150 h-14"
          onClick={handleCardClick}
        >
          <div className="card-body py-2 px-2 flex-row justify-evenly items-center">
            {/* Status/Info Icon - Top Left */}
            <div className="absolute top-1 left-1 flex items-center justify-evenly gap-2">
              <StatusDisplay />
            </div>

            {/* Article Title */}
            <div className="flex-1 min-w-0 px-2">
              <span className="font-bold text-sm truncate block">
                {compactTitle}
              </span>
            </div>

            <div className="flex flex-col items-center flex-shrink-0 mr-1">
              {/* Source Name */}
              <div className="flex items-center gap-1 min-w-0">
                <GlobeAltIcon className="size-4 text-primary/70 flex-shrink-0" />
                <span className="font-semibold text-sm truncate">
                  {sourceName}
                </span>
                <LinkIcon className="size-4 text-base-content/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {/* Time and Link */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-base-content/60 font-mono">
                  {compactTime}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Comfort Mode
    return (
      <div
        className="card bg-base-200 group cursor-pointer border border-base-300 hover:border-base-content/20 transition-all duration-150 h-40 shadow-sm hover:shadow-md"
        onClick={handleCardClick}
      >
        <div className="card-body flex flex-col gap-2 p-3">
          {/* Header */}
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <GlobeAltIcon className="size-4 text-primary flex-shrink-0" />
              <span className="text-sm font-medium text-base-content/80 truncate">
                {sourceName}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <LinkIcon className="size-4 text-base-content/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CategoryBadge />
            </div>
          </div>

          {/* Title */}
          <div className="flex-1">
            <h3 className="font-bold text-base leading-tight line-clamp-2 mb-2 truncate">
              {rssItem.title || "No Title"}
            </h3>

            {/* Description */}
            {truncatedDescription && (
              <p className="text-sm text-base-content/70 line-clamp-2">
                {truncatedDescription}
              </p>
            )}
          </div>

          <div className="divider -my-1"></div>

          {/* Footer */}
          <div className="flex justify-between items-center text-xs text-base-content/60">
            <div className="flex items-center gap-1">
              <CalendarIcon className="size-3" />
              <span>{formattedDate}</span>
            </div>
            <span className="text-primary font-medium">Read More →</span>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for better performance
    const prev = prevProps.rssItem;
    const next = nextProps.rssItem;

    return (
      prev.id === next.id &&
      prev.title === next.title &&
      prev.publishedDate === next.publishedDate &&
      prev.link === next.link &&
      prev.sourceName === next.sourceName
    );
  }
);

export default RssCard;
