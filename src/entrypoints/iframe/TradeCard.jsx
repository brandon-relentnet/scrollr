import React, {useMemo, memo} from 'react';
import {
    ArrowUpIcon,
    ArrowDownIcon,
    ClockIcon,
} from '@heroicons/react/24/solid';
import {useSelector} from "react-redux";

const TradeCard = memo(({trade}) => {
    const layout = useSelector((state) => state.layout?.mode || 'compact');
    const isCompact = layout === 'compact';
    const isPositive = trade.direction === 'up';

    // OPTIMIZATION: Pre-calculated values with proper rounding
    const formattedPrice = useMemo(() => {
        const price = parseFloat(trade.price);
        return isNaN(price) ? '0.00' : price.toFixed(2);
    }, [trade.price]);

    const formattedChange = useMemo(() => {
        const num = parseFloat(trade.price_change);
        if (isNaN(num)) return '0.00';
        return num >= 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
    }, [trade.price_change]);

    const formattedPercentage = useMemo(() => {
        const num = parseFloat(trade.percentage_change);
        if (isNaN(num)) return '0.00%';
        return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
    }, [trade.percentage_change]);

    const formattedTime = useMemo(() => {
        if (!trade.last_updated) return 'Unknown';
        try {
            return new Date(trade.last_updated).toLocaleTimeString();
        } catch {
            return 'Invalid';
        }
    }, [trade.last_updated]);

    const formattedPreviousClose = useMemo(() => {
        const price = parseFloat(trade.previous_close);
        return isNaN(price) ? '0.00' : price.toFixed(2);
    }, [trade.previous_close]);

    const DirectionIcon = () => (
        <div className={`flex items-center ${isPositive ? 'text-success' : 'text-error'}`}>
            {isPositive ? (
                <ArrowUpIcon className="size-4"/>
            ) : (
                <ArrowDownIcon className="size-4"/>
            )}
        </div>
    );

    if (isCompact) {
        return (
            <div className="card bg-base-200 group cursor-pointer border border-base-300 transition duration-150 h-14">
                <div className="card-body py-2 px-2 flex-row justify-evenly items-center">
                    {/* Symbol and Direction */}
                    <div className="flex items-center gap-2">
                        <DirectionIcon/>
                        <span className="font-bold text-sm">{trade.symbol}</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center">
                        <span className="font-mono font-bold text-base">${formattedPrice}</span>
                    </div>

                    {/* Change */}
                    <div className="flex items-center">
                        <span className={`font-mono font-bold text-sm ${isPositive ? 'text-success' : 'text-error'}`}>
                            {formattedPercentage}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // Comfort Mode
    return (
        <div className="card bg-base-200 group cursor-pointer border border-base-300 hover:border-base-content/20 transition-all duration-150 h-40 shadow-sm hover:shadow-md">
            <div className="card-body flex justify-center gap-0 p-3">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="card-title text-lg font-bold">{trade.symbol}</h3>
                        <p className="text-2xl font-mono font-bold">
                            ${formattedPrice}
                        </p>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-error'}`}>
                            {isPositive ? (
                                <ArrowUpIcon className="size-5"/>
                            ) : (
                                <ArrowDownIcon className="size-5"/>
                            )}
                            <span className="font-bold">{formattedPercentage}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-xs text-base-content/60">
                            <ClockIcon className="w-3 h-3"/>
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
                        <p className={`font-mono font-bold ${isPositive ? 'text-success' : 'text-error'}`}>
                            ${formattedChange}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // OPTIMIZATION: Custom comparison for better performance
    const prev = prevProps.trade;
    const next = nextProps.trade;

    return prev.symbol === next.symbol &&
        prev.price === next.price &&
        prev.price_change === next.price_change &&
        prev.percentage_change === next.percentage_change &&
        prev.direction === next.direction &&
        prev.last_updated === next.last_updated;
});

export default TradeCard;