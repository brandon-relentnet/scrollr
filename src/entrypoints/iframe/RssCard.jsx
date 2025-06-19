import React, {useMemo, memo, useCallback} from 'react';
import {
    CalendarIcon,
    GlobeAltIcon,
    LinkIcon,
} from '@heroicons/react/24/solid';
import {useSelector} from "react-redux";

const RssCard = memo(({rssItem}) => {
    const layout = useSelector((state) => state.layout?.mode || 'compact');
    const isCompact = layout === 'compact';

    // Memoized computations for performance
    const formattedDate = useMemo(() => {
        if (!rssItem.publishedDate) return 'Unknown';
        try {
            const date = new Date(rssItem.publishedDate);
            return isCompact 
                ? date.toLocaleDateString() 
                : date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
        } catch {
            return 'Invalid Date';
        }
    }, [rssItem.publishedDate, isCompact]);

    const truncatedTitle = useMemo(() => {
        if (!rssItem.title) return 'No Title';
        return isCompact && rssItem.title.length > 50 
            ? `${rssItem.title.substring(0, 50)}...` 
            : rssItem.title;
    }, [rssItem.title, isCompact]);

    const truncatedDescription = useMemo(() => {
        if (!rssItem.description) return '';
        const maxLength = 120;
        return rssItem.description.length > maxLength 
            ? `${rssItem.description.substring(0, maxLength)}...` 
            : rssItem.description;
    }, [rssItem.description]);

    const sourceName = useMemo(() => {
        return rssItem.sourceName || 'RSS Feed';
    }, [rssItem.sourceName]);

    // Event handlers
    const handleCardClick = useCallback(() => {
        if (rssItem.link) {
            window.open(rssItem.link, '_blank');
        }
    }, [rssItem.link]);

    const handleImageError = useCallback((e) => {
        e.target.style.display = 'none';
    }, []);

    const CategoryBadge = () => (
        <div className="badge badge-primary badge-sm">
            {rssItem.category || 'General'}
        </div>
    );

    if (isCompact) {
        return (
            <div className="card bg-base-200 group cursor-pointer border border-base-300 transition duration-150 h-14"
                 onClick={handleCardClick}>
                <div className="card-body py-2 px-3 flex-row justify-between items-center">
                    {/* Left side - Source and date */}
                    <div className="flex items-center gap-2 min-w-0">
                        <GlobeAltIcon className="size-4 text-primary flex-shrink-0"/>
                        <span className="text-xs text-base-content/70 flex-shrink-0">{sourceName}</span>
                        <span className="text-xs text-base-content/50 flex-shrink-0">•</span>
                        <span className="text-xs text-base-content/50 flex-shrink-0">{formattedDate}</span>
                    </div>

                    {/* Center - Title */}
                    <div className="flex-1 min-w-0 px-2">
                        <span className="font-semibold text-sm truncate block">{truncatedTitle}</span>
                    </div>

                    {/* Right side - Category and external link */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <CategoryBadge/>
                        <LinkIcon className="size-4 text-base-content/50 opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </div>
                </div>
            </div>
        );
    }

    // Comfort Mode
    return (
        <div className="card bg-base-200 group cursor-pointer border border-base-300 hover:border-base-content/20 transition-all duration-150 h-40 shadow-sm hover:shadow-md"
             onClick={handleCardClick}>
            <div className="card-body flex flex-col gap-2 p-3">
                {/* Header */}
                <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <GlobeAltIcon className="size-4 text-primary flex-shrink-0"/>
                        <span className="text-sm font-medium text-base-content/80 truncate">{sourceName}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <CategoryBadge/>
                        <LinkIcon className="size-4 text-base-content/50 opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </div>
                </div>

                {/* Title */}
                <div className="flex-1">
                    <h3 className="font-bold text-base leading-tight line-clamp-2 mb-2">
                        {rssItem.title || 'No Title'}
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
                        <CalendarIcon className="size-3"/>
                        <span>{formattedDate}</span>
                    </div>
                    <span className="text-primary font-medium">Read More →</span>
                </div>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for better performance
    const prev = prevProps.rssItem;
    const next = nextProps.rssItem;

    return prev.id === next.id &&
           prev.title === next.title &&
           prev.publishedDate === next.publishedDate &&
           prev.link === next.link &&
           prev.sourceName === next.sourceName;
});

export default RssCard;