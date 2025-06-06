import {ComputerDesktopIcon} from "@heroicons/react/24/solid/index.js";

export default function DisplayTab() {
    return (
        <>
            <label className="tab">
                <input type="radio" name="my_tabs_3" className="tab" aria-label="Tab 2"/>
                <ComputerDesktopIcon className="size-8"/>
            </label>
            <div className="tab-content bg-base-100 border-base-300 p-6">Tab content 2</div>
        </>
    );
}