import {Cog6ToothIcon} from "@heroicons/react/24/solid";

export default function SettingsTab() {
    return (
        <>
            <label className="tab">
                <input type="radio" name="my_tabs_3" className="tab" aria-label="Tab 5"/>
                <Cog6ToothIcon className="size-8"/>
            </label>
            <div className="tab-content bg-base-100 border-base-300 p-6">
                <div className="flex items-center justify-center">
                </div>
            </div>
        </>
    )
}