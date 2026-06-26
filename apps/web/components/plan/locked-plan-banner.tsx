"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ReadinessGauge, Confidence, Button, UIcon, Money } from "@upshot/ui";
import type { PlanningData } from "@/app/(app)/plan/debts/planning-data";
import { unlockPayoffPlanAction } from "@/server-actions/planner";
import { toastResult } from "@/lib/toast-result";
import { ConfirmDialog } from "./confirm-dialog";

function formatMonth(m: string | null): string {
  if (!m) return "—";
  const d = new Date(m + "-01");
  const mon = d.toLocaleDateString("en-AU", { month: "short" });
  const yy = String(d.getFullYear()).slice(-2);
  return `${mon} '${yy}`;
}

export function LockedPlanBanner({
  locked,
  onRemodel,
}: {
  locked: NonNullable<PlanningData["lockedPlan"]>;
  onRemodel: () => void;
}): React.ReactElement {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);

  // % paid
  const pctPaid =
    locked.lockBalanceCents > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              ((locked.lockBalanceCents - locked.currentBalanceCents) /
                locked.lockBalanceCents) *
                100,
            ),
          ),
        )
      : 0;

  // Confidence level
  const level: "on" | "at" | "off" =
    locked.status === "behind"
      ? "off"
      : locked.status === "on-track" && locked.contributionsShortfallCents > 0
        ? "at"
        : "on";

  // Slip copy
  const slip =
    locked.slipMonths === 0
      ? "● on schedule"
      : locked.slipMonths < 0
        ? `▲ ${-locked.slipMonths} mo early`
        : `▼ ${locked.slipMonths} mo late`;

  const slipTone =
    locked.status === "behind"
      ? "var(--expense)"
      : locked.status === "ahead"
        ? "var(--income)"
        : "var(--warn)";

  // Read line
  const readLine =
    locked.status === "ahead"
      ? "You're ahead of plan"
      : locked.status === "behind"
        ? "You've slipped behind"
        : "You're on track";

  // Nudge icon
  const nudgeIcon = locked.status === "behind" ? "alert" : "sparkle";

  function onConfirmUnlock() {
    startTransition(async () => {
      const res = await unlockPayoffPlanAction();
      toastResult(
        res,
        { tone: "neutral", title: "Plan unlocked", body: "Saved to your scenarios." },
        { tone: "warn", title: "Couldn't unlock" },
      );
      setDialogOpen(false);
      router.refresh();
    });
  }

  return (
    <section
      aria-label="Locked debt plan"
      style={{
        borderRadius: "var(--radius-card)",
        border: "1px solid color-mix(in oklch, var(--coral) 30%, transparent)",
        background:
          "linear-gradient(180deg, var(--coral-dim), transparent 70%), var(--surface)",
        boxShadow: "var(--elev-2)",
        padding: 20,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Left coral accent edge */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: "var(--coral)",
        }}
      />

      {/* Top row: left cluster + right actions */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        {/* Left cluster: gauge + info */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <ReadinessGauge percent={pctPaid} sub="paid" size={84} />
          <div>
            {/* Eyebrow */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 5,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.06em",
                color: "var(--coral-text)",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              <UIcon name="lock" size={13} />
              Your tracked plan
            </div>
            {/* Debt-free by date */}
            <div
              style={{
                fontSize: 21,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
              }}
            >
              Debt-free by{" "}
              <span
                className="tnum"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {formatMonth(locked.projectedDebtFreeMonth)}
              </span>
            </div>
            {/* Confidence + divider + slip */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 8,
              }}
            >
              <Confidence level={level} compact />
              <span
                aria-hidden
                style={{ width: 1, height: 13, background: "var(--line)" }}
              />
              <span
                className="tnum"
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: slipTone,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {slip}
              </span>
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Button variant="secondary" leadingIcon="sliders" onClick={onRemodel}>
            Re-model
          </Button>
          <Button
            variant="ghost"
            leadingIcon="unlock"
            onClick={() => setDialogOpen(true)}
          >
            Unlock
          </Button>
        </div>
      </div>

      {/* Nudge row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          marginTop: 16,
          padding: "12px 14px",
          borderRadius: "var(--radius-data)",
          background: "var(--surface-2)",
          border: "1px solid var(--line-soft)",
        }}
      >
        <span
          aria-hidden
          style={{ color: slipTone, flexShrink: 0, marginTop: 1 }}
        >
          <UIcon name={nudgeIcon} size={16} />
        </span>
        <span
          style={{
            fontSize: 12.5,
            color: "var(--text-2)",
            lineHeight: 1.45,
          }}
        >
          {locked.contributionsShortfallCents > 0 ? (
            <>
              {readLine}. You&rsquo;re behind on contributions this month by{" "}
              <Money cents={locked.contributionsShortfallCents} size={12.5} weight={700} />
              . Add it to stay on the curve.
            </>
          ) : locked.status === "ahead" ? (
            "Keeping ahead of plan — nice work."
          ) : (
            "On plan this month. Keep your contributions coming."
          )}
        </span>
      </div>

      <ConfirmDialog
        kind="unlock"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={onConfirmUnlock}
        pending={pending}
      />
    </section>
  );
}
