import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  BoltIcon,
  BoltSlashIcon,
  ClockIcon,
  PowerIcon,
  ViewColumnsIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/solid";
import { useSelector, useDispatch } from "react-redux";
import {
  setLayout,
  toggleSpeed,
  togglePosition,
} from "@/entrypoints/store/layoutSlice";
import { togglePower } from "@/entrypoints/store/powerSlice";
import AnimatedSpeedToggle from "./AnimatedSpeedToggle";

export default function PowerTab() {
  const dispatch = useDispatch();
  const layout = useSelector((state) => {
    return state.layout?.mode || "compact";
  });
  const speed = useSelector((state) => {
    return state.layout?.speed || "classic";
  });
  const position = useSelector((state) => {
    return state.layout?.position || "top";
  });
  const power = useSelector((state) => {
    return state.power?.mode !== false;
  });

  const handleLayoutChange = () => {
    const newLayout = layout === "compact" ? "comfort" : "compact";
    dispatch(setLayout(newLayout));

    // Also notify background script directly for immediate update
    browser.runtime.sendMessage({
      type: "LAYOUT_CHANGED",
      layout: newLayout,
    });
  };

  const handlePowerToggle = () => {
    dispatch(togglePower());

    // Also notify background script directly for immediate update
    browser.runtime.sendMessage({
      type: "POWER_TOGGLED",
      power: !power,
    });
  };

  const handleSpeedToggle = () => {
    dispatch(toggleSpeed());

    // Also notify background script directly for immediate update
    browser.runtime.sendMessage({
      type: "SPEED_CHANGED",
      speed:
        speed === "slow" ? "classic" : speed === "classic" ? "fast" : "slow",
    });
  };

  const handlePositionToggle = () => {
    dispatch(togglePosition());

    // Also notify background script directly for immediate update
    browser.runtime.sendMessage({
      type: "POSITION_CHANGED",
      position: position === "top" ? "bottom" : "top",
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
          <button
            onClick={handlePowerToggle}
            className={`btn btn-ghost btn-circle p-6 size-50 ${
              !power ? "text-error" : "text-success"
            }`}
          >
            {power ? <BoltIcon /> : <BoltSlashIcon />}
          </button>
          <ul
            className={`flex items-center justify-center gap-6 px-5 p-3 bg-base-200 rounded-box mt-6`}
          >
            <li>
              <label
                className="swap tooltip"
                data-tip={`Position: ${
                  position.charAt(0).toUpperCase() + position.slice(1)
                }`}
              >
                <input
                  type="checkbox"
                  onChange={handlePositionToggle}
                  checked={position === "bottom"}
                />
                <div
                  className={`flex flex-col size-12 relative card hover:shadow-lg shadow-md overflow-hidden hover:scale-115 active:scale-85 transition-all duration-150 ${
                    position === "top" ? "rotate-180" : "rotate-360"
                  }`}
                >
                  <div className="h-full bg-base-content flex items-center justify-center">
                    <ArrowDownIcon className="size-6 text-neutral-content" />
                  </div>
                  <div
                    className={`bg-primary transition-all duration-150 ${
                      layout === "compact" ? "h-1" : "h-1/3"
                    }`}
                  ></div>
                </div>
              </label>
            </li>
            <AnimatedSpeedToggle
              speed={speed}
              onSpeedToggle={handleSpeedToggle}
            />
            <li>
              <label
                className="swap tooltip"
                data-tip={`Layout: ${
                  layout.charAt(0).toUpperCase() + layout.slice(1)
                }`}
              >
                <input
                  type="checkbox"
                  onChange={(e) =>
                    handleLayoutChange(e.target.checked ? "compact" : "comfort")
                  }
                  checked={layout === "compact"}
                />
                <div className="flex items-center gap-2 group">
                  <div
                    className={`flex flex-col size-12 card group-hover:shadow-lg shadow-md overflow-hidden group-hover:scale-115 group-active:scale-85 transition-all duration-150 ${
                      position === "top" ? "rotate-180" : "rotate-360"
                    }`}
                  >
                    <div className="h-full bg-base-content flex items-center justify-center">
                      {layout === "compact" ? (
                        <ArrowsPointingOutIcon className="size-6 text-neutral-content" />
                      ) : (
                        <ArrowsPointingInIcon className="size-6 text-neutral-content" />
                      )}
                    </div>
                    <div
                      className={`bg-primary transition-all duration-150 ${
                        layout === "compact" ? "h-1" : "h-1/3"
                      }`}
                    ></div>
                  </div>
                </div>
              </label>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
