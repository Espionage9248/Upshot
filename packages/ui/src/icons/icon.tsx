import { ICON_REGISTRY, type UIconKey } from "./registry";

interface UIconProps {
  name: UIconKey;
  size?: number;
  active?: boolean;
  label?: string;
  className?: string;
}

/**
 * Re-skinned Lucide icon wrapper.
 *
 * - stroke 1.6 rest / 1.9 active
 * - round caps & joins
 * - 24px default grid
 * - decorative (no label): aria-hidden
 * - labelled: role="img" + aria-label
 *
 * The `sync` spinner animation is intentionally not baked in here so callers
 * can pass e.g. className="animate-spin motion-reduce:animate-none" (Tailwind).
 */
export function UIcon({
  name,
  size = 24,
  active = false,
  label,
  className,
}: UIconProps) {
  const Icon = ICON_REGISTRY[name];
  const strokeWidth = active ? 1.9 : 1.6;

  if (label !== undefined) {
    return (
      <Icon
        role="img"
        aria-label={label}
        width={size}
        height={size}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      />
    );
  }

  return (
    <Icon
      aria-hidden="true"
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    />
  );
}
