import {
    ArrowsPointingInIcon,
    ArrowsPointingOutIcon,
    BoltIcon,
    BoltSlashIcon,
    ClockIcon,
    PowerIcon,
    ViewColumnsIcon
} from "@heroicons/react/24/solid";
import { useSelector, useDispatch } from "react-redux";
import { setLayout } from "@/entrypoints/store/layoutSlice";
import { togglePower } from "@/entrypoints/store/powerSlice";

export default function PowerTab() {
    const dispatch = useDispatch();
    const layout = useSelector((state) => {
        return state.layout?.mode || 'compact';
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
                            <a className="tooltip" data-tip="Speed">
                                <ClockIcon className="size-8" />
                            </a>
                        </li>
                        <li>
                            <a className="tooltip" data-tip="Change View">
                                <ViewColumnsIcon className="size-8" />
                            </a>
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