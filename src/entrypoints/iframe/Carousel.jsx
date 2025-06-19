import {Autoplay} from 'swiper/modules';
import {Swiper, SwiperSlide} from 'swiper/react';
import 'swiper/css';
import GameCard from './GameCard';
import TradeCard from './TradeCard';
import useSportsData from './useSportsData';
import useFinanceData from './useFinanceData';
import { memo, useMemo } from 'react';

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

export const Carousel = memo(function Carousel() {
    // Use both custom hooks to get data
    const {sportsData, connectionStatus: sportsConnectionStatus, hasActiveSportsToggles} = useSportsData();
    const {tradesData, connectionStatus: financeConnectionStatus, hasFinanceFilters} = useFinanceData();

    // Memoize expensive computations
    const hasData = useMemo(() => {
        return (tradesData?.data?.length > 0 || sportsData?.length > 0);
    }, [tradesData?.data?.length, sportsData?.length]);

    const showEmptyMessage = useMemo(() => {
        return !hasFinanceFilters && !hasActiveSportsToggles;
    }, [hasFinanceFilters, hasActiveSportsToggles]);

    return (
        <div className="flex-grow overflow-hidden">
            {hasData && (
                <Swiper
                    modules={[Autoplay]}
                    autoplay={{delay: 3000, disableOnInteraction: false}}
                    breakpointsBase={'container'}
                    loop={true}
                    speed={600}
                    spaceBetween={8}
                    breakpoints={BREAKPOINTS}
                    watchSlidesProgress={true}
                >
                    {tradesData?.data?.length > 0 &&
                        tradesData.data.map((trade) => (
                            <SwiperSlide key={trade.symbol} className="h-full py-2">
                                <TradeCard trade={trade}/>
                            </SwiperSlide>
                        ))}
                    {sportsData?.length > 0 &&
                        sportsData.map((game) => (
                            <SwiperSlide key={game.id} className="h-full py-2">
                                <GameCard game={game}/>
                            </SwiperSlide>
                        ))}
                </Swiper>
            )}
            {/* Show message when no filters are selected */}
            {showEmptyMessage && (
                <div className="mt-4">
                    <div className="text-center py-8 text-gray-500">
                        Select finance or sports options to see data
                    </div>
                </div>
            )}
        </div>
    );
});