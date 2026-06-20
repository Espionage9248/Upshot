import type { ReactNode } from "react";
import { TopBar } from "@/components/top-bar";

// Reads session at request time via the (app) layout; pin here too so the
// route is never statically prerendered (mirrors budget/page.tsx).
export const dynamic = "force-dynamic";

export default function PlanPage(): ReactNode {
  return (
    <>
      <TopBar title="Plan" sub="WHAT YOU OWE & INTEND" />
      <section aria-label="Plan overview" />
    </>
  );
}
