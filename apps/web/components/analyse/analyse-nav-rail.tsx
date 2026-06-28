"use client";

import { usePathname } from "next/navigation";

/**
 * The Analyse section nav (230px). Owns the two Analyse sub-routes: Reports
 * (the room index) and Analytics (built in a later task — the link exists now
 * so the sub-nav renders correctly for authenticated users).
 *
 * Reads pathname client-side to highlight the active section, keeping the
 * parent layout a Server Component. Mirrors PlanNavRail.
 */
const ANALYSE_SECTIONS = [
  { label: "Reports", href: "/analyse" },
  { label: "Analytics", href: "/analyse/analytics" },
  { label: "Forecast", href: "/analyse/forecast" },
  { label: "Tax", href: "/analyse/tax" },
  { label: "2Up", href: "/analyse/2up" },
];

export function AnalyseNavRail() {
  const pathname = usePathname();
  return (
    <nav data-app-subnav aria-label="Analyse navigation" className="flex flex-col gap-[2px] w-[230px] shrink-0">
      {ANALYSE_SECTIONS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={[
              "flex items-center gap-[11px] px-[12px] py-[9px]",
              "rounded-[10px] text-[13.5px] outline-none",
              "focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-1",
              isActive
                ? "bg-[var(--coral-dim)] text-[var(--coral-text)] font-semibold shadow-[inset_2px_0_0_var(--coral)]"
                : "text-[var(--text-2)] font-medium hover:bg-[var(--surface-2)]",
            ].join(" ")}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
