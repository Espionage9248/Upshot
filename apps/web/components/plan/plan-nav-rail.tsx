"use client";

import { usePathname } from "next/navigation";

/**
 * The Plan section nav (230px). Owns the three Plan sub-routes: Debts,
 * BNPL (/plan/installments), and Recurring. Later tasks add the route pages;
 * the links exist now so the sub-nav renders correctly for authenticated users.
 *
 * Reads pathname client-side to highlight the active section, keeping the
 * parent layout a Server Component.
 */
const PLAN_SECTIONS = [
  { label: "Debts", href: "/plan/debts" },
  { label: "BNPL", href: "/plan/installments" },
  { label: "Recurring", href: "/plan/recurring" },
  { label: "Purchases", href: "/plan/purchases" },
];

export function PlanNavRail() {
  const pathname = usePathname();
  return (
    <nav aria-label="Plan navigation" className="flex flex-col gap-[2px] w-[230px] shrink-0">
      {PLAN_SECTIONS.map((item) => {
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
