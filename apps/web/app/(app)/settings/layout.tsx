import type { ReactNode } from "react";
import { TopBar } from "@/components/top-bar";
import { SettingsNavRail } from "@/components/settings/settings-nav-rail";

/**
 * Settings section shell. The (app) layout already renders the rail (which
 * highlights the gear for any /settings path) + the per-page TopBar slot; this
 * layout adds the "Settings" header + the 230px section nav and a content pane.
 * Wraps both /settings (Connections & sync) and /settings/sync-activity.
 *
 * Server Component: the active-section highlight is derived client-side in
 * SettingsNavRail via usePathname().
 */
export default function SettingsLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <>
      <TopBar title="Settings" sub="SETTINGS" />
      <div style={{ display: "flex", gap: 28, flex: 1, minHeight: 0, marginTop: 22 }}>
        <SettingsNavRail />
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
