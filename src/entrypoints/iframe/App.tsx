"use client";

import { useEffect } from "react";
import { themeChange } from "theme-change";
import { useSelector } from "react-redux";
import {Carousel} from "@/entrypoints/iframe/Carousel";

export default function App() {
    const currentTheme = useSelector((state: any) => state.theme);

    useEffect(() => {
        // Initialize theme-change library
        themeChange(false);
    }, []);

    useEffect(() => {
        // Handle both string and object theme formats to match popup behavior
        if (currentTheme && typeof currentTheme === 'string') {
            document.documentElement.setAttribute('data-theme', currentTheme);
        } else if (currentTheme && currentTheme.mode) {
            document.documentElement.setAttribute('data-theme', currentTheme.mode);
        }
    }, [currentTheme]);

    return (
        <div className="bg-base-100 w-full px-2 absolute bottom-0 left-0">
            <Carousel />
        </div>
    );
}