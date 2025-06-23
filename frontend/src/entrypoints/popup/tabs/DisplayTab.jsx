import { ComputerDesktopIcon } from "@heroicons/react/24/solid";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  SPORTS_OPTIONS,
  STOCK_PRESETS,
  CRYPTO_PRESETS,
  STOCK_OPTIONS,
  CRYPTO_OPTIONS,
} from "./data.jsx";
import { useDispatch, useSelector } from "react-redux";
import { setToggles } from "@/entrypoints/store/togglesSlice";
import {
  toggleFinanceCategory,
  setFinancePreset,
  toggleFinanceSelection,
  setFinanceSearch,
  resetFinanceSelections,
  toggleAllFinanceSelections,
} from "@/entrypoints/store/financeSlice.js";
import {
  setRssEnabled,
  toggleRssSelection,
  setRssSearch,
  resetRssSelections,
  toggleAllRssSelections,
} from "@/entrypoints/store/rssSlice.js";
import { useAuth } from "../hooks/useAuth.tsx";
import { useRssFeeds } from "../hooks/useRssFeeds.tsx";

const getDefaultSportsState = () => ({
  NFL: false,
  NBA: false,
  MLB: false,
  NHL: false,
});

export default function DisplayTab() {
  const dispatch = useDispatch();
  const reduxToggles = useSelector((state) => state.toggles);
  const financeState = useSelector((state) => state.finance);
  const rssState = useSelector((state) => state.rss);
  const { isAuthenticated } = useAuth();
  const { feeds, addFeed, deleteFeed, isLoading, error } = useRssFeeds();

  const [rssFormData, setRssFormData] = useState({
    name: "",
    url: "",
    category: "General",
  });

  const [selectedSports, setSelectedSports] = useState(() => {
    return reduxToggles && Object.keys(reduxToggles).length > 0
      ? reduxToggles
      : getDefaultSportsState();
  });

  // Initialize sports state to Redux if empty
  useEffect(() => {
    if (!reduxToggles || Object.keys(reduxToggles).length === 0) {
      dispatch(setToggles(getDefaultSportsState()));
    }
  }, [dispatch, reduxToggles]);

  // Memoized computations - split by type to prevent unnecessary recalculations
  const stocksSelected = useMemo(
    () =>
      Object.entries(financeState.stocks?.customSelections || {})
        .filter(([, enabled]) => enabled)
        .map(([key]) => key),
    [financeState.stocks?.customSelections]
  );

  const cryptoSelected = useMemo(
    () =>
      Object.entries(financeState.crypto?.customSelections || {})
        .filter(([, enabled]) => enabled)
        .map(([key]) => key),
    [financeState.crypto?.customSelections]
  );

  const getSelected = useCallback(
    (type) => (type === "stocks" ? stocksSelected : cryptoSelected),
    [stocksSelected, cryptoSelected]
  );

  const getFilteredOptions = useMemo(() => {
    const filterOptions = (type) => {
      const options = type === "stocks" ? STOCK_OPTIONS : CRYPTO_OPTIONS;
      const term = financeState[type]?.searchTerm?.toLowerCase() || "";
      if (!term) return options;

      return options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(term) ||
          opt.key.toLowerCase().includes(term)
      );
    };

    return {
      stocks: filterOptions("stocks"),
      crypto: filterOptions("crypto"),
    };
  }, [financeState.stocks?.searchTerm, financeState.crypto?.searchTerm]);

  // Debounced search input
  const handleSearchChange = useCallback(
    (type, value) => {
      dispatch(setFinanceSearch({ category: type, term: value }));
    },
    [dispatch]
  );

  const openModal = useCallback(
    (type) => {
      dispatch(setFinancePreset({ category: type, preset: "custom" }));
      const dialog = document.getElementById(`my_modal_${type}`);
      dialog?.showModal();
    },
    [dispatch]
  );

  const toggleSport = useCallback((key) => {
    setSelectedSports((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Sync sports changes to Redux
  useEffect(() => {
    dispatch(setToggles(selectedSports));
  }, [selectedSports, dispatch]);

  // RSS handlers
  const handleRssSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!rssFormData.name || !rssFormData.url) return;

      const result = await addFeed(rssFormData);
      if (result.success) {
        setRssFormData({ name: "", url: "", category: "General" });
      }
    },
    [rssFormData, addFeed]
  );

  const handleRssInputChange = useCallback((field, value) => {
    setRssFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const openRssModal = useCallback(() => {
    const dialog = document.getElementById("rss_modal");
    dialog?.showModal();
  }, []);

  // Memoized components to prevent unnecessary re-renders
  const renderPresetOptions = useCallback(
    (type) => {
      const presets = type === "stocks" ? STOCK_PRESETS : CRYPTO_PRESETS;
      const icon = type === "stocks" ? "📈" : "₿";
      const label = type === "stocks" ? "Stocks" : "Crypto";
      const settings = financeState[type] || {
        enabled: false,
        activePreset: null,
      };
      const selectedCount = getSelected(type).length;

      return (
        <div>
          <label
            className={`${
              !settings.enabled ? "text-base-content/50" : "text-base-content"
            } .label btn btn-ghost justify-between flex items-center`}
          >
            {icon} {label}
            <input
              type="checkbox"
              className="toggle"
              checked={settings.enabled}
              onChange={() => {
                dispatch(toggleFinanceCategory({ category: type }));
              }}
            />
          </label>

          {settings.enabled && (
            <div className="space-y-2 p-2 ml-2 border-l border-base-300/50">
              {presets.map((preset) => (
                <label
                  key={preset.key}
                  className={`${
                    settings.activePreset === preset.key
                      ? "text-base-content"
                      : "text-base-content/50"
                  } label cursor-pointer justify-start gap-3`}
                >
                  <input
                    type="radio"
                    name={`${type}-preset`}
                    className="radio radio-sm"
                    checked={settings.activePreset === preset.key}
                    onChange={() => {
                      dispatch(
                        setFinancePreset({ category: type, preset: preset.key })
                      );
                    }}
                  />
                  <span className="label-text">{preset.label}</span>
                </label>
              ))}
              <label
                className={`${
                  settings.activePreset === "custom"
                    ? "text-base-content"
                    : "text-base-content/50"
                } label cursor-pointer justify-start gap-3`}
              >
                <input
                  type="radio"
                  name={`${type}-preset`}
                  className="radio radio-sm"
                  checked={settings.activePreset === "custom"}
                  onChange={() => openModal(type)}
                  onClick={() => openModal(type)}
                />
                <span className="label-text">{selectedCount} selected</span>
              </label>
            </div>
          )}
        </div>
      );
    },
    [financeState, getSelected, openModal, dispatch]
  );

  // Only render modals when needed
  const renderModal = useCallback(
    (type) => {
      const options = type === "stocks" ? STOCK_OPTIONS : CRYPTO_OPTIONS;
      const filtered = getFilteredOptions[type];
      const title = type === "stocks" ? "Stock" : "Crypto";
      const placeholder =
        type === "stocks"
          ? "Search stocks by name or symbol..."
          : "Search cryptocurrencies by name or symbol...";
      const settings = financeState[type] || {
        searchTerm: "",
        customSelections: {},
      };
      const selectedCount = getSelected(type).length;

      return (
        <dialog id={`my_modal_${type}`} className="modal">
          <div className="modal-box max-w-2xl">
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                ✕
              </button>
            </form>
            <h3 className="font-bold text-lg">Custom {title} Selection</h3>

            <div className="form-control w-full my-4">
              <input
                type="text"
                placeholder={placeholder}
                className="input input-bordered w-full"
                defaultValue={settings.searchTerm}
                onChange={(e) => handleSearchChange(type, e.target.value)}
              />
            </div>

            <div className="flex gap-2 mb-4">
              <button
                className="btn btn-sm btn-outline"
                onClick={() =>
                  dispatch(
                    toggleAllFinanceSelections({
                      category: type,
                      selectAll: true,
                    })
                  )
                }
              >
                Select All
              </button>
              <button
                className="btn btn-sm btn-outline"
                onClick={() =>
                  dispatch(
                    toggleAllFinanceSelections({
                      category: type,
                      selectAll: false,
                    })
                  )
                }
              >
                Deselect All
              </button>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() =>
                  dispatch(resetFinanceSelections({ category: type }))
                }
              >
                Reset to Default
              </button>
              {settings.searchTerm && (
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() =>
                    dispatch(setFinanceSearch({ category: type, term: "" }))
                  }
                >
                  Clear Search
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="text-center text-base-content/50 py-4">
                  No {type} found matching your search
                </div>
              ) : (
                filtered.map((option) => (
                  <label
                    key={option.key}
                    className={`${
                      settings.customSelections[option.key]
                        ? "bg-base-200"
                        : "bg-base-200/50"
                    } label cursor-pointer justify-start gap-3 btn btn-ghost text-left`}
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={settings.customSelections[option.key] || false}
                      onChange={() =>
                        dispatch(
                          toggleFinanceSelection({
                            category: type,
                            key: option.key,
                          })
                        )
                      }
                    />
                    <div className="flex flex-col items-start">
                      <span className="label-text font-semibold">
                        {option.key}
                      </span>
                      <span className="label-text text-sm text-base-content/70">
                        {option.label}
                      </span>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="text-sm text-base-content/70 mt-4 flex justify-between">
              <span>
                {selectedCount} of {options.length} {type} selected
              </span>
              {settings.searchTerm && (
                <span>Showing {filtered.length} results</span>
              )}
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      );
    },
    [
      financeState,
      getFilteredOptions,
      getSelected,
      handleSearchChange,
      dispatch,
    ]
  );

  // Memoized sports section
  const sportsSection = useMemo(
    () => (
      <fieldset className="fieldset bg-base-100 border-base-300 rounded-box w-full border p-4">
        <legend className="fieldset-legend text-lg">Sports</legend>
        <div className="grid grid-cols-2 gap-4">
          {SPORTS_OPTIONS.map((sport) => (
            <label
              key={sport.key}
              className={`${
                !selectedSports[sport.key]
                  ? "text-base-content/50"
                  : "text-base-content"
              } .label btn btn-ghost justify-between flex items-center`}
            >
              {sport.icon} {sport.label}
              <input
                type="checkbox"
                className="toggle"
                checked={selectedSports[sport.key] || false}
                onChange={() => toggleSport(sport.key)}
              />
            </label>
          ))}
        </div>
      </fieldset>
    ),
    [selectedSports, toggleSport]
  );

  return (
    <>
      <label className="tab">
        <input
          type="radio"
          name="my_tabs_3"
          className="tab"
          aria-label="Tab 2"
        />
        <ComputerDesktopIcon className="size-8" />
      </label>
      <div className="tab-content bg-base-100 border-base-300 p-2 space-y-6 overflow-hidden max-h-120">
        <div className="overflow-y-auto p-2 h-110">
          {/* Sports Section */}
          {sportsSection}

          {/* Finance Section */}
          <fieldset className="fieldset bg-base-100 border-base-300 rounded-box w-full border p-4">
            <legend className="fieldset-legend text-lg">Finance</legend>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {renderPresetOptions("stocks")}
              {renderPresetOptions("crypto")}
            </div>
          </fieldset>

          <fieldset className="fieldset bg-base-100 border-base-300 space-y-2 rounded-box w-full border p-4">
            <legend className="fieldset-legend text-lg">RSS</legend>
            {!isAuthenticated ? (
              <div className="text-center py-4">
                <p className="text-base-content/70 mb-3">
                  Login to manage your RSS feeds
                </p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    // Switch to accounts tab
                    const accountsTab = document.querySelector(
                      'input[aria-label="Tab 4"]'
                    );
                    if (accountsTab) accountsTab.click();
                  }}
                >
                  Login to Account
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label
                    className={`${
                      !rssState?.enabled
                        ? "text-base-content/50"
                        : "text-base-content"
                    } .label btn btn-ghost justify-between flex items-center`}
                  >
                    📡 RSS Feeds
                    <input
                      type="checkbox"
                      className="toggle"
                      checked={rssState?.enabled}
                      onChange={() =>
                        dispatch(setRssEnabled(!rssState?.enabled))
                      }
                    />
                  </label>

                  {rssState?.enabled && (
                    <div className="space-y-2 p-2 ml-2 border-l border-base-300/50">
                      <form onSubmit={handleRssSubmit} className="space-y-2">
                        <label className="floating-label">
                          <span>Feed Name</span>
                          <input
                            type="text"
                            placeholder="My News Feed"
                            className="input input-sm w-full"
                            value={rssFormData.name}
                            onChange={(e) =>
                              handleRssInputChange("name", e.target.value)
                            }
                          />
                        </label>
                        <label className="floating-label">
                          <span>RSS Feed URL</span>
                          <input
                            type="url"
                            placeholder="https://example.com/rss.xml"
                            className="input input-sm w-full"
                            value={rssFormData.url}
                            onChange={(e) =>
                              handleRssInputChange("url", e.target.value)
                            }
                          />
                        </label>
                        <label className="floating-label">
                          <span>Category</span>
                          <select
                            className="select select-sm w-full"
                            value={rssFormData.category}
                            onChange={(e) =>
                              handleRssInputChange("category", e.target.value)
                            }
                          >
                            <option value="General">General</option>
                            <option value="Tech">Tech</option>
                            <option value="News">News</option>
                            <option value="Sports">Sports</option>
                            <option value="Finance">Finance</option>
                          </select>
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="btn btn-sm btn-primary flex-1"
                            disabled={
                              isLoading || !rssFormData.name || !rssFormData.url
                            }
                          >
                            {isLoading ? "Adding..." : "Add to Collection"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={openRssModal}
                            disabled={feeds.length === 0}
                          >
                            Select (
                            {
                              Object.values(
                                rssState?.customSelections || {}
                              ).filter(Boolean).length
                            }
                            )
                          </button>
                        </div>
                      </form>

                      {error && (
                        <div className="alert alert-error alert-sm">
                          <span className="text-xs">{error}</span>
                        </div>
                      )}

                      {feeds.length > 0 && (
                        <div className="text-xs text-base-content/50">
                          {feeds.length} feed{feeds.length !== 1 ? "s" : ""} in
                          collection
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </fieldset>

          <fieldset className="fieldset bg-base-100 border-base-300 space-y-2 rounded-box w-full border p-4">
            <legend className="fieldset-legend text-lg">
              Fantasy{" "}
              <span className="text-base-content/50 text-sm italic">
                *coming soon*
              </span>
            </legend>
            {!isAuthenticated ? (
              <div className="text-center py-4">
                <p className="text-base-content/70 mb-3">
                  Login to manage your Fantasy teams
                </p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    // Switch to accounts tab
                    const accountsTab = document.querySelector(
                      'input[aria-label="Tab 4"]'
                    );
                    if (accountsTab) accountsTab.click();
                  }}
                >
                  Login to Account
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {["Yahoo", "ESPN", "Sleeper", "CBS"].map((provider) => (
                  <button key={provider} className="btn btn-sm">
                    {provider}
                  </button>
                ))}
              </div>
            )}
          </fieldset>
        </div>
      </div>

      {renderModal("stocks")}
      {renderModal("crypto")}

      {/* RSS Selection Modal */}
      <dialog id="rss_modal" className="modal">
        <div className="modal-box max-w-2xl">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          <h3 className="font-bold text-lg">RSS Feed Selection</h3>

          <div className="form-control w-full my-4">
            <input
              type="text"
              placeholder="Search RSS feeds by name or category..."
              className="input input-bordered w-full"
              value={rssState?.searchTerm || ""}
              onChange={(e) => dispatch(setRssSearch(e.target.value))}
            />
          </div>

          <div className="flex gap-2 mb-4">
            <button
              className="btn btn-sm btn-outline"
              onClick={() => dispatch(toggleAllRssSelections(true))}
            >
              Select All
            </button>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => dispatch(toggleAllRssSelections(false))}
            >
              Deselect All
            </button>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => dispatch(resetRssSelections())}
            >
              Reset to Default
            </button>
            {rssState?.searchTerm && (
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => dispatch(setRssSearch(""))}
              >
                Clear Search
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {feeds.length === 0 ? (
              <div className="text-center text-base-content/50 py-4">
                No RSS feeds in your collection. Add some feeds first!
              </div>
            ) : (
              feeds
                .filter((feed) => {
                  const searchTerm = (rssState?.searchTerm || "").toLowerCase();
                  if (!searchTerm) return true;
                  return (
                    feed.name.toLowerCase().includes(searchTerm) ||
                    feed.category.toLowerCase().includes(searchTerm)
                  );
                })
                .map((feed) => (
                  <div
                    key={feed.id}
                    className={`${
                      rssState.customSelections?.[feed.id]
                        ? "bg-base-200"
                        : "bg-base-200/50"
                    } p-3 rounded-lg flex items-center justify-between`}
                  >
                    <label className="cursor-pointer flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={rssState.customSelections?.[feed.id] || false}
                        onChange={() => dispatch(toggleRssSelection(feed.id))}
                      />
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">{feed.name}</span>
                        <span className="text-sm text-base-content/70">
                          {feed.category}
                        </span>
                        <span className="text-xs text-base-content/50 break-all">
                          {feed.url}
                        </span>
                      </div>
                    </label>
                    <button
                      className="btn btn-sm btn-ghost btn-square text-error"
                      onClick={() => deleteFeed(feed.id)}
                      title="Delete RSS feed"
                    >
                      ✕
                    </button>
                  </div>
                ))
            )}
          </div>

          <div className="text-sm text-base-content/70 mt-4 flex justify-between">
            <span>
              {
                Object.values(rssState?.customSelections || {}).filter(Boolean)
                  .length
              }{" "}
              of {feeds.length} RSS feeds selected
            </span>
            {rssState?.searchTerm && (
              <span>
                Showing{" "}
                {
                  feeds.filter((feed) => {
                    const searchTerm = (
                      rssState?.searchTerm || ""
                    ).toLowerCase();
                    return (
                      feed.name.toLowerCase().includes(searchTerm) ||
                      feed.category.toLowerCase().includes(searchTerm)
                    );
                  }).length
                }{" "}
                results
              </span>
            )}
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
