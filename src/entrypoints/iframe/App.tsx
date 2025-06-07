"use client";

import { useEffect } from "react";
import { themeChange } from "theme-change";

export default function Popup() {
  useEffect(() => {
    themeChange(false);
  }, []);

  return (
      <div className="bg-base-100 w-full h-[150px]">
        hitest
      </div>
  );
}