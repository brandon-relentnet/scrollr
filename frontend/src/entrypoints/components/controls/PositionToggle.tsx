import { ArrowDownIcon } from "@heroicons/react/24/solid";

interface PositionToggleProps {
  position: "top" | "bottom";
  layout: "compact" | "comfort";
  onChange: (position: "top" | "bottom") => void;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function PositionToggle({
  position,
  layout,
  onChange,
  className = "",
  showLabel = true,
  size = "md",
}: PositionToggleProps) {
  const sizeClasses = {
    sm: "size-10",
    md: "size-12",
    lg: "size-14",
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked ? "bottom" : "top");
  };

  return (
    <label className="swap">
      <input
        type="checkbox"
        onChange={handleChange}
        checked={position === "bottom"}
      />
      <div
        className={`flex items-center gap-2 hover:scale-115 active:scale-95 transition-all duration-150 ${className}`}
        data-tip={`Position: ${
          position.charAt(0).toUpperCase() + position.slice(1)
        }`}
      >
        {showLabel && (
          <span className="label-text-alt text-lg italic">
            {position.charAt(0).toUpperCase() + position.slice(1)}
          </span>
        )}
        <div
          className={`flex flex-col ${
            sizeClasses[size]
          } card bg-base-300 card size-14 overflow-hidden ${
            position === "top" ? "rotate-180" : "rotate-360"
          } transition-transform duration-150`}
        >
          <div className="h-full transition-colors duration-150 flex items-center justify-center">
            <ArrowDownIcon className="size-6 text-primary" />
          </div>
          <div
            className="bg-primary origin-bottom transition-transform duration-300 ease-in-out h-4"
            style={{
              transform: layout === "compact" ? "scaleY(0.25)" : "scaleY(1)",
            }}
          />
        </div>
      </div>
    </label>
  );
}
