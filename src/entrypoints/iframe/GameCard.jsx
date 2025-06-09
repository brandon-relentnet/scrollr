import {LockOpenIcon, LockClosedIcon} from "@heroicons/react/24/solid";
import {useState, useEffect} from "react";
import {useSelector} from "react-redux";

export default function GameCard({game}) {
    const [pinned, setPinned] = useState(false);
    const layout = useSelector((state) => state.layout?.mode || 'compact');

    // Determine if minimal mode should be used based on layout
    // 'compact' = minimal/condensed layout, 'comfort' = spacious layout
    const isMinimal = layout === 'compact';

    const getStatusColor = (state) => {
        switch (state) {
            case 'pre':
                return 'bg-accent text-accent-content';
            case 'in':
                return 'bg-success text-success-content';
            case 'post':
                return 'bg-error text-error-content';
            default:
                return 'bg-error text-error-content';
        }
    };

    const getStatusText = (state, detail) => {
        switch (state) {
            case 'pre':
                return 'Upcoming';
            case 'in':
                return detail || 'Live';
            case 'post':
                return 'Final';
            default:
                return state;
        }
    };

    const handlePinClick = (e) => {
        e.stopPropagation();
        setPinned(!pinned);
    };

    const isLive = game.state === 'in';

    const StatusContent = () => (
        <div className={`flex items-center justify-evenly gap-2 ${isMinimal ? 'flex-row-reverse' : ''}`}>
            {isLive ? (
                <>
                    <div className="inline-grid *:[grid-area:1/1] mr-1">
                        <div className="status status-success animate-ping"></div>
                        <div className="status status-success"></div>
                    </div>
                    <span className={`text-base-content/70 font-semibold ${isMinimal ? 'text-xs' : ''}`}>LIVE</span>
                </>
            ) : (
                <div
                    className={`${!isMinimal ? 'tooltip-right' : 'tooltip-left'} tooltip tooltip-primary`}
                    data-tip={game.start_time ? new Date(game.start_time).toLocaleString() + ' ' + game.league : ''}
                >
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(game.state)}`}>
                            {getStatusText(game.state, game.short_detail)}
                        </span>
                </div>
            )}
        </div>
    );

    return (
        <div className={`card bg-base-100 cursor-pointer shadow-sm h-full overflow-hidden transition-all duration-200 ${
            isMinimal ? 'hover:shadow-md' : 'hover:shadow-lg'
        }`}
             onClick={() => window.open(game.link, '_blank')}>
            <div className={`card-body items-center transition-all duration-200 ${
                isMinimal ? 'p-2 flex-row' : 'p-4'
            }`}>

                {/* Main Content Area */}
                <div className={`${isMinimal ? 'flex-1' : 'w-full'}`}>
                    {/* Header for comfort mode */}
                    {!isMinimal && (
                        <div className="flex justify-between items-start mb-4">
                            <StatusContent/>
                            <div className="flex items-center space-x-2">
                                <label className="swap swap-rotate cursor-pointer hover:scale-110 transition-transform" onClick={(e) => e.stopPropagation()}>
                                    <input type="checkbox" checked={pinned} onChange={handlePinClick}/>
                                    <LockOpenIcon className="swap-off size-4"/>
                                    <LockClosedIcon className="swap-on size-4"/>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Game Details */}
                    <div className={`${isMinimal ? 'flex items-center divide-x-2 divide-base-content/10' : 'divide-y-2 divide-base-content/10'}`}>
                        {/* Away Team */}
                        <div className={`flex items-center justify-between ${
                            isMinimal ? 'pr-2 mr-2' : 'pb-2 mb-2'
                        }`}>
                            <div className={`flex items-center gap-2 ${isMinimal ? 'flex-row-reverse' : ''}`}>
                                <img
                                    src={game.away_team_logo}
                                    alt={game.away_team_name}
                                    className={`transition-all duration-200 ${isMinimal ? 'size-5' : 'size-7'}`}
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                                <span className={`font-medium transition-all duration-200 ${
                                    isMinimal ? 'text-sm' : 'text-base'
                                }`}>{game.away_team_name}</span>
                            </div>
                            <span className={`font-bold transition-all duration-200 ${
                                isMinimal ? 'text-base ml-1' : 'text-xl'
                            }`}>{game.away_team_score}</span>
                        </div>

                        {/* Home Team */}
                        <div className={`flex items-center justify-between ${
                            isMinimal ? 'flex-row-reverse pl-2 ml-2' : 'pt-2'
                        }`}>
                            <div className={`flex items-center gap-2 ${isMinimal ? 'flex-row-reverse' : ''}`}>
                                <img
                                    src={game.home_team_logo}
                                    alt={game.home_team_name}
                                    className={`transition-all duration-200 ${isMinimal ? 'size-5' : 'size-7'}`}
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                                <span className={`font-medium text-base-content transition-all duration-200 ${
                                    isMinimal ? 'text-sm' : 'text-base'
                                }`}>{game.home_team_name}</span>
                            </div>
                            <span className={`font-bold text-base-content transition-all duration-200 ${
                                isMinimal ? 'text-base mr-1' : 'text-xl'
                            }`}>{game.home_team_score}</span>
                        </div>
                    </div>
                </div>

                {/* Side Header for compact mode */}
                {isMinimal && (
                    <div className="flex items-center justify-between ml-2 gap-2">
                        <StatusContent/>
                        <label className="swap swap-rotate cursor-pointer hover:scale-110 transition-transform" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" checked={pinned} onChange={handlePinClick}/>
                            <LockOpenIcon className="swap-off size-3"/>
                            <LockClosedIcon className="swap-on size-3"/>
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
};