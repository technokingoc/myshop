import { ImageIcon } from "lucide-react";

/**
 * Professional placeholder for missing product/catalog images.
 * Renders a subtle gray box with a centered icon and optional label.
 */
export function PlaceholderImage({
  className = "",
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center bg-slate-100 ${className}`}
    >
      <div className="flex flex-col items-center gap-1">
        <ImageIcon className="h-8 w-8 text-slate-300" />
        {label && (
          <span className="text-xs text-slate-400">{label}</span>
        )}
      </div>
    </div>
  );
}

/**
 * Avatar placeholder showing the first letter of a name in a colored circle.
 */
export function AvatarPlaceholder({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 ${className}`}
    >
      {initial}
    </div>
  );
}
