import {
    ArrowsPointingInIcon,
    ArrowsPointingOutIcon,
    BoltIcon,
    BoltSlashIcon,
    ClockIcon,
    PowerIcon,
    ViewColumnsIcon,
    ArrowUpIcon,
    ArrowDownIcon
} from "@heroicons/react/24/solid";
import { useSelector, useDispatch } from "react-redux";
import { setLayout, toggleSpeed, togglePosition } from "@/entrypoints/store/layoutSlice";
import { togglePower } from "@/entrypoints/store/powerSlice";

export default function PowerTab() {
    const dispatch = useDispatch();
    const layout = useSelector((state) => {
        return state.layout?.mode || 'compact';
    });
    const speed = useSelector((state) => {
        return state.layout?.speed || 'classic';
    });
    const position = useSelector((state) => {
        return state.layout?.position || 'top';
    });
    const power = useSelector((state) => {
        return state.power?.mode !== false;
    });

    const handleLayoutChange = () => {
        const newLayout = layout === 'compact' ? 'comfort' : 'compact';
        dispatch(setLayout(newLayout));

        // Also notify background script directly for immediate update
        browser.runtime.sendMessage({
            type: 'LAYOUT_CHANGED',
            layout: newLayout
        });
    }

    const handlePowerToggle = () => {
        dispatch(togglePower());

        // Also notify background script directly for immediate update
        browser.runtime.sendMessage({
            type: 'POWER_TOGGLED',
            power: !power
        });
    };

    const handleSpeedToggle = () => {
        dispatch(toggleSpeed());

        // Also notify background script directly for immediate update
        browser.runtime.sendMessage({
            type: 'SPEED_CHANGED',
            speed: speed === 'slow' ? 'classic' : speed === 'classic' ? 'fast' : 'slow'
        });
    };

    const handlePositionToggle = () => {
        dispatch(togglePosition());

        // Also notify background script directly for immediate update
        browser.runtime.sendMessage({
            type: 'POSITION_CHANGED',
            position: position === 'top' ? 'bottom' : 'top'
        });
    };

    return (
        <>
            <label className="tab">
                <input type="radio" name="my_tabs_3" className="tab" aria-label="Tab 3" defaultChecked />
                <PowerIcon className="size-8" />
            </label>
            <div className="tab-content bg-base-100 border-base-300 p-6">
                <div className="flex flex-col items-center justify-center">
                    <button
                        onClick={handlePowerToggle}
                        className={`btn btn-ghost btn-circle p-6 size-50 ${!power ? 'text-error' : 'text-success'}`}
                    >
                        {power ? <BoltIcon /> : <BoltSlashIcon />}
                    </button>
                    <ul className="menu menu-horizontal bg-base-200 rounded-box mt-6">
                        <li>
                            <button
                                onClick={handleSpeedToggle}
                                className="tooltip"
                                data-tip={`Speed: ${speed.charAt(0).toUpperCase() + speed.slice(1)}`}
                            >
                                <ClockIcon className="size-8" />
                                <span className="text-xs absolute -bottom-1 bg-base-300 px-1 rounded">
                                    {speed === 'slow' ? 'S' : speed === 'classic' ? 'C' : 'F'}
                                </span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={handlePositionToggle}
                                className="tooltip"
                                data-tip={`Position: ${position === 'top' ? 'Top' : 'Bottom'}`}
                            >
                                {position === 'top' ? 
                                    <ArrowUpIcon className="size-8" /> : 
                                    <ArrowDownIcon className="size-8" />
                                }
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={handleLayoutChange}
                                className="tooltip"
                                data-tip={layout === 'compact' ? "Comfort" : "Compact"}
                            >
                                {layout === 'compact' ?
                                    <ArrowsPointingOutIcon className="size-8" /> :
                                    <ArrowsPointingInIcon className="size-8" />
                                }
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </>
    );
}