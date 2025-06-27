import { BoltIcon, BoltSlashIcon, PowerIcon } from "@heroicons/react/24/solid";
import { useSelector, useDispatch } from "react-redux";
import {
  setLayout,
  toggleSpeed,
  togglePosition,
} from "@/entrypoints/store/layoutSlice";
import { togglePower } from "@/entrypoints/store/powerSlice";
import AnimatedSpeedToggle from "@/entrypoints/components/controls/AnimatedSpeedToggle";
import PositionToggle from "@/entrypoints/components/controls/PositionToggle";
import LayoutToggle from "@/entrypoints/components/controls/LayoutToggle";

export default function PowerTab() {
  const dispatch = useDispatch();

  const layout = useSelector((state) => state.layout?.mode || "compact");
  const speed = useSelector((state) => state.layout?.speed || "classic");
  const position = useSelector((state) => state.layout?.position || "top");
  const power = useSelector((state) => state.power?.mode !== false);

  const handleLayoutChange = () => {
    const newLayout = layout === "compact" ? "comfort" : "compact";
    dispatch(setLayout(newLayout));
    browser.runtime.sendMessage({
      type: "LAYOUT_CHANGED",
      layout: newLayout,
    });
  };

  const handlePowerToggle = () => {
    dispatch(togglePower());
    browser.runtime.sendMessage({
      type: "POWER_TOGGLED",
      power: !power,
    });
  };

  const handleSpeedToggle = () => {
    dispatch(toggleSpeed());
    const newSpeed =
      speed === "slow" ? "classic" : speed === "classic" ? "fast" : "slow";
    browser.runtime.sendMessage({
      type: "SPEED_CHANGED",
      speed: newSpeed,
    });
  };

  const handlePositionToggle = () => {
    dispatch(togglePosition());
    const newPosition = position === "top" ? "bottom" : "top";
    browser.runtime.sendMessage({
      type: "POSITION_CHANGED",
      position: newPosition,
    });
  };

  return (
    <>
      <label className="tab">
        <input
          type="radio"
          name="my_tabs_3"
          className="tab"
          aria-label="Tab 3"
          defaultChecked
        />
        <PowerIcon className="size-8" />
      </label>
      <div className="tab-content bg-base-100 border-base-300 p-6">
        <div className="flex flex-col items-center justify-center">
          <label
            className={`swap swap-rotate btn btn-ghost btn-circle p-6 size-50 transition-colors duration-150 ${
              !power
                ? "text-base-content/30 hover:text-base-content/70"
                : "text-primary"
            }`}
          >
            <input
              type="checkbox"
              onChange={handlePowerToggle}
              checked={!power}
            />
            <BoltSlashIcon className="swap-on size-full transition-colors duration-150" />
            <BoltIcon className="swap-off size-full transition-colors duration-150" />
          </label>
          <ul className="flex items-center justify-center shadow-sm hover:shadow-md transition duration-150 gap-6 px-5 p-3 bg-base-200 rounded-box mt-6">
            <li>
              <PositionToggle
                position={position}
                layout={layout}
                onChange={handlePositionToggle}
                showLabel={false}
                className="tooltip"
              />
            </li>
            <AnimatedSpeedToggle
              speed={speed}
              onSpeedToggle={handleSpeedToggle}
              className="tooltip"
            />
            <li>
              <LayoutToggle
                layout={layout}
                position={position}
                onChange={() => handleLayoutChange()}
                showLabel={false}
                className="tooltip"
              />
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
