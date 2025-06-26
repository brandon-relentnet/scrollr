"use client";

import { useEffect, useState } from "react";
import { themeChange } from "theme-change";
import { useSelector } from "react-redux";
import DisplayTab from "./tabs/DisplayTab.jsx";
import PowerTab from "./tabs/PowerTab.jsx";
import ThemeTab from "./tabs/ThemeTab.tsx";
import AccountsTab from "./tabs/AccountsTab.tsx";
import SettingsTab from "./tabs/SettingsTab.tsx";

export default function Popup() {
  const currentTheme = useSelector((state: any) => state.theme);

  useEffect(() => {
    themeChange(false);
  }, []);

  // Apply theme when Redux state changes (for settings sync)
  useEffect(() => {
    if (currentTheme && typeof currentTheme === "string") {
      document.documentElement.setAttribute("data-theme", currentTheme);
    } else if (currentTheme && currentTheme.mode) {
      document.documentElement.setAttribute("data-theme", currentTheme.mode);
    }
  }, [currentTheme]);

  return (
    <div className="tabs tabs-lift p-2 overflow-hidden relative">
      {/* CENTER THE TABS */}
      <span className="tab w-[calc((100vw-200px)/5)]">&nbsp;</span>

      {/* TAB #1 THEMES */}
      <ThemeTab />

      {/* TAB #2 VIEWS */}
      <DisplayTab />

      {/* TAB #3 POWER */}
      <PowerTab />

      {/* TAB #4 ACCOUNTS */}
      <AccountsTab />

      {/* TAB #5 SETTINGS */}
      <SettingsTab />
    </div>
  );
}
