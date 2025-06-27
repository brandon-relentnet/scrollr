import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/solid";

interface LayoutToggleProps {
  layout: "compact" | "comfort";
  position: "top" | "bottom";
  onChange: (layout: "compact" | "comfort") => void;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function LayoutToggle({
  layout,
  position,
  onChange,
  className = "",
  showLabel = true,
  size = "md",
}: LayoutToggleProps) {
  const sizeClasses = {
    sm: "size-10",
    md: "size-12",
    lg: "size-14",
  };

  return (
    <label className="swap">
      <input
        type="checkbox"
        onChange={(e) => onChange(e.target.checked ? "compact" : "comfort")}
        checked={layout === "compact"}
      />
      <div
        className={`flex items-center gap-2 hover:scale-115 active:scale-95 transition-all duration-150 ${className}`}
        data-tip={`Layout: ${layout.charAt(0).toUpperCase() + layout.slice(1)}`}
      >
        {showLabel && (
          <span className="label-text-alt text-lg italic">
            {layout.charAt(0).toUpperCase() + layout.slice(1)}
          </span>
        )}
        <div
          className={`flex flex-col ${
            sizeClasses[size]
          } card size-14 overflow-hidden bg-base-300 ${
            position === "top" ? "rotate-180" : "rotate-360"
          } transition-transform duration-150`}
        >
          <div className="h-full flex items-center justify-center transition-all duration-150">
            {layout === "compact" ? (
              <ArrowsPointingOutIcon className="size-6 text-primary" />
            ) : (
              <ArrowsPointingInIcon className="size-6 text-primary" />
            )}
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
