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
}

export default function LayoutToggle({
  layout,
  position,
  onChange,
  showLabel = true,
  size = "md",
}: LayoutToggleProps) {
  const sizeClasses = {
    sm: "size-10",
    md: "size-12",
    lg: "size-14",
  };

  return (
    <label
      className="swap tooltip"
      data-tip={`Layout: ${layout.charAt(0).toUpperCase() + layout.slice(1)}`}
    >
      <input
        type="checkbox"
        onChange={(e) => onChange(e.target.checked ? "compact" : "comfort")}
        checked={layout === "compact"}
      />
      <div className="flex items-center gap-2 group">
        {showLabel && (
          <span className="label-text-alt text-lg italic">
            {layout.charAt(0).toUpperCase() + layout.slice(1)}
          </span>
        )}
        <div
          className={`flex flex-col ${
            sizeClasses[size]
          } card group-hover:shadow-lg shadow-md overflow-hidden group-hover:scale-115 group-active:scale-85 transition-all duration-150 ${
            position === "top" ? "rotate-180" : "rotate-360"
          }`}
        >
          <div className="h-full bg-base-content flex items-center justify-center">
            {layout === "compact" ? (
              <ArrowsPointingOutIcon className="size-6 text-neutral-content" />
            ) : (
              <ArrowsPointingInIcon className="size-6 text-neutral-content" />
            )}
          </div>
          <div
            className={`bg-primary transition-all duration-150 ${
              layout === "compact" ? "h-1" : "h-1/3"
            }`}
          />
        </div>
      </div>
    </label>
  );
}
