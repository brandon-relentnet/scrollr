import {LockOpenIcon, LockClosedIcon} from "@heroicons/react/24/solid";
import {useState} from "react";

export default function GameCard({game}) {
    const [pinned, setPinned] = useState(false);
    const [minimal, setMinimal] = useState(true);

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
        <div className={`flex items-center justify-evenly gap-2 ${minimal ? 'flex-row-reverse' : ''}`}>
            {isLive ? (
                <>
                    <div className="inline-grid *:[grid-area:1/1] mr-1">
                        <div className="status status-success animate-ping"></div>
                        <div className="status status-success"></div>
                    </div>
                    <span className={`text-base-content/70 font-semibold ${minimal ? 'text-xs' : ''}`}>LIVE</span>
                </>
            ) : (
                <div
                    className={`${!minimal ? 'tooltip-right' : 'tooltip-left'} tooltip tooltip-primary`}
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
        <div className="card bg-base-100 cursor-pointer shadow-sm h-full overflow-hidden"
             onClick={() => window.open(game.link, '_blank')}>
            <div className={`card-body p-3 items-center ${minimal ? 'flex-row' : ''}`}>

                {/* Main Content Area */}
                <div className={`${minimal ? 'flex-1' : 'w-full'}`}>
                    {/* Header for non-minimal mode */}
                    {!minimal && (
                        <div className="flex justify-between items-start mb-3">
                            <StatusContent/>
                            <div className="flex items-center space-x-2">
                                <label className="swap swap-rotate cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                    <input type="checkbox" checked={pinned} onChange={handlePinClick}/>
                                    <LockOpenIcon className="swap-off size-4"/>
                                    <LockClosedIcon className="swap-on size-4"/>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Game Details */}
                    <div className={`${minimal ? 'flex items-center divide-x-2 divide-base-content/10' : 'divide-y-2 divide-base-content/10'}`}>
                        {/* Away Team */}
                        <div className={`flex items-center justify-between ${minimal ? 'pr-2 mr-2' : ''}`}>
                            <div className={`flex items-center gap-2 ${minimal ? 'flex-row-reverse' : ''}`}>
                                <img
                                    src={game.away_team_logo}
                                    alt={game.away_team_name}
                                    className="size-6"
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                                <span className={`font-medium ${minimal ? 'text-sm' : ''}`}>{game.away_team_name}</span>
                            </div>
                            <span
                                className={`font-bold ${minimal ? 'text-base ml-2' : 'text-lg'}`}>{game.away_team_score}</span>
                        </div>

                        {/* Home Team */}
                        <div className={`flex items-center justify-between ${minimal ? 'flex-row-reverse' : ''}`}>
                            <div className="flex items-center space-x-2">
                                <img
                                    src={game.home_team_logo}
                                    alt={game.home_team_name}
                                    className="size-6"
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                                <span
                                    className={`font-medium text-base-content ${minimal ? 'text-sm' : ''}`}>{game.home_team_name}</span>
                            </div>
                            <span
                                className={`font-bold text-base-content ${minimal ? 'text-base mr-2' : 'text-lg'}`}>{game.home_team_score}</span>
                        </div>
                    </div>
                </div>

                {/* Side Header for minimal mode */}
                {minimal && (
                    <div className="flex items-center justify-between ml-3 gap-2">
                        <StatusContent/>
                        <label className="swap swap-rotate cursor-pointer" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" checked={pinned} onChange={handlePinClick}/>
                            <LockOpenIcon className="swap-off size-4"/>
                            <LockClosedIcon className="swap-on size-4"/>
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
};