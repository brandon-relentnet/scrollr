import React from 'react';
import { Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

const breakpointsArray = {};
const startBreakpoint = 0;
const endBreakpoint = 8000;
const breakpointStep = 320;
for (let i = startBreakpoint; i <= endBreakpoint; i += breakpointStep) {
    breakpointsArray[i] = {
        slidesPerView: Math.floor(i / 320),
    };
}

const SLIDE_COUNT = 15
const SLIDES = [...Array(SLIDE_COUNT)].map((_, i) => i)

export function Carousel() {
    return (
        <div className="flex-grow h-full overflow-hidden">
            <Swiper
                //modules={[Autoplay]}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                breakpointsBase={'container'}
                loop={true}
                speed={600}
                spaceBetween={8}
                breakpoints={breakpointsArray}
                watchSlidesProgress={true}
                className='h-full'
            >
                <>
                    {SLIDES.map((i) => (
                        <SwiperSlide key={i} className='h-full py-2'>
                            <div className="card bg-base-100 shadow-sm h-full">
                                <div className="card-body">

                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </>
            </Swiper>
        </div>
    )
}
