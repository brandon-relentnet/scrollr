import {LockOpenIcon, LockClosedIcon, InformationCircleIcon} from "@heroicons/react/24/solid";
import {useState} from "react";
import {useSelector} from "react-redux";

export default function GameCard({game}) {
    const [pinned, setPinned] = useState(false);
    const layout = useSelector((state) => state.layout?.mode || 'compact');

    // Determine if minimal mode should be used based on layout
    const isMinimal = layout === 'compact';

    const getStatusIcon = (state) => {
        switch (state) {
            case 'pre':
                return `text-accent/30 hover:text-accent`;
            case 'in':
                return `text-success`;
            case 'post':
                return `text-error`;
            default:
                return `text-error`;
        }
    }

    // Function to get the status text based on game state
    const getStatusBtn = (state) => {
        switch (state) {
            case 'pre':
                return `btn-accent`;
            case 'in':
                return `btn-primary`;
            case 'post':
                return `btn-error`;
            default:
                return `btn-error`;
        }
    }

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
        <div className={`${isMinimal ? 'absolute top-1 left-1' : ''} flex items-center justify-evenly gap-2`}>
            {isLive ? (<>

                        <span className={`text-base-content/70 group font-bold ${isMinimal ? 'text-xs' : ''}`}>
                            <div
                                className={`tooltip-right tooltip tooltip-primary`}
                                data-tip={game.start_time ? new Date(game.start_time).toLocaleString() + ' - ' + game.league : ''}
                            >
                                <button
                                    className={`${getStatusBtn(game.state)} ${isMinimal ? '' : 'btn btn-outline'} cursor-default`}>
                                    <div className={`ml-2 inline-grid *:[grid-area:1/1] ${isMinimal ? 'mr-1' : ''}`}>
                                        <div className="status status-primary animate-ping"></div>
                                        <div className="status status-primary"></div>
                                    </div>
                                    {getStatusText(game.state, game.short_detail)}
                                </button>
                            </div>
                        </span>
                </>) : (<div
                    className={`tooltip-right tooltip tooltip-primary`}
                    data-tip={game.start_time ? new Date(game.start_time).toLocaleString() + ' - ' + game.league : ''}
                >
                    {!isMinimal ? <button
                            className={`${getStatusBtn(game.state)} btn btn-outline cursor-default`}>{getStatusText(game.state, game.short_detail)}</button> :
                        <InformationCircleIcon className={`size-6 ${getStatusIcon(game.state)}`}
                        />}
                </div>)}
        </div>);

    return (<div
            className={`card group bg-base-100 cursor-pointer hover:border-primary border-transparent border-2 transition duration-150 ${isMinimal ? 'h-14 ' : 'h-40'}`}
            onClick={() => window.open(game.link, '_blank')}>
            <div
                className={`card-body flex  ${isMinimal ? 'py-2 px-2 flex-row justify-evenly' : 'justify-center p-4'}`}>
                {/* Header for comfort mode */}
                {!isMinimal ? (<div className="flex justify-between items-start">
                        <StatusContent/>
                        <div className="flex items-center space-x-2">
                            <label className="group-hover:visible invisible swap swap-rotate cursor-pointer hover:scale-110 transition-transform"
                                   onClick={(e) => e.stopPropagation()}>
                                <input type="checkbox" checked={pinned} onChange={handlePinClick}/>
                                <LockOpenIcon className="swap-off size-5"/>
                                <LockClosedIcon className="swap-on size-5"/>
                            </label>
                        </div>
                    </div>) : (<StatusContent/>)}

                {/* Game Details */}
                <div
                    className={`${isMinimal ? 'flex items-center divide-x-2 divide-base-content/10' : 'divide-y-2 divide-base-content/10'}`}>
                    {/* Away Team */}
                    <div className={`flex items-center justify-between ${isMinimal ? 'pr-2 mr-2' : 'mb-1 pb-1'}`}>
                        <div className={`flex items-center gap-2 ${isMinimal ? 'flex-row-reverse' : ''}`}>
                            <img
                                src={game.away_team_logo}
                                alt={game?.away_team_name}
                                className={`size-8`}
                                onError={(e) => e.target.style.display = 'none'}
                            />
                            <span className={`font-semibold`}>{game.away_team_name}</span>
                        </div>
                        <span
                            className={`font-bold ${isMinimal ? 'text-base ml-1' : 'text-xl'}`}>{game.away_team_score}</span>
                    </div>

                    {/* Home Team */}
                    <div className={`flex items-center justify-between ${isMinimal ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-2`}>
                            <img
                                src={game.home_team_logo}
                                alt={game.home_team_name}
                                className={`size-8`}
                                onError={(e) => e.target.style.display = 'none'}
                            />
                            <span className={`font-semibold`}>{game.home_team_name}</span>
                        </div>
                        <span
                            className={`font-bold text-base-content ${isMinimal ? 'text-base mr-1' : 'text-xl'}`}>{game.home_team_score}</span>
                    </div>
                </div>

                {/* Side Header for compact mode */}
                {isMinimal && (<label
                        className="absolute group-hover:visible px-2 invisible top-0 right-0 my-1.5 mx-2 btn swap swap-rotate cursor-pointer hover:scale-110"
                        onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={pinned} onChange={handlePinClick}/>
                        <LockOpenIcon className="swap-off size-5"/>
                        <LockClosedIcon className="swap-on size-5 !text-secondary"/>
                    </label>)}
            </div>
        </div>);
};