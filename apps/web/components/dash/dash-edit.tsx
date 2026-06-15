"use client";

import type { ReactNode } from "react";
import type { DashboardWidget } from "@/server-actions/dashboard";
import { DashGrid } from "./dash-grid";

/** DashGrid started in arrange/edit mode. Thin wrapper for the /today/arrange route. */
export function DashEdit({ initial }: { initial: DashboardWidget[] }): ReactNode {
  return <DashGrid initial={initial} startEditing />;
}
