import { ComputerDesktopIcon, InformationCircleIcon } from "@heroicons/react/24/solid";
import { FinanceSection } from "../../components/FinanceSection.jsx";
import { SportsSection } from "../../components/SportsSection.jsx";
import { RssSection } from "../../components/RssSection.jsx";
import { useAuth } from "../../components/hooks/useAuth.tsx";

export default function DisplayTab() {
  const { isAuthenticated } = useAuth();

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
        <div className="overflow-y-auto p-2 h-110 flex flex-col gap-4">
          {/* Sports Section */}
          <SportsSection />

          {/* Finance Section */}
          <FinanceSection />

          {/* RSS Section */}
          <RssSection />

          <fieldset className="fieldset group bg-base-100 border-base-300 space-y-2 rounded-box w-full border p-4">
            <legend className="fieldset-legend text-center text-lg py-0">
              <div className="tooltip tooltip-bottom card card-border border-base-300 flex-row items-center justify-center gap-1 px-4 py-1 group-hover:bg-base-200 transition-all duration-150">
                <div className="tooltip-content w-60 px-4 py-3">
                  Coming soon: The ability to view your fantasy teams within
                  Scrollr!
                </div>
                <InformationCircleIcon className="size-5 text-base-content/30 group-hover:text-base-content/70 transition-all duration-150" />
                Fantasy{" "}
                <span className="text-base-content/50 text-sm italic">
                  *coming soon*
                </span>
              </div>
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
    </>
  );
}
