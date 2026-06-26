import type { ReactNode } from "react";
import { AnalyseNavRail } from "@/components/analyse/analyse-nav-rail";

/**
 * Analyse section shell. The (app) layout already renders the primary rail
 * (which highlights the Analyse entry for any /analyse path); this layout adds
 * the 230px section nav (Reports · Analytics) and a content pane.
 *
 * Server Component: the active-section highlight is derived client-side in
 * AnalyseNavRail via usePathname(). Mirrors plan/layout.tsx.
 */
export default function AnalyseLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <div style={{ display: "flex", gap: 28, flex: 1, minHeight: 0 }}>
      <AnalyseNavRail />
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
  );
}
