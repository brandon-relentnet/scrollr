import React, {useMemo, memo} from 'react';
import {
    ArrowUpIcon,
    ArrowDownIcon,
    ClockIcon,
} from '@heroicons/react/24/solid';

const TradeCard = memo(({trade}) => {
    const isPositive = trade.direction === 'up';
    const cardClass = isPositive
        ? 'border-l-4 border-l-success bg-success/5'
        : 'border-l-4 border-l-error bg-error/5';

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

    return (
        <div className="card bg-base-100 shadow-sm h-full overflow-hidden">
            <div className="card-body p-5">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="card-title text-lg font-bold">{trade.symbol}</h3>
                        <p className="text-2xl font-mono font-bold">
                            ${formattedPrice}
                        </p>
                    </div>
                    <div className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-error'}`}>
                        {isPositive ? (
                            <ArrowUpIcon className="w-5 h-5"/>
                        ) : (
                            <ArrowDownIcon className="w-5 h-5"/>
                        )}
                        <span className="font-bold">{formattedPercentage}</span>
                    </div>
                </div>

                <div className="divider my-2"></div>

                <div className="grid grid-cols-2 gap-2 text-sm">
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

                <div className="flex items-center gap-1 mt-2 text-xs text-base-content/60">
                    <ClockIcon className="w-3 h-3"/>
                    <span>Updated: {formattedTime}</span>
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