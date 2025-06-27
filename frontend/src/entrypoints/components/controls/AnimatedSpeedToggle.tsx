import React, { useState } from "react";
import { TurtleIcon, WalkingIcon, RunningIcon } from "../icons/SpeedIcons";

interface AnimatedSpeedToggleProps {
  speed: "slow" | "classic" | "fast";
  onSpeedToggle: () => void;
}

const AnimatedSpeedToggle = ({
  speed,
  onSpeedToggle,
}: AnimatedSpeedToggleProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setTimeout(() => {
      onSpeedToggle();
    }, 15);

    setTimeout(() => {
      setIsAnimating(false);
    }, 150);
  };

  return (
    <li>
      <button
        onClick={handleClick}
        className="tooltip relative mt-2"
        data-tip={`Speed: ${speed.charAt(0).toUpperCase() + speed.slice(1)}`}
      >
        <div className="relative group size-12">
          {/* Slow Speed - Turtle */}
          <div
            className={`absolute inset-0 group-hover:scale-115 group-active:scale-85 transition-all duration-150 ${
              speed === "slow" ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
          >
            <label className="cursor-pointer flex items-center flex-col flex-1 text-base-content">
              <span className="label-text">
                <TurtleIcon />
              </span>
            </label>
          </div>

          {/* Classic Speed - Walking */}
          <div
            className={`absolute inset-0 group-hover:scale-115 group-active:scale-85 transition-all duration-150 ${
              speed === "classic"
                ? "opacity-100 scale-100"
                : "opacity-0 scale-75"
            }`}
          >
            <label className="cursor-pointer flex items-center flex-col flex-1 text-base-content">
              <span className="label-text">
                <WalkingIcon />
              </span>
            </label>
          </div>

          {/* Fast Speed - Running */}
          <div
            className={`absolute inset-0 group-hover:scale-115 group-active:scale-85 transition-all duration-150 ${
              speed === "fast" ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
          >
            <label className="cursor-pointer flex items-center flex-col flex-1 text-base-content">
              <span className="label-text">
                <RunningIcon />
              </span>
            </label>
          </div>
        </div>
      </button>
    </li>
  );
};

export default AnimatedSpeedToggle;
