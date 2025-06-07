import {
    ArrowsPointingInIcon,
    ArrowsPointingOutIcon,
    BoltIcon,
    BoltSlashIcon,
    ClockIcon,
    PowerIcon,
    ViewColumnsIcon
} from "@heroicons/react/24/solid";

interface PowerTabProps {
    power: boolean;
    setPower: (power: boolean) => void;
    layout: boolean;
    setLayout: (layout: boolean) => void;
}

export default function PowerTab({ power, setPower, layout, setLayout }: PowerTabProps) {
    return (
        <>
            <label className="tab">
                <input type="radio" name="my_tabs_3" className="tab" aria-label="Tab 3" defaultChecked/>
                <PowerIcon className="size-8"/>
            </label>
            <div className="tab-content bg-base-100 border-base-300 p-6">
                <div className="flex flex-col items-center justify-center">
                    <button onClick={() => setPower(!power)} className="btn btn-ghost btn-circle p-6 size-50">
                        {!power ?
                            <BoltIcon/> : <BoltSlashIcon/>
                        }
                    </button>
                    <ul className="menu menu-horizontal bg-base-200 rounded-box mt-6">
                        <li>
                            <a className="tooltip" data-tip="Speed">
                                <ClockIcon className="size-8"/>
                            </a>
                        </li>
                        <li>
                            <a className="tooltip" data-tip="Change View">
                                <ViewColumnsIcon className="size-8"/>
                            </a>
                        </li>
                        <li>
                            <button onClick={() => setLayout(!layout)} className="tooltip"
                                    data-tip={!layout ? "Comfort" : "Compact"}>
                                {!layout ?
                                    <ArrowsPointingOutIcon className="size-8"/> : <ArrowsPointingInIcon className="size-8"/>
                                }
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </>
    )
}