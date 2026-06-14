import { cn } from "../lib/cn";

export interface SettingsSection {
  label: string;
  href: string;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { label: "Account & profile", href: "/settings/account" },
  { label: "Connections & sync", href: "/settings/sync" },
  { label: "Budgeting & goals", href: "/settings/budget" },
  { label: "Debts & purchases", href: "/settings/debt" },
  { label: "Tax", href: "/settings/tax" },
  { label: "Data & export", href: "/settings/data" },
  { label: "Sync & activity", href: "/settings/activity" },
];

export interface SettingsNavProps {
  items?: SettingsSection[];
  activeHref?: string;
  className?: string;
}

export function SettingsNav({
  items = SETTINGS_SECTIONS,
  activeHref,
  className,
}: SettingsNavProps) {
  return (
    <nav
      className={cn("flex flex-col gap-[2px]", className)}
      aria-label="Settings navigation"
    >
      {items.map((item) => {
        const isActive = item.href === activeHref;
        return (
          <a
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-[11px] px-[12px] py-[9px]",
              "rounded-[10px] text-[13.5px] outline-none",
              "focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-1",
              isActive
                ? [
                    "bg-[var(--coral-dim)] text-[var(--coral-text)] font-semibold",
                    "shadow-[inset_2px_0_0_var(--coral)]",
                  ]
                : [
                    "text-[var(--text-2)] font-medium",
                    "hover:bg-[var(--surface-2)]",
                  ],
            )}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
