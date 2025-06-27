import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDoubleDownIcon,
  ChevronDoubleUpIcon,
  SwatchIcon,
} from "@heroicons/react/24/solid";
import { useDispatch, useSelector } from "react-redux";
import { setTheme } from "@/entrypoints/store/themeSlice";
import {
  setOpacity,
  setLayout,
  toggleSpeed,
  togglePosition,
} from "@/entrypoints/store/layoutSlice";
import { useAuth } from "@/entrypoints/popup/hooks/useAuth";
import debugLogger from "@/entrypoints/utils/debugLogger.js";
import { useState, useEffect, useRef } from "react";

type ThemeView = "themes" | "preferences";

export default function ThemeTab() {
  const dispatch = useDispatch();
  const currentTheme = useSelector((state: any) => state.theme);
  const opacity = useSelector((state: any) => state.layout?.opacity ?? 1.0);
  const speed = useSelector((state: any) => state.layout?.speed || "classic");
  const position = useSelector((state: any) => state.layout?.position || "top");
  const layout = useSelector((state: any) => state.layout?.mode || "compact");
  const { saveSettingsImmediately } = useAuth();
  const [currentView, setCurrentView] = useState<ThemeView>("themes");

  // Local state for smooth slider interaction
  const [localOpacity, setLocalOpacity] = useState(opacity);
  const [isDragging, setIsDragging] = useState(false);
  const isSliderUpdate = useRef(false);

  // Sync local state with Redux when opacity changes from other sources
  useEffect(() => {
    // Skip sync if this update came from the slider
    if (isSliderUpdate.current) {
      isSliderUpdate.current = false;
      return;
    }

    // Only sync if not dragging
    if (!isDragging) {
      setLocalOpacity(opacity);
    }
  }, [opacity, isDragging]);

  // Opacity handlers
  const handleOpacityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newOpacity = parseFloat(event.target.value) / 100;
    setLocalOpacity(newOpacity);
  };

  const handleOpacityStart = () => {
    setIsDragging(true);
  };

  const handleOpacityEnd = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newOpacity = parseFloat(event.target.value) / 100;

    // Mark that this update is from the slider
    isSliderUpdate.current = true;

    // Dispatch to Redux and notify background script
    dispatch(setOpacity(newOpacity));
    browser.runtime.sendMessage({
      type: "OPACITY_CHANGED",
      opacity: newOpacity,
    });

    setIsDragging(false);
  };

  // Speed change handler
  const handleSpeedChange = (newSpeed: string) => {
    // Set the speed directly based on the selected value
    let currentSpeed = speed;
    while (currentSpeed !== newSpeed) {
      dispatch(toggleSpeed());
      currentSpeed =
        currentSpeed === "slow"
          ? "classic"
          : currentSpeed === "classic"
          ? "fast"
          : "slow";
    }

    browser.runtime.sendMessage({
      type: "SPEED_CHANGED",
      speed: newSpeed,
    });
  };

  // Position change handler
  const handlePositionChange = (newPosition: string) => {
    if (position !== newPosition) {
      dispatch(togglePosition());
      browser.runtime.sendMessage({
        type: "POSITION_CHANGED",
        position: newPosition,
      });
    }
  };

  // Layout change handler
  const handleLayoutChange = (newLayout: string) => {
    dispatch(setLayout(newLayout));
    browser.runtime.sendMessage({
      type: "LAYOUT_CHANGED",
      layout: newLayout,
    });
  };

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
                <div className="flex flex-col w-full pr-2 gap-4 overflow-y-auto h-110">
                  {/* Opacity Slider */}
                  <div className="w-full bg-base-200 p-4 card">
                    <label className="label text-base-content font-semibold text-lg mb-3 flex justify-between items-center">
                      <span className="label-text">Opacity</span>
                      <span className="bg-neutral/10 card h-1 flex-1 mx-2"></span>
                      <span className="label-text-alt italic">
                        {Math.round(localOpacity * 100)}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max="100"
                      value={Math.round(localOpacity * 100)}
                      onChange={handleOpacityChange}
                      onMouseDown={handleOpacityStart}
                      onTouchStart={handleOpacityStart}
                      onMouseUp={handleOpacityEnd}
                      onTouchEnd={handleOpacityEnd}
                      className="range"
                    />
                  </div>

                  {/* Position Control */}
                  <div className="w-full bg-base-200 p-4 card">
                    <label className="label text-base-content font-semibold text-lg mb-2 flex justify-between items-center">
                      <span className="label-text">Position</span>
                      <span className="bg-neutral/10 card h-1 flex-1 ml-2"></span>
                      <label className="swap">
                        <input
                          type="checkbox"
                          onChange={(e) =>
                            handlePositionChange(
                              e.target.checked ? "bottom" : "top"
                            )
                          }
                          checked={position === "bottom"}
                        />
                        <div className="flex items-center gap-2 group">
                          <span className="label-text-alt text-lg italic">
                            {position.charAt(0).toUpperCase() +
                              position.slice(1)}
                          </span>
                          <div
                            className={`flex flex-col size-10 card group-hover:shadow-lg shadow-md overflow-hidden group-hover:scale-115 group-active:scale-85 transition-all duration-200 ${
                              position === "top" ? "rotate-180" : "rotate-360"
                            }`}
                          >
                            <div className="h-full bg-base-content"></div>
                            <div
                              className={`bg-primary transition-all duration-200 ${
                                layout === "compact" ? "h-1" : "h-1/3"
                              }`}
                            ></div>
                          </div>
                        </div>
                      </label>
                    </label>
                  </div>

                  {/* Layout Control */}
                  <div className="w-full bg-base-200 p-4 card">
                    <label className="label text-base-content font-semibold text-lg mb-2 flex justify-between items-center">
                      <span className="label-text">Layout</span>
                      <span className="bg-neutral/10 card h-1 flex-1 ml-2"></span>
                      <label className="swap">
                        <input
                          type="checkbox"
                          onChange={(e) =>
                            handleLayoutChange(
                              e.target.checked ? "compact" : "comfort"
                            )
                          }
                          checked={layout === "compact"}
                        />
                        <div className="flex items-center gap-2 group">
                          <span className="label-text-alt text-lg italic">
                            {layout.charAt(0).toUpperCase() + layout.slice(1)}
                          </span>
                          <div
                            className={`flex flex-col size-10 card group-hover:shadow-lg shadow-md overflow-hidden group-hover:scale-115 group-active:scale-85 transition-all duration-200 ${
                              position === "top" ? "rotate-180" : "rotate-360"
                            }`}
                          >
                            <div className="h-full bg-base-content"></div>
                            <div
                              className={`bg-primary transition-all duration-200 ${
                                layout === "compact" ? "h-1" : "h-1/3"
                              }`}
                            ></div>
                          </div>
                        </div>
                      </label>
                    </label>
                  </div>

                  {/* Speed Control */}
                  <div className="w-full bg-base-200 p-4 card">
                    <label className="label text-base-content font-semibold text-lg mb-2 flex justify-between items-center">
                      <span className="label-text">Speed</span>
                      <span className="bg-neutral/10 card h-1 flex-1 mx-2"></span>
                      <span className="label-text-alt italic">
                        {speed.charAt(0).toUpperCase() + speed.slice(1)}
                      </span>
                    </label>
                    <div className="flex gap-2 justify-evenly">
                      <label
                        className={`cursor-pointer flex items-center flex-col flex-1 btn btn-ghost py-12 ${
                          speed === "slow"
                            ? "text-base-content"
                            : "text-base-content/70"
                        }`}
                      >
                        <span className="label-text">
                          <svg
                            height="46"
                            width="46"
                            viewBox="0 0 512 512"
                            aria-hidden="true"
                            focusable="false"
                          >
                            <g>
                              <path
                                fill="currentColor"
                                d="M511.325,275.018c-0.416-0.982-0.974-1.799-1.54-2.432c-1.117-1.241-2.199-1.891-3.157-2.382
                                c-1.808-0.892-3.391-1.274-5.107-1.633c-2.982-0.592-6.348-0.916-10.13-1.183c-5.64-0.4-12.13-0.633-18.419-1.016
                                c-3.166-0.192-6.29-0.433-9.18-0.734c0.3-1.449,0.474-2.932,0.467-4.432c0.008-3.732-0.975-7.447-2.725-10.896
                                c-1.757-3.458-4.24-6.698-7.372-9.831c-2.991-2.982-6.69-7.489-10.847-12.979c-7.289-9.613-16.045-22.243-26.233-35.738
                                c-15.311-20.252-33.847-42.503-56.24-59.93c-11.196-8.714-23.376-16.212-36.63-21.56c-13.246-5.339-27.574-8.505-42.853-8.505
                                c-23.292-0.008-44.302,7.356-62.796,18.544c-13.896,8.398-26.45,18.935-37.813,30.307c-17.036,17.045-31.44,35.955-43.486,52.45
                                c-6.023,8.239-11.454,15.878-16.27,22.326c-2.757,3.69-5.314,6.981-7.648,9.763c-0.783-0.741-1.549-1.475-2.283-2.208
                                c-3.582-3.599-6.489-7.139-8.672-12.03c-2.174-4.89-3.699-11.33-3.706-20.876c-0.009-8.781,1.332-20.143,4.673-34.872
                                c0.642-2.832,0.95-5.656,0.95-8.43c0-6.448-1.691-12.571-4.573-17.961c-4.323-8.114-11.205-14.653-19.318-19.235
                                c-8.139-4.574-17.578-7.214-27.316-7.223c-9.863-0.008-20.077,2.79-29.032,9.146c-8.181,5.824-13.979,11.18-17.953,16.495
                                c-1.974,2.658-3.491,5.315-4.531,8.023C0.542,148.685,0,151.442,0,154.141c-0.008,3.124,0.742,6.106,1.974,8.672
                                c1.075,2.258,2.491,4.216,4.057,5.906c2.741,2.966,5.94,5.182,9.139,6.998c4.816,2.691,9.722,4.449,13.496,5.599
                                c0.332,0.1,0.649,0.2,0.974,0.283c1.442,21.226,4.307,38.638,8.081,53.033c6.131,23.392,14.728,38.87,23.317,49.425
                                c4.282,5.274,8.547,9.305,12.346,12.462c3.799,3.158,7.156,5.474,9.464,7.215c5.465,4.098,10.696,7.047,15.687,8.996
                                c3.673,1.433,7.223,2.316,10.613,2.683v0.009c4.799,2.874,16.695,9.555,35.147,16.694c-0.183,0.666-0.5,1.491-0.925,2.4
                                c-1.124,2.432-2.99,5.464-5.123,8.463c-3.232,4.541-7.089,9.08-10.113,12.437c-1.516,1.675-2.808,3.058-3.724,4.024
                                c-0.467,0.484-0.816,0.85-1.075,1.084l-0.15,0.166c-0.016,0.017-0.091,0.1-0.2,0.208c-0.792,0.758-3.816,3.69-6.956,7.898
                                c-1.766,2.4-3.599,5.198-5.074,8.389c-1.458,3.199-2.616,6.798-2.64,10.888c-0.017,2.899,0.666,6.056,2.274,8.93
                                c0.883,1.608,2.007,2.933,3.224,4.041c2.124,1.958,4.54,3.357,7.09,4.482c3.857,1.699,8.097,2.824,12.546,3.582
                                c4.448,0.758,9.056,1.124,13.504,1.124c5.298-0.016,10.313-0.5,14.778-1.675c2.233-0.616,4.332-1.39,6.365-2.607
                                c1.016-0.608,2.008-1.342,2.949-2.308c0.925-0.933,1.808-2.133,2.441-3.599c0.366-0.883,1.1-2.466,2.049-4.44
                                c3.316-6.94,9.297-18.802,14.404-28.857c2.566-5.04,4.907-9.63,6.606-12.954c0.85-1.674,1.55-3.024,2.033-3.965
                                c0.475-0.924,0.733-1.442,0.733-1.442l0.016-0.033l0.042-0.042c0.033-0.067,0.075-0.142,0.092-0.217
                                c23.226,4.758,50.517,8.048,81.565,8.048c1.641,0,3.266,0,4.907-0.025h0.025c23.184-0.274,43.978-2.416,62.23-5.606
                                c2.25,4.39,7.597,14.812,12.804,25.15c2.657,5.256,5.274,10.497,7.414,14.87c1.092,2.174,2.05,4.148,2.824,5.79
                                c0.774,1.624,1.383,2.956,1.716,3.723c0.624,1.466,1.491,2.666,2.432,3.599c1.666,1.666,3.433,2.699,5.256,3.507
                                c2.75,1.2,5.69,1.9,8.84,2.383c3.157,0.475,6.514,0.7,9.98,0.7c6.814-0.016,13.937-0.833,20.318-2.64
                                c3.174-0.917,6.181-2.083,8.93-3.691c1.383-0.808,2.691-1.732,3.907-2.857c1.199-1.108,2.324-2.433,3.215-4.041
                                c1.625-2.874,2.283-6.031,2.266-8.93c0-4.09-1.158-7.689-2.616-10.888c-2.215-4.774-5.223-8.722-7.681-11.638
                                c-2.099-2.457-3.799-4.132-4.374-4.648v-0.016c-0.016-0.026-0.033-0.042-0.05-0.059c-0.024-0.016-0.024-0.033-0.042-0.033
                                c-0.033-0.042-0.05-0.058-0.091-0.1c-0.991-0.991-5.665-5.806-10.422-11.654c-2.641-3.232-5.274-6.772-7.306-10.039
                                c-0.7-1.107-1.308-2.199-1.832-3.215c20.868-7.689,33.806-15.295,38.438-18.227c0.883-0.05,1.848-0.125,2.907-0.225
                                c7.248-0.725,18.752-2.816,30.956-7.847c6.098-2.516,12.354-5.774,18.269-10.022c5.914-4.249,11.488-9.497,16.103-15.953
                                l0.166-0.242l0.158-0.258c0.341-0.575,0.666-1.241,0.916-2.024c0.241-0.776,0.408-1.683,0.408-2.641
                                C512,277.21,511.759,276.027,511.325,275.018z"
                              />
                            </g>
                          </svg>
                        </span>
                        <input
                          type="radio"
                          name="speed-radio"
                          className="radio"
                          checked={speed === "slow"}
                          onChange={() => handleSpeedChange("slow")}
                        />
                      </label>
                      <label
                        className={`cursor-pointer flex items-center flex-col flex-1 btn btn-ghost py-12 ${
                          speed === "classic"
                            ? "text-base-content"
                            : "text-base-content/70"
                        }`}
                      >
                        <span className="label-text">
                          <svg
                            height="46"
                            width="46"
                            version="1.1"
                            id="_x32_"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlnsXlink="http://www.w3.org/1999/xlink"
                            viewBox="0 0 512 512"
                            xmlSpace="preserve"
                          >
                            <g>
                              <path
                                fill="currentColor"
                                d="M239.103,99.037c27.354,0,49.524-22.17,49.524-49.513C288.627,22.17,266.457,0,239.103,0 C211.75,0,189.58,22.17,189.58,49.524C189.58,76.867,211.75,99.037,239.103,99.037z"
                              />
                              <path
                                fill="currentColor"
                                d="M427.361,241.153l-32.838-49.377c-7.974-11.666-18.555-21.326-30.88-28.235l-64.396-36.065 c-11.802-5.514-20.726-9.021-31.937-7.509l-30.812,4.185c-11.492,1.561-21.966,7.413-29.311,16.376l-58.651,62.42l-53.718,19.796 c-10.174,3.75-15.639,14.805-12.422,25.164l0.252,0.795c3.16,10.183,13.653,16.201,24.039,13.808l43.778-10.107 c10.919-2.519,21.288-7.015,30.57-13.275l30.445-20.473l10.756,81.74c0.785,5.998-0.427,12.083-3.44,17.335l-91.159,158.327 c-6.502,11.279-2.655,25.697,8.595,32.266l0.784,0.456c10.648,6.201,24.272,3.207,31.326-6.889l101.895-145.75l30.872,61.625 c2.286,4.554,5.309,8.692,8.953,12.248l68.486,66.964c8.643,8.44,22.315,8.818,31.394,0.862l1.095-0.95 c4.651-4.079,7.48-9.844,7.848-16.016s-1.744-12.238-5.882-16.831l-57.827-64.416l-31.414-113.697l-0.116,0.097l-9.011-88.95 l31.839,14.332L397.392,265c6.405,6.743,16.772,7.828,24.427,2.548l0.523-0.358C430.84,261.337,433.078,249.748,427.361,241.153z"
                              />
                            </g>
                          </svg>
                        </span>
                        <input
                          type="radio"
                          name="speed-radio"
                          className="radio"
                          checked={speed === "classic"}
                          onChange={() => handleSpeedChange("classic")}
                        />
                      </label>
                      <label
                        className={`cursor-pointer flex items-center flex-col flex-1 btn btn-ghost py-12 ${
                          speed === "fast"
                            ? "text-base-content"
                            : "text-base-content/70"
                        }`}
                      >
                        <span className="label-text">
                          <svg
                            height="46"
                            width="46"
                            version="1.1"
                            id="_x32_"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlnsXlink="http://www.w3.org/1999/xlink"
                            viewBox="0 0 512 512"
                            xmlSpace="preserve"
                          >
                            <g>
                              <path
                                fill="currentColor"
                                d="M437.276,414.686c3.512-22.157,1.446-47.289-11.063-74.848c-34.439-75.922-110.485-82.832-163.496-108.181 c-19.172-9.162-31.711-23.624-38.612-42.062c0,0-10.216-26.454-5.185-44.933c5.185-19.017,23.324-39.438,29.966-65.096 c16.703-64.529,2.882-99.092-40.337-67.99c-44.324,31.929-44.933,111.776-44.933,111.776s1.157,2.872-1.147,7.5 c-3.626,7.293-17.715,4.814-16.135-57.05c1.064-41.534-34.573-101.973-62.214-29.387c-13.986,36.68,24.212,99.67,24.212,99.67 s-28.344,16.868-46.689,45.512C34,232.804,42.285,252.14,49.546,269.101c15.556,36.299,57.029,1.725,79.506,77.772 c8.594,29.056,6.797,115.34-7.727,127.786c-14.523,12.457-4.142,33.2-4.142,33.2h62.215c0,0,2.996-63.02,21.092-52.681 c32.27,18.428,59.788,15.34,36.98,23.634C214.664,487.096,216.73,512,216.73,512h157.639c6.229-3.905,21.186-15.814,35.12-34.181 c6.384,5.568,14.616,9.049,23.748,9.049c20.06,0,36.298-16.258,36.298-36.298C469.534,431.915,455.392,416.71,437.276,414.686z"
                              />
                            </g>
                          </svg>
                        </span>
                        <input
                          type="radio"
                          name="speed-radio"
                          className="radio"
                          checked={speed === "fast"}
                          onChange={() => handleSpeedChange("fast")}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
