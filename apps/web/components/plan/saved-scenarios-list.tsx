"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UIcon, Money } from "@upshot/ui";
import type { PlanningData } from "@/app/(app)/plan/debts/planning-data";
import type { ScenarioInputs } from "@upshot/db";
import { promoteScenarioToPlanAction, deletePlanningScenarioAction } from "@/server-actions/planner";
import { toastResult } from "@/lib/toast-result";
import { ScenarioCard } from "./scenario-card";
import { ConfirmDialog } from "./confirm-dialog";

export function SavedScenariosList({
  scenarios,
  lockedPlan,
  onOpen,
}: {
  scenarios: PlanningData["scenarios"];
  lockedPlan: PlanningData["lockedPlan"];
  onOpen: (seed: ScenarioInputs, name: string) => void;
}): React.ReactElement {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [promoteId, setPromoteId] = useState<string | null>(null);

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deletePlanningScenarioAction(id);
      toastResult(res, { tone: "neutral", title: "Scenario deleted" }, { tone: "warn", title: "Couldn't delete" });
      router.refresh();
    });
  }

  function handleConfirmPromote() {
    if (!promoteId) return;
    startTransition(async () => {
      const res = await promoteScenarioToPlanAction(promoteId);
      toastResult(
        res,
        { tone: "locked", title: "Plan locked", body: "Now tracking this scenario." },
        { tone: "warn", title: "Couldn't promote" },
      );
      setPromoteId(null);
      router.refresh();
    });
  }

  const isEmpty = scenarios.length === 0 && !lockedPlan;

  if (isEmpty) {
    return (
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Saved scenarios
        </div>
        <div
          style={{
            borderRadius: "var(--radius-card)",
            border: "1px dashed var(--line)",
            padding: "28px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "var(--surface-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-3)",
            }}
          >
            <UIcon name="plan" size={21} />
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-2)" }}>No saved scenarios yet</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", maxWidth: 320, lineHeight: 1.45 }}>
            Tune the planner above and hit <b>Save as scenario</b> to keep a budget you can come back to and compare.
          </div>
        </div>
      </div>
    );
  }

  const lockedCardElement = lockedPlan ? (
    lockedPlan.inputs === null ? (
      <LockedCardNullInputs
        debtFreeMonth={lockedPlan.projectedDebtFreeMonth}
        extraPaymentCents={lockedPlan.extraPaymentCents}
      />
    ) : (
      <ScenarioCard
        key="locked"
        name="Tracked plan"
        debtFreeMonth={lockedPlan.projectedDebtFreeMonth}
        extraPaymentCents={lockedPlan.extraPaymentCents}
        interestSavedCents={0}
        isLocked
        onOpen={() => onOpen(lockedPlan.inputs!, "Tracked plan")}
        pending={pending}
      />
    )
  ) : null;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Saved scenarios
        </div>
        {scenarios.length > 0 && (
          <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
            {scenarios.length} what-if{scenarios.length === 1 ? "" : "s"} · recomputed live
          </span>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(248px, 1fr))",
          gap: 12,
        }}
      >
        {lockedCardElement}
        {scenarios.map((s) => (
          <ScenarioCard
            key={s.id}
            name={s.name}
            debtFreeMonth={s.debtFreeMonth}
            extraPaymentCents={s.extraPaymentCents}
            interestSavedCents={s.interestSavedCents}
            isLocked={false}
            onOpen={() => onOpen(s.inputs, s.name)}
            onPromote={() => setPromoteId(s.id)}
            onDelete={() => handleDelete(s.id)}
            pending={pending}
          />
        ))}
      </div>

      <ConfirmDialog
        kind="promote"
        open={promoteId !== null}
        onOpenChange={(open) => { if (!open) setPromoteId(null); }}
        onConfirm={handleConfirmPromote}
        pending={pending}
      />
    </div>
  );
}

/** Locked card variant for when lockedPlan.inputs is null (legacy row) — Open is disabled. */
function LockedCardNullInputs({
  debtFreeMonth,
  extraPaymentCents,
}: {
  debtFreeMonth: string | null;
  extraPaymentCents: number;
}): React.ReactElement {
  return (
    <div
      style={{
        borderRadius: "var(--radius-data)",
        padding: 15,
        border: "1px solid color-mix(in oklch, var(--coral) 38%, transparent)",
        background: "var(--coral-dim)",
        position: "relative",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: "var(--coral-text)",
          }}
        >
          <UIcon name="lock" size={11} />
          LOCKED
        </span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            flex: 1,
            minWidth: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Tracked plan
        </span>
      </div>
      {/* Stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 600, marginBottom: 2 }}>DEBT-FREE</div>
          <div className="tnum" style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--coral-text)" }}>
            {debtFreeMonth ? (() => { const d = new Date(debtFreeMonth + "-01"); return `${d.toLocaleDateString("en-AU", { month: "short" })} '${String(d.getFullYear()).slice(-2)}`; })() : "—"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 600, marginBottom: 2 }}>EXTRA/MO</div>
          <div className="tnum" style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
            <Money cents={extraPaymentCents} size={14} weight={700} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 600, marginBottom: 2 }}>SAVES</div>
          <span className="tnum" style={{ fontSize: 13.5, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-3)" }}>—</span>
        </div>
      </div>
      {/* Footer */}
      <div style={{ fontSize: 10.5, color: "var(--text-3)", marginBottom: 12, display: "flex", alignItems: "center", gap: 5 }}>
        <UIcon name="repeat" size={11} /> Recomputed against today's balances
      </div>
      {/* Disabled Open */}
      <button
        disabled
        title="Re-model from the banner"
        aria-label="Re-model from the banner"
        style={{
          width: "100%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          fontSize: 12.5,
          fontWeight: 600,
          height: 32,
          padding: "0 12px",
          borderRadius: "var(--radius-data)",
          border: "1px solid var(--line)",
          background: "var(--surface-2)",
          color: "var(--text)",
          opacity: 0.42,
          cursor: "not-allowed",
        }}
      >
        <UIcon name="sliders" size={14} />
        Open
      </button>
    </div>
  );
}
