import {
  LockOpenIcon,
  LockClosedIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
import { memo, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  addPinnedItem,
  removePinnedItem,
  selectIsItemPinned,
} from "../store/pinnedSlice.js";

// Status map moved outside component to prevent recreation
const STATUS_MAP = {
  pre: {
    icon: "text-primary/70 hover:text-primary",
    badge: "badge-primary bg-primary/70 hover:bg-primary",
    text: "Upcoming",
    btn: "btn-primary",
  },
  in: {
    icon: "text-success",
    badge: "badge-success",
    text: "Live",
    btn: "btn-success",
  },
  post: {
    icon: "text-error",
    badge: "badge-error",
    text: "Final",
    btn: "btn-error",
  },
};

function GameCard({ game }) {
  const dispatch = useDispatch();
  const layout = useSelector((state) => state.layout?.mode || "compact");
  const isPinned = useSelector((state) =>
    selectIsItemPinned(state, "sports", game.id)
  );

  // Memoized computations
  const isCompact = useMemo(() => layout === "compact", [layout]);
  const isLive = useMemo(() => game.state === "in", [game.state]);
  const status = useMemo(
    () => STATUS_MAP[game.state] || STATUS_MAP.post,
    [game.state]
  );

  // Expensive date formatting memoized
  const tooltipContent = useMemo(() => {
    if (!game.start_time) return "";
    return `${new Date(game.start_time).toLocaleString()} - ${game.league}`;
  }, [game.start_time, game.league]);

  // Memoized event handlers
  const handlePinClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (isPinned) {
        dispatch(removePinnedItem({ type: "sports", id: game.id }));
      } else {
        dispatch(addPinnedItem({ type: "sports", data: game }));
      }
    },
    [isPinned, dispatch, game]
  );

  const handleImageError = useCallback((e) => {
    e.target.style.display = "none";
  }, []);

  const handleCardClick = useCallback(() => {
    window.open(game.link, "_blank");
  }, [game.link]);

  const StatusDisplay = () => (
    <div
      className="tooltip tooltip-primary tooltip-right"
      data-tip={tooltipContent}
    >
      {isCompact ? (
        // Compact mode
        isLive ? (
          <div
            className={`badge ${status.badge} gap-1 text-xs font-semibold px-2 py-1`}
          >
            <div className="flex items-center">
              <div className="relative">
                <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-current rounded-full absolute top-0 animate-ping"></div>
              </div>
            </div>
            {status.text}
          </div>
        ) : (
          <InformationCircleIcon className={`size-5 ${status.icon}`} />
        )
      ) : // Comfort mode
      isLive ? (
        <div
          className={`badge ${status.badge} gap-2 text-sm font-semibold px-3 py-2`}
        >
          <div className="flex items-center">
            <div className="relative">
              <div className="w-2 h-2 bg-current rounded-full"></div>
              <div className="w-2 h-2 bg-current rounded-full absolute top-0 animate-ping"></div>
            </div>
          </div>
          {status.text}
        </div>
      ) : (
        <div
          className={`badge ${status.badge} text-sm font-semibold px-3 py-2`}
        >
          {status.text}
        </div>
      )}
    </div>
  );
  const PinButton = () => (
    <label
      className={`swap swap-rotate cursor-pointer hover:scale-110 transition-transform ${
        isCompact
          ? "absolute group-hover:visible px-2 invisible top-0 right-0 my-1.5 mx-2 btn btn-ghost btn-sm"
          : "group-hover:visible invisible btn btn-ghost btn-sm"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <input type="checkbox" checked={isPinned} onChange={handlePinClick} />
      <LockOpenIcon className="swap-off size-4" />
      <LockClosedIcon className="swap-on size-4" />
    </label>
  );

  if (isCompact) {
    return (
      <div
        className="card bg-base-200 group cursor-pointer border border-base-300 transition duration-150 h-14"
        onClick={handleCardClick}
      >
        <div className="card-body py-2 px-2 flex-row justify-evenly">
          <div className="absolute top-1 left-1 flex items-center justify-evenly gap-2">
            <StatusDisplay />
          </div>

          <div className="flex items-center divide-x-2 divide-base-content/10">
            {/* Away Team */}
            <div className="flex items-center justify-between pr-2 mr-2">
              <div className="flex items-center gap-2 flex-row-reverse">
                <img
                  src={game.away_team_logo}
                  alt={game.away_team_name}
                  className="size-8"
                  onError={handleImageError}
                />
                <span className="font-semibold">{game.away_team_name}</span>
              </div>
              <span className="font-bold text-base ml-1">
                {game.away_team_score}
              </span>
            </div>

            {/* Home Team */}
            <div className="flex items-center justify-between flex-row-reverse">
              <div className="flex items-center gap-2">
                <img
                  src={game.home_team_logo}
                  alt={game.home_team_name}
                  className="size-8"
                  onError={handleImageError}
                />
                <span className="font-semibold">{game.home_team_name}</span>
              </div>
              <span className="font-bold text-base mr-1">
                {game.home_team_score}
              </span>
            </div>
          </div>
          <PinButton />
        </div>
      </div>
    );
  }

  // Comfort Mode
  return (
    <div
      className="card bg-base-200 group cursor-pointer card-border border-base-300 hover:border-base-content/20 transition-all duration-150 h-40 shadow-sm hover:shadow-md"
      onClick={handleCardClick}
    >
      <div className="card-body flex justify-center gap-0 p-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <StatusDisplay />
          {game.short_detail}
          <PinButton />
        </div>

        {/* Teams Container */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Away Team */}
          <div className="flex items-center justify-between p-2 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="avatar">
                <div className="w-10 rounded">
                  <img
                    src={game.away_team_logo}
                    alt={game.away_team_name}
                    onError={handleImageError}
                  />
                </div>
              </div>
              <div>
                <div className="font-semibold text-base">
                  {game.away_team_name}
                </div>
                <div className="text-xs text-base-content/60 italic">Away</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{game.away_team_score}</div>
            </div>
          </div>

          {/* Home Team */}
          <div className="flex items-center justify-between p-2 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="avatar">
                <div className="w-10 rounded">
                  <img
                    src={game.home_team_logo}
                    alt={game.home_team_name}
                    onError={handleImageError}
                  />
                </div>
              </div>
              <div>
                <div className="font-semibold text-base">
                  {game.home_team_name}
                </div>
                <div className="text-xs text-base-content/60 italic">Home</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{game.home_team_score}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoized export with custom comparison
export default memo(GameCard, (prevProps, nextProps) => {
  const prev = prevProps.game;
  const next = nextProps.game;

  // Only re-render if key game properties change
  return (
    prev.id === next.id &&
    prev.state === next.state &&
    prev.away_team_score === next.away_team_score &&
    prev.home_team_score === next.home_team_score &&
    prev.start_time === next.start_time
  );
});
