// Format game data for better display
import React from "react";
import { SwiperSlide } from 'swiper/react';

export default function GameCard({ game }) {
    const getStatusColor = (state) => {
            switch(state) {
                case 'pre': return 'bg-blue-100 text-blue-800';
                case 'in': return 'bg-green-100 text-green-800';
                case 'post': return 'bg-gray-100 text-gray-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        };

        const getStatusText = (state, detail) => {
            switch(state) {
                case 'pre': return 'Upcoming';
                case 'in': return detail || 'Live';
                case 'post': return 'Final';
                default: return state;
            }
        };

        console.log('GameCard rendered with:', { game });

        return (
            <>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-semibold text-gray-500">{game.league}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(game.state)}`}>
                                {getStatusText(game.state, game.short_detail)}
                            </span>
                        </div>

                        <div className="space-y-2">
                            {/* Away Team */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <img
                                        src={game.away_team_logo}
                                        alt={game.away_team_name}
                                        className="w-6 h-6"
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                    <span className="font-medium">{game.away_team_name}</span>
                                </div>
                                <span className="text-lg font-bold">{game.away_team_score}</span>
                            </div>

                            {/* Home Team */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <img
                                        src={game.home_team_logo}
                                        alt={game.home_team_name}
                                        className="w-6 h-6"
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                    <span className="font-medium">{game.home_team_name}</span>
                                </div>
                                <span className="text-lg font-bold">{game.home_team_score}</span>
                            </div>
                        </div>

                        {game.start_time && (
                            <div className="mt-2 text-xs text-gray-500">
                                {new Date(game.start_time).toLocaleString()}
                            </div>
                        )}
            </>
        );
    };
