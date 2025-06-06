"use client";
import { useEffect, useState } from "react";
import { themeChange } from "theme-change";
import {
  UserCircleIcon,
  SwatchIcon as SwatchIconSolid,
  PowerIcon,
    BoltIcon,
    BoltSlashIcon,
    ClockIcon,
  ViewColumnsIcon,
    ArrowsPointingOutIcon,
    ArrowsPointingInIcon
} from "@heroicons/react/24/solid";

export default function Popup() {
  const [power, setPower] = useState(false);
  const [layout, setLayout] = useState(false);

  useEffect(() => {
    themeChange(false);
  }, []);

  const themes = [
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
    { label: "Cupcake", value: "cupcake" },
    { label: "Bumblebee", value: "bumblebee" },
    { label: "Emerald", value: "emerald" },
    { label: "Corporate", value: "corporate" },
    { label: "Synthwave", value: "synthwave" },
    { label: "Retro", value: "retro" },
    { label: "Cyberpunk", value: "cyberpunk" },
    { label: "Valentine", value: "valentine" },
    { label: "Halloween", value: "halloween" },
    { label: "Garden", value: "garden" },
    { label: "Forest", value: "forest" },
    { label: "Aqua", value: "aqua" },
    { label: "Lofi", value: "lofi" },
    { label: "Pastel", value: "pastel" },
    { label: "Fantasy", value: "fantasy" },
    { label: "Wireframe", value: "wireframe" },
    { label: "Black", value: "black" },
    { label: "Luxury", value: "luxury" },
    { label: "Dracula", value: "dracula" },
    { label: "CMYK", value: "cmyk" },
    { label: "Autumn", value: "autumn" },
    { label: "Business", value: "business" },
    { label: "Acid", value: "acid" },
    { label: "Lemonade", value: "lemonade" },
    { label: "Night", value: "night" },
    { label: "Coffee", value: "coffee" },
    { label: "Winter", value: "winter" },
    { label: "Dim", value: "dim" },
    { label: "Nord", value: "nord" },
    { label: "Sunset", value: "sunset" },
    { label: "Caramellatte", value: "caramellatte" },
    { label: "Abyss", value: "abyss" },
    { label: "Silk", value: "silk" },
  ];

  return (
      <div className="card !outline-[0px] bg-base-100 overflow-x-hidden relative">
        <div className="tabs tabs-lift p-2">
          <label className="tab">
            <input type="radio" name="my_tabs_3" className="tab" aria-label="Tab 1"/>
            <PowerIcon className="size-7"/>
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

                    <button onClick={() => setLayout(!layout)} className="tooltip" data-tip={!layout ? "Comfort" : "Compact"}>
                      {!layout ?
                          <ArrowsPointingOutIcon className="size-8"/> : <ArrowsPointingInIcon className="size-8"/>
                      }
                    </button>

                </li>
              </ul>
            </div>
          </div>

          <input type="radio" name="my_tabs_3" className="tab" aria-label="Tab 2" defaultChecked/>
          <div className="tab-content bg-base-100 border-base-300 p-6">Tab content 2</div>

          <label className="tab">
            <input type="radio" name="my_tabs_3" className="tab" aria-label="Tab 3"/>
            <SwatchIconSolid className="size-7"/>
          </label>
          <div className="tab-content bg-base-100 border-base-300 p-6">
            <div className="flex items-center justify-center">
              <div className="flex-none w-full join join-vertical">
                {themes.map(({label, value}, index) => (
                    <input
                        key={index}
                        type="radio"
                        name="theme-buttons"
                        className="btn theme-controller join-item"
                        aria-label={label}
                        value={value}
                        data-set-theme={value}
                    />
                ))}
              </div>
            </div>
          </div>

          <label className="tab">
            <input type="radio" name="my_tabs_3" className="tab" aria-label="Tab 4"/>
            <UserCircleIcon className="size-7"/>
          </label>
          <div className="tab-content bg-base-100 border-base-300 p-6">
            <div className="flex items-center justify-center">
              <ul
                  tabIndex={0}
                  className="menu menu-sm bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
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
          </div>
        </div>
        );
        }