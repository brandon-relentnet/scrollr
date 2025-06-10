import {Autoplay} from 'swiper/modules';
import {Swiper, SwiperSlide} from 'swiper/react';
import 'swiper/css';
import GameCard from './GameCard';
import TradeCard from './TradeCard';
import useSportsData from './useSportsData';
import useFinanceData from './useFinanceData';

const breakpointsArray = {};
const startBreakpoint = 0;
const endBreakpoint = 8000;
const breakpointStep = 320;
for (let i = startBreakpoint; i <= endBreakpoint; i += breakpointStep) {
    breakpointsArray[i] = {
        slidesPerView: Math.floor(i / 320),
    };
}

export function Carousel() {
    // Use both custom hooks to get data
    const {sportsData, connectionStatus: sportsConnectionStatus, hasActiveSportsToggles} = useSportsData();
    const {tradesData, connectionStatus: financeConnectionStatus, hasFinanceFilters} = useFinanceData();

    return (
        <div className="flex-grow overflow-hidden">
            {(tradesData?.data?.length > 0 || sportsData?.length > 0) && (
                <Swiper
                    modules={[Autoplay]}
                    autoplay={{delay: 3000, disableOnInteraction: false}}
                    breakpointsBase={'container'}
                    loop={true}
                    speed={600}
                    spaceBetween={8}
                    breakpoints={breakpointsArray}
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
            {!hasFinanceFilters && !hasActiveSportsToggles && (
                <div className="mt-4">
                    <div className="text-center py-8 text-gray-500">
                        Select finance or sports options to see data
                    </div>
                </div>
            )}
        </div>
    )
}