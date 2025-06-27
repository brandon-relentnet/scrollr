import { SwatchIcon } from "@heroicons/react/24/solid";
import { useDispatch, useSelector } from "react-redux";
import { setTheme } from "@/entrypoints/store/themeSlice";
import { useAuth } from "@/entrypoints/popup/hooks/useAuth";
import debugLogger, {
  DEBUG_CATEGORIES,
} from "@/entrypoints/utils/debugLogger.js";
import { useState } from "react";

type ThemeView = "themes" | "preferences";

export default function ThemeTab() {
  const dispatch = useDispatch();
  const currentTheme = useSelector((state: any) => state.theme);
  const { saveSettingsImmediately } = useAuth();
  const [currentView, setCurrentView] = useState<ThemeView>("themes");

  // Updated themes with accurate colors based on CSS variables
  const themes = [
    {
      label: "Light",
      value: "light",
      colors: ["#ffffff", "#833ef6", "#ff369a"], // white base, blue primary, pink secondary
    },
    {
      label: "Dark",
      value: "dark",
      colors: ["#2a303c", "#793ef9", "#ff0080"], // dark base, purple primary, pink secondary
    },
    {
      label: "Cupcake",
      value: "cupcake",
      colors: ["#faf7f5", "#65c3c8", "#ef9fbc"], // light cream base, cyan primary, pink secondary
    },
    {
      label: "Bumblebee",
      value: "bumblebee",
      colors: ["#ffffff", "#e0a82e", "#f9d72f"], // white base, amber primary, yellow secondary
    },
    {
      label: "Emerald",
      value: "emerald",
      colors: ["#ffffff", "#66cc8a", "#377cfb"], // white base, green primary, blue secondary
    },
    {
      label: "Corporate",
      value: "corporate",
      colors: ["#ffffff", "#4b6bfb", "#7b92b2"], // white base, blue primary, gray-blue secondary
    },
    {
      label: "Synthwave",
      value: "synthwave",
      colors: ["#2b2164", "#f471b5", "#1bcdd4"], // dark purple base, pink primary, cyan secondary
    },
    {
      label: "Retro",
      value: "retro",
      colors: ["#e4d8b4", "#ff6b6b", "#fdca40"], // cream base, coral primary, yellow accent
    },
    {
      label: "Cyberpunk",
      value: "cyberpunk",
      colors: ["#ffee00", "#ff7598", "#75d1f0"], // yellow base, hot pink primary, cyan accent
    },
    {
      label: "Valentine",
      value: "valentine",
      colors: ["#fae0e6", "#e96d7b", "#a991f7"], // light pink base, pink primary, purple secondary
    },
    {
      label: "Halloween",
      value: "halloween",
      colors: ["#212121", "#f28c18", "#6d3a9c"], // dark base, orange primary, purple secondary
    },
    {
      label: "Garden",
      value: "garden",
      colors: ["#e8e8e8", "#5c7f67", "#ecf4e7"], // light gray base, green primary, light green secondary
    },
    {
      label: "Forest",
      value: "forest",
      colors: ["#171212", "#1eb854", "#d99330"], // very dark base, green primary, orange accent
    },
    {
      label: "Aqua",
      value: "aqua",
      colors: ["#345da7", "#00cfbd", "#ffd200"], // dark blue base, cyan primary, yellow accent
    },
    {
      label: "Lofi",
      value: "lofi",
      colors: ["#ffffff", "#1a1a1a", "#808080"], // white base, black primary, gray
    },
    {
      label: "Pastel",
      value: "pastel",
      colors: ["#ffffff", "#d1c1d7", "#fadae1"], // white base, light purple primary, light pink secondary
    },
    {
      label: "Fantasy",
      value: "fantasy",
      colors: ["#ffffff", "#7e2495", "#0079d3"], // white base, dark purple primary, blue secondary
    },
    {
      label: "Wireframe",
      value: "wireframe",
      colors: ["#ffffff", "#b8b8b8", "#ebebeb"], // white base, gray primary, light gray neutral
    },
    {
      label: "Black",
      value: "black",
      colors: ["#000000", "#141414", "#cccccc"], // black base, dark gray, light gray
    },
    {
      label: "Luxury",
      value: "luxury",
      colors: ["#09090b", "#ffffff", "#dca54c"], // very dark base, white primary, gold neutral
    },
    {
      label: "Dracula",
      value: "dracula",
      colors: ["#282a36", "#ff80bf", "#8aff80"], // dark base, pink primary, cyan secondary
    },
    {
      label: "CMYK",
      value: "cmyk",
      colors: ["#ffffff", "#45aeee", "#e8488a"], // white base, cyan primary, magenta secondary
    },
    {
      label: "Autumn",
      value: "autumn",
      colors: ["#f2f2f2", "#8c0327", "#d85251"], // light base, red primary, orange secondary
    },
    {
      label: "Business",
      value: "business",
      colors: ["#1f1f1f", "#1c4e80", "#7c909a"], // dark base, blue primary, gray-blue secondary
    },
    {
      label: "Acid",
      value: "acid",
      colors: ["#fafafa", "#ff00ff", "#ffaa00"], // light base, magenta primary, yellow-orange secondary
    },
    {
      label: "Lemonade",
      value: "lemonade",
      colors: ["#ffffff", "#519903", "#dcc80d"], // white base, yellow-green primary, yellow secondary
    },
    {
      label: "Night",
      value: "night",
      colors: ["#1e232a", "#38bdf8", "#7dd3fc"], // dark blue base, cyan primary, light blue secondary
    },
    {
      label: "Coffee",
      value: "coffee",
      colors: ["#1f1d1a", "#db924b", "#6f4e37"], // very dark base, orange-brown primary, brown
    },
    {
      label: "Winter",
      value: "winter",
      colors: ["#ffffff", "#057aea", "#4664aa"], // white base, bright blue primary, darker blue secondary
    },
    {
      label: "Dim",
      value: "dim",
      colors: ["#2a2e37", "#9ca3af", "#a3a3a3"],
    },
    {
      label: "Nord",
      value: "nord",
      colors: ["#2e3440", "#88c0d0", "#d8dee9"],
    },
    {
      label: "Sunset",
      value: "sunset",
      colors: ["#1a202c", "#f56565", "#ed8936"],
    },
    {
      label: "Caramellatte",
      value: "caramellatte",
      colors: ["#f7f3f0", "#d2691e", "#8b4513"],
    },
    {
      label: "Abyss",
      value: "abyss",
      colors: ["#000000", "#4c1d95", "#7c3aed"],
    },
    {
      label: "Silk",
      value: "silk",
      colors: ["#f8f9fa", "#6c757d", "#495057"],
    },
  ];

  // Get the current theme value (handle both string and object formats)
  const getCurrentTheme = () => {
    if (typeof currentTheme === "string") {
      return currentTheme;
    } else if (currentTheme && currentTheme.mode) {
      return currentTheme.mode;
    }
    return "dark"; // default
  };

  function themeChange(theme: string) {
    debugLogger.uiEvent(`Theme changed to ${theme}`);
    dispatch(setTheme(theme));
    // Also apply immediately to DOM
    document.documentElement.setAttribute("data-theme", theme);
    // Save settings immediately since theme changes are critical
    setTimeout(() => saveSettingsImmediately(), 100);
  }

  return (
    <>
      <label className="tab">
        <input
          type="radio"
          name="my_tabs_3"
          className="tab"
          aria-label="Tab 1"
        />
        <SwatchIcon className="size-8" />
      </label>
      <div className="tab-content bg-base-100 border-base-300 p-2">
        <div className="p-2">
          <div className="w-full">
            {/* Tab Navigation */}
            <div className="tabs tabs-box w-full mb-4">
              <button
                className={`tab flex-1 ${
                  currentView === "themes" ? "tab-active" : ""
                }`}
                onClick={() => setCurrentView("themes")}
              >
                Themes
              </button>
              <button
                className={`tab flex-1 ${
                  currentView === "preferences" ? "tab-active" : ""
                }`}
                onClick={() => setCurrentView("preferences")}
              >
                Preferences
              </button>
            </div>

            {/* Content based on current view */}
            <div className="overflow-hidden max-h-120">
              {currentView === "themes" && (
                <div className="w-full join join-vertical overflow-y-auto h-110 pr-1">
                  {themes.map(({ label, value, colors }, index) => (
                    <label
                      key={index}
                      className="btn theme-controller join-item flex items-center justify-between"
                      style={{
                        backgroundColor:
                          getCurrentTheme() === value
                            ? "var(--color-primary)"
                            : "",
                        color:
                          getCurrentTheme() === value
                            ? "var(--color-primary-content)"
                            : "",
                      }}
                    >
                      <input
                        type="radio"
                        name="theme-buttons"
                        value={value}
                        className="theme-controller hidden"
                        checked={getCurrentTheme() === value}
                        onChange={() => themeChange(value)}
                      />
                      <span>{label}</span>
                      <span className="flex gap-0.5 ml-2">
                        {colors.map((color, i) => (
                          <span
                            key={i}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {currentView === "preferences" && (
                <div className="flex-none w-full p-4">
                  <div className="p-4">this is a test component</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
