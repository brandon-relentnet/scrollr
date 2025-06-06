"use client";
import { useEffect, useState } from "react";
import { themeChange } from "theme-change";
import DisplayTab from '@/entrypoints/popup/tabs/DisplayTab.tsx'
import PowerTab from '@/entrypoints/popup/tabs/PowerTab.tsx';
import ThemeTab from "@/entrypoints/popup/tabs/ThemeTab.tsx";
import AccountsTab from "@/entrypoints/popup/tabs/AccountsTab.tsx";
import SettingsTab from "@/entrypoints/popup/tabs/SettingsTab.tsx";

export default function Popup() {
  const [power, setPower] = useState(false);
  const [layout, setLayout] = useState(false);

  useEffect(() => {
    themeChange(false);
  }, []);

  return (
      <div className="tabs tabs-lift p-2">
          {/* TAB #1 THEMES */}
          <ThemeTab />

          {/* TAB #2 VIEWS */}
          <DisplayTab />

          {/* TAB #3 POWER */}
          <PowerTab power={power} setPower={setPower} layout={layout} setLayout={setLayout} />

          {/* TAB #4 ACCOUNTS */}
          <AccountsTab />

          {/* TAB #5 SETTINGS */}
          <SettingsTab />
        </div>
  );
}