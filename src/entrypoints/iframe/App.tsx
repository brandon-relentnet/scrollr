"use client";

import { useEffect } from "react";
import { themeChange } from "theme-change";
import { useSelector } from "react-redux";

export default function App() {
    const currentTheme = useSelector((state: { theme: string }) => state.theme);

    useEffect(() => {
        // Initialize theme-change library
        themeChange(false);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", currentTheme);
    }, [currentTheme]);

    return (
        <div className="bg-base-100 w-full h-[150px]">
            testiframe
        </div>
    );
}