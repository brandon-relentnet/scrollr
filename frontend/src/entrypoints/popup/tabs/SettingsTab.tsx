import {
  Cog6ToothIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  BugAntIcon,
} from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setDebugMode, toggleDebugCategory } from "../../store/togglesSlice.js";
import debugLogger, { DEBUG_CATEGORIES } from "../../utils/debugLogger.js";

export default function SettingsTab() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const theme = useSelector((state: any) => state.theme);
  const layout = useSelector((state: any) => state.layout);
  const finance = useSelector((state: any) => state.finance);
  const power = useSelector((state: any) => state.power);
  const toggles = useSelector((state: any) => state.toggles);
  const rss = useSelector((state: any) => state.rss);
  const dispatch = useDispatch();

  const showStatus = (message: string, isError = false) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  // Debug mode handlers
  const handleDebugModeToggle = async (enabled: boolean) => {
    const categories = enabled ? Object.values(DEBUG_CATEGORIES) : [];
    dispatch(setDebugMode({ enabled, categories }));
    await debugLogger.setDebugMode(enabled, categories);
  };

  const handleDebugCategoryToggle = async (category: string) => {
    dispatch(toggleDebugCategory(category));
    const newCategories = toggles.debugCategories.includes(category)
      ? toggles.debugCategories.filter((c: string) => c !== category)
      : [...toggles.debugCategories, category];
    await debugLogger.setDebugMode(toggles.debugMode, newCategories);
  };

  // Sync debug settings on mount
  useEffect(() => {
    if (toggles.debugMode !== undefined) {
      debugLogger.setDebugMode(toggles.debugMode, toggles.debugCategories);
    }
  }, [toggles.debugMode, toggles.debugCategories]);

  const exportSettings = () => {
    try {
      setIsExporting(true);

      const exportData = {
        version: "2.0.0-beta.1",
        timestamp: new Date().toISOString(),
        settings: { theme, layout, finance, power, toggles, rss },
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scrollr-settings-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showStatus("Settings exported successfully!");
    } catch (error) {
      showStatus("Failed to export settings", true);
    } finally {
      setIsExporting(false);
    }
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);

        if (!importData.settings || !importData.version) {
          throw new Error("Invalid settings file format");
        }

        // Restore each slice of state
        const validKeys = [
          "theme",
          "layout",
          "finance",
          "power",
          "toggles",
          "rss",
        ];
        Object.keys(importData.settings).forEach((key) => {
          if (validKeys.includes(key)) {
            const actionType = `${key}/setState`;
            dispatch({ type: actionType, payload: importData.settings[key] });
          }
        });

        showStatus("Settings imported successfully!");
      } catch (error) {
        showStatus("Failed to import settings - invalid file", true);
      } finally {
        setIsImporting(false);
        // Reset file input
        event.target.value = "";
      }
    };

    reader.readAsText(file);
  };

  const clearAllData = async () => {
    try {
      setIsClearing(true);

      // Clear extension storage
      if (typeof browser !== "undefined" && browser.storage) {
        await browser.storage.local.clear();
        await browser.storage.sync?.clear();
      }

      // Clear localStorage
      localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear any cached data
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      showStatus("All data cleared successfully!");

      // Reload the extension after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      showStatus("Failed to clear all data", true);
    } finally {
      setIsClearing(false);
    }
  };

  const getStorageSize = () => {
    try {
      let total = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage.getItem(key)?.length || 0;
        }
      }
      return `${(total / 1024).toFixed(1)} KB`;
    } catch {
      return "Unknown";
    }
  };

  return (
    <>
      <label className="tab">
        <input
          type="radio"
          name="my_tabs_3"
          className="tab"
          aria-label="Tab 5"
        />
        <Cog6ToothIcon className="size-8" />
      </label>
      <div className="tab-content bg-base-100 border-base-300 p-4 overflow-hidden max-h-120">
        <div className="overflow-y-auto px-1 py-2 h-110 space-y-6">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`alert ${
                statusMessage.includes("Failed")
                  ? "alert-error"
                  : "alert-success"
              }`}
            >
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Debug Settings Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              🐛 Debug Settings
            </h3>

            <div className="bg-base-200 rounded-lg p-4 space-y-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Debug Mode</h4>
                    <p className="text-sm text-base-content/70">
                      Show detailed console logs for troubleshooting
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={toggles.debugMode || false}
                    onChange={(e) => handleDebugModeToggle(e.target.checked)}
                  />
                </div>
              </div>

              {toggles.debugMode && (
                <>
                  <div className="divider my-2"></div>
                  <div className="flex flex-col gap-2">
                    <h4 className="font-medium">Debug Categories</h4>
                    <p className="text-sm text-base-content/70">
                      Select specific areas to debug (leave all unchecked to see
                      everything)
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {Object.entries(DEBUG_CATEGORIES).map(([key, value]) => (
                        <label
                          key={String(value)}
                          className="flex items-center gap-2 cursor-pointer p-2 hover:bg-base-300 rounded"
                        >
                          <input
                            type="checkbox"
                            className="checkbox checkbox-xs"
                            checked={
                              toggles.debugCategories?.includes(
                                String(value)
                              ) || false
                            }
                            onChange={() =>
                              handleDebugCategoryToggle(String(value))
                            }
                          />
                          <span className="text-sm capitalize">
                            {String(key).toLowerCase()}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {toggles.debugMode && (
                <div className="alert alert-info">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current shrink-0 w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span className="text-xs">
                    Debug logs will appear in the browser console (F12 →
                    Console)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Backup & Sync Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              💾 Backup & Sync
            </h3>

            <div className="bg-base-200 rounded-lg p-4 space-y-3">
              <div className="flex flex-col gap-2">
                <h4 className="font-medium">Export Settings</h4>
                <p className="text-sm text-base-content/70">
                  Download your current settings as a backup file
                </p>
                <button
                  onClick={exportSettings}
                  disabled={isExporting}
                  className="btn btn-primary btn-sm flex items-center gap-2"
                >
                  {isExporting ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <ArrowUpTrayIcon className="w-4 h-4" />
                  )}
                  Export Settings
                </button>
              </div>

              <div className="divider my-2"></div>

              <div className="flex flex-col gap-2">
                <h4 className="font-medium">Import Settings</h4>
                <p className="text-sm text-base-content/70">
                  Restore settings from a backup file
                </p>
                <label className="btn btn-secondary btn-sm flex items-center gap-2 cursor-pointer">
                  {isImporting ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <ArrowDownTrayIcon className="w-4 h-4" />
                  )}
                  Import Settings
                  <input
                    type="file"
                    accept=".json"
                    onChange={importSettings}
                    disabled={isImporting}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Privacy & Data Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              🔒 Privacy & Data
            </h3>

            <div className="bg-base-200 rounded-lg p-4 space-y-3">
              <div className="flex flex-col gap-2">
                <h4 className="font-medium">Storage Information</h4>
                <div className="stats stats-horizontal bg-base-100 shadow-sm">
                  <div className="stat py-2 px-3">
                    <div className="stat-title text-xs">Local Storage</div>
                    <div className="stat-value text-sm">{getStorageSize()}</div>
                  </div>
                </div>
              </div>

              <div className="divider my-2"></div>

              <div className="flex flex-col gap-2">
                <h4 className="font-medium">Clear All Data</h4>
                <p className="text-sm text-base-content/70">
                  Remove all stored data and reset to defaults
                </p>
                <div className="alert alert-warning">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <span className="text-xs">
                    This will permanently delete all your settings, themes, and
                    preferences
                  </span>
                </div>
                <button
                  onClick={clearAllData}
                  disabled={isClearing}
                  className="btn btn-error btn-sm flex items-center gap-2"
                >
                  {isClearing ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <TrashIcon className="w-4 h-4" />
                  )}
                  Clear All Data
                </button>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-info/10 rounded-lg p-4">
            <h4 className="font-medium text-info-content mb-2">💡 Tips</h4>
            <ul className="text-sm text-base-content/70 space-y-1">
              <li>• Export settings regularly to backup your preferences</li>
              <li>• Settings files are compatible across different browsers</li>
              <li>
                • Clearing data will require re-authentication if logged in
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
