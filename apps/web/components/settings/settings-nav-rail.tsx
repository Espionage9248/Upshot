"use client";

import { usePathname } from "next/navigation";
import { SettingsNav } from "@upshot/ui";

/**
 * The Settings section nav (230px). Web-owns the item list: in Phase 3 only
 * Connections & sync (/settings) and Sync & activity (/settings/sync-activity)
 * are live; the other five mirror the design IA but point at placeholder routes
 * that 404 until their phases land. Reads the pathname to highlight the active
 * section, keeping the layout a Server Component.
 */
const SETTINGS_SECTIONS = [
  { label: "Account & profile", href: "/settings/account" },
  { label: "Connections & sync", href: "/settings" },
  { label: "Rules", href: "/settings/rules" },
  { label: "Budgeting & goals", href: "/settings/budget" },
  { label: "Debts & purchases", href: "/settings/debt" },
  { label: "Tax", href: "/settings/tax" },
  { label: "Data & export", href: "/settings/data" },
  { label: "Sync & activity", href: "/settings/sync-activity" },
];

export function SettingsNavRail() {
  const pathname = usePathname();
  const activeHref = pathname === "/settings" ? "/settings" : pathname;
  return (
    <SettingsNav
      items={SETTINGS_SECTIONS}
      activeHref={activeHref}
      className="w-[230px] shrink-0"
    />
  );
}
