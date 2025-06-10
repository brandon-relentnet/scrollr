import {LockOpenIcon, LockClosedIcon, InformationCircleIcon} from "@heroicons/react/24/solid";
import {useState} from "react";
import {useSelector} from "react-redux";

export default function GameCard({game}) {
    const [pinned, setPinned] = useState(false);
    const layout = useSelector((state) => state.layout?.mode || 'compact');
    const isMinimal = layout === 'compact';
    const isLive = game.state === 'in';

    // Centralized styling configuration
    const styles = {
        minimal: {
            card: 'h-14',
            cardBody: 'py-2 px-2 flex-row justify-evenly',
            statusContainer: 'absolute top-1 left-1',
            statusText: 'text-xs',
            statusButton: '',
            statusIndicatorMargin: 'mr-1',
            gameDetails: 'flex items-center divide-x-2 divide-base-content/10',
            awayTeam: 'pr-2 mr-2',
            homeTeam: 'flex-row-reverse',
            teamScore: 'text-base',
            awayScore: 'ml-1',
            homeScore: 'mr-1',
            pinButton: 'absolute group-hover:visible px-2 invisible top-0 right-0 my-1.5 mx-2 btn swap swap-rotate cursor-pointer hover:scale-110'
        },
        comfort: {
            card: 'h-40',
            cardBody: 'justify-center p-4',
            statusContainer: '',
            statusText: '',
            statusButton: 'btn btn-outline',
            statusIndicatorMargin: '',
            gameDetails: 'divide-y-2 divide-base-content/10',
            awayTeam: 'mb-1 pb-1',
            homeTeam: '',
            teamScore: 'text-xl',
            awayScore: '',
            homeScore: '',
            pinButton: 'group-hover:visible invisible swap swap-rotate cursor-pointer hover:scale-110 transition-transform'
        }
    };

    const currentStyles = isMinimal ? styles.minimal : styles.comfort;

    const getStatusClasses = (state) => ({
        icon: state === 'pre' ? 'text-primary/30 hover:text-primary' : state === 'in' ? 'text-success' : 'text-error',
        button: state === 'pre' ? 'btn-primary' : state === 'in' ? 'btn-success' : 'btn-error',
        text: state === 'pre' ? 'Upcoming' : state === 'in' ? 'Live' : 'Final',
    });

    const handlePinClick = (e) => {
        e.stopPropagation();
        setPinned(!pinned);
    };

    const StatusContent = () => {
        const {icon, button, text} = getStatusClasses(game.state);
        const tooltipContent = game.start_time
            ? `${new Date(game.start_time).toLocaleString()} - ${game.league}`
            : '';

        return (
            <div className={`${currentStyles.statusContainer} flex items-center justify-evenly gap-2`}>
                {isLive ? (
                    <span className={`text-base-content/70 group font-bold ${currentStyles.statusText}`}>
                        <div className="tooltip-right tooltip tooltip-primary" data-tip={tooltipContent}>
                            <button className={`${button} ${currentStyles.statusButton} cursor-default`}>
                                <div
                                    className={`ml-2 inline-grid *:[grid-area:1/1] ${currentStyles.statusIndicatorMargin}`}>
                                    <div className="status status-primary animate-ping"></div>
                                    <div className="status status-primary"></div>
                                </div>
                                {text}
                            </button>
                        </div>
                    </span>
                ) : !isMinimal ? (
                    <div className="tooltip-right tooltip tooltip-primary" data-tip={tooltipContent}>
                        <button className={`${button} ${currentStyles.statusButton} cursor-default`}>
                            {text}
                        </button>
                    </div>
                ) : (
                    <div className="tooltip-right tooltip tooltip-primary" data-tip={tooltipContent}>
                        <InformationCircleIcon className={`size-6 ${icon}`}/>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            className={`card bg-base-200 group cursor-pointer card-border border-base-300 transition duration-150 ${currentStyles.card}`}
            onClick={() => window.open(game.link, '_blank')}
        >
            <div className={`card-body flex ${currentStyles.cardBody}`}>
                {/* Header for comfort mode */}
                {!isMinimal ? (
                    <div className="flex justify-between items-start">
                        <StatusContent/>
                        <div className="flex items-center space-x-2">
                            <label
                                className={currentStyles.pinButton}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <input type="checkbox" checked={pinned} onChange={handlePinClick}/>
                                <LockOpenIcon className="swap-off size-5"/>
                                <LockClosedIcon className="swap-on size-5"/>
                            </label>
                        </div>
                    </div>
                ) : (
                    <StatusContent/>
                )}

                {/* Game Details */}
                <div className={currentStyles.gameDetails}>
                    {/* Away Team */}
                    <div className={`flex items-center justify-between ${currentStyles.awayTeam}`}>
                        <div className={`flex items-center gap-2 ${isMinimal ? 'flex-row-reverse' : ''}`}>
                            <img
                                src={game.away_team_logo}
                                alt={game?.away_team_name}
                                className="size-8"
                                onError={(e) => e.target.style.display = 'none'}
                            />
                            <span className="font-semibold">{game.away_team_name}</span>
                        </div>
                        <span className={`font-bold ${currentStyles.teamScore} ${currentStyles.awayScore}`}>
                            {game.away_team_score}
                        </span>
                    </div>

                    {/* Home Team */}
                    <div className={`flex items-center justify-between ${currentStyles.homeTeam}`}>
                        <div className="flex items-center gap-2">
                            <img
                                src={game.home_team_logo}
                                alt={game.home_team_name}
                                className="size-8"
                                onError={(e) => e.target.style.display = 'none'}
                            />
                            <span className="font-semibold">{game.home_team_name}</span>
                        </div>
                        <span
                            className={`font-bold text-base-content ${currentStyles.teamScore} ${currentStyles.homeScore}`}>
                            {game.home_team_score}
                        </span>
                    </div>
                </div>

                {/* Side Header for compact mode */}
                {isMinimal && (
                    <label
                        className={currentStyles.pinButton}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <input type="checkbox" checked={pinned} onChange={handlePinClick}/>
                        <LockOpenIcon className="swap-off size-5"/>
                        <LockClosedIcon className="swap-on size-5 !text-secondary"/>
                    </label>
                )}
            </div>
        </div>
    );
};