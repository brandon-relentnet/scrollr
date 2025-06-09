"use client";

import { useEffect } from "react";
import { themeChange } from "theme-change";
import { useSelector } from "react-redux";
import {Carousel} from "@/entrypoints/iframe/Carousel";

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
        <div className="bg-base-200 w-full overflow-auto h-screen px-2">
            <Carousel />
        </div>
    );
}