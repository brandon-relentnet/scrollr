import { ArrowDownIcon } from "@heroicons/react/24/solid";

interface PositionToggleProps {
  position: "top" | "bottom";
  layout: "compact" | "comfort";
  onChange: (position: "top" | "bottom") => void;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function PositionToggle({
  position,
  layout,
  onChange,
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
    <label
      className="swap tooltip"
      data-tip={`Position: ${
        position.charAt(0).toUpperCase() + position.slice(1)
      }`}
    >
      <input
        type="checkbox"
        onChange={handleChange}
        checked={position === "bottom"}
      />
      <div className="flex items-center gap-2 group">
        {showLabel && (
          <span className="label-text-alt text-lg italic">
            {position.charAt(0).toUpperCase() + position.slice(1)}
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
            <ArrowDownIcon className="size-6 text-neutral-content" />
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
