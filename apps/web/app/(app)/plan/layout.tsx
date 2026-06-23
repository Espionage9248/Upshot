import type { ReactNode } from "react";
import { PlanNavRail } from "@/components/plan/plan-nav-rail";

/**
 * Plan section shell. The (app) layout already renders the primary rail
 * (which highlights the Plan entry for any /plan path); this layout adds
 * the 230px section nav (Debts · BNPL · Recurring) and a content pane.
 *
 * Server Component: the active-section highlight is derived client-side in
 * PlanNavRail via usePathname().
 */
export default function PlanLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <div style={{ display: "flex", gap: 28, flex: 1, minHeight: 0 }}>
      <PlanNavRail />
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
