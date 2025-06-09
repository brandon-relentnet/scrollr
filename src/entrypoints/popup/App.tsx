"use client";

import { useEffect, useState } from "react";
import { themeChange } from "theme-change";
import DisplayTab from './tabs/DisplayTab.jsx'
import PowerTab from './tabs/PowerTab.jsx';
import ThemeTab from "./tabs/ThemeTab.tsx";
import AccountsTab from "./tabs/AccountsTab.tsx";
import SettingsTab from "./tabs/SettingsTab.tsx";

export default function Popup() {
  const [power, setPower] = useState(false);

  useEffect(() => {
    themeChange(false);
  }, []);

  return (
      <div className="tabs tabs-lift p-2 overflow-hidden relative">

          {/* CENTER THE TABS */}
          <span className="tab w-[calc((100vw-200px)/5)]">&nbsp;</span>

          {/* TAB #1 THEMES */}
          <ThemeTab/>

          {/* TAB #2 VIEWS */}
          <DisplayTab/>

          {/* TAB #3 POWER */}
          <PowerTab power={power} setPower={setPower} />

          {/* TAB #4 ACCOUNTS */}
          <AccountsTab/>

          {/* TAB #5 SETTINGS */}
          <SettingsTab/>
      </div>
  );
}