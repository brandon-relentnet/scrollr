import {UserCircleIcon} from "@heroicons/react/24/solid";

export default function AccountsTab() {
    return (
        <>
            <label className="tab">
                <input type="radio" name="my_tabs_3" className="tab" aria-label="Tab 4"/>
                <UserCircleIcon className="size-8"/>
            </label>
            <div className="tab-content bg-base-100 border-base-300 p-6">
                <div className="flex items-center justify-center">
                    <ul
                        tabIndex={0}
                        className="menu menu-sm bg-base-100 rounded-box z-1 mt-3 w-52 p-2"
                    >
                        <li>
                            <a className="justify-between">
                                Profile
                                <span className="badge">New</span>
                            </a>
                        </li>
                        <li>
                            <a>Settings</a>
                        </li>
                        <li>
                            <a>Logout</a>
                        </li>
                    </ul>
                </div>
            </div>
        </>
    )
}