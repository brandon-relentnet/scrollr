import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setToggles } from "@/entrypoints/store/togglesSlice";
import { SPORTS_OPTIONS } from "@/entrypoints/popup/tabs/data.tsx";

const getDefaultSportsState = () => ({
  NFL: false,
  NBA: false,
  MLB: false,
  NHL: false,
});

export function SportsSection() {
  const dispatch = useDispatch();
  const reduxToggles = useSelector((state) => state.toggles);

  const [selectedSports, setSelectedSports] = useState(() => {
    return reduxToggles && Object.keys(reduxToggles).length > 0
      ? {
          NFL: reduxToggles.NFL || false,
          NBA: reduxToggles.NBA || false,
          MLB: reduxToggles.MLB || false,
          NHL: reduxToggles.NHL || false,
        }
      : getDefaultSportsState();
  });

  const toggleSport = useCallback(
    (key) => {
      setSelectedSports((prev) => {
        const newState = {
          ...prev,
          [key]: !prev[key],
        };

        dispatch(
          setToggles({
            ...reduxToggles,
            [key]: newState[key],
          })
        );

        return newState;
      });
    },
    [dispatch, reduxToggles]
  );

  const sportsSection = useMemo(
    () => (
      <fieldset className="fieldset group bg-base-100 border-base-300 rounded-box w-full border p-4">
        <legend className="fieldset-legend text-center text-lg py-0">
          <div className="tooltip tooltip-bottom card card-border border-base-300 flex-row items-center justify-center gap-1 px-4 py-1 group-hover:bg-base-200 transition-all duration-150">
            <div className="tooltip-content w-60 px-4 py-3">
              Toggle which sports you want to display on Scrollr.
            </div>
            <InformationCircleIcon className="size-5 text-base-content/30 group-hover:text-base-content/70 transition-all duration-150" />
            Sports
          </div>
        </legend>
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
                className="toggle toggle-primary"
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

  return sportsSection;
}
