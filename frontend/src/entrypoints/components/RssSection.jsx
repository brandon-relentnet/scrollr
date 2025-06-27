import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setRssEnabled,
  toggleRssSelection,
  setRssSearch,
  resetRssSelections,
  toggleAllRssSelections,
} from "@/entrypoints/store/rssSlice.js";
import { useAuth } from "@/entrypoints/components/hooks/useAuth.tsx";
import { useRssFeeds } from "@/entrypoints/components/hooks/useRssFeeds.tsx";

export function RssSection() {
  const dispatch = useDispatch();
  const rssState = useSelector((state) => state.rss);
  const { isAuthenticated } = useAuth();
  const { feeds, addFeed, deleteFeed, isLoading, error } = useRssFeeds();

  const [rssFormData, setRssFormData] = useState({
    name: "",
    url: "",
    category: "General",
  });

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

  const handleDeleteFeed = useCallback(
    async (feedId) => {
      await deleteFeed(feedId);
    },
    [deleteFeed]
  );

  return (
    <>
      <fieldset className="fieldset group bg-base-100 border-base-300 space-y-2 rounded-box w-full border p-4">
        <legend className="fieldset-legend text-center text-lg py-0">
          <div className="tooltip tooltip-bottom card card-border border-base-300 flex-row items-center justify-center gap-1 px-4 py-1 group-hover:bg-base-200 transition-all duration-150">
            <div className="tooltip-content w-60 px-4 py-3">
              Add and manage your RSS feeds to stay updated with your favorite
              websites and blogs.
            </div>
            <InformationCircleIcon className="size-5 text-base-content/30 group-hover:text-base-content/70 transition-all duration-150" />
            RSS{" "}
            <span className="text-base-content/50 text-sm italic">
              (Custom Feeds)
            </span>
          </div>
        </legend>

        {!isAuthenticated ? (
          <div className="text-center py-4">
            <p className="text-base-content/70 mb-3">
              Login to manage your RSS feeds
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
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
                  className="toggle toggle-primary"
                  checked={rssState?.enabled}
                  onChange={() => dispatch(setRssEnabled(!rssState?.enabled))}
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
                        <span className="label-text font-medium text-sm">
                          {feed.name}
                        </span>
                        <span className="label-text text-xs text-base-content/50">
                          {feed.category}
                        </span>
                      </div>
                    </label>
                    <button
                      className="btn btn-ghost btn-xs text-error"
                      onClick={() => handleDeleteFeed(feed.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))
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
