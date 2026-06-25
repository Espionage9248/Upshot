"use client";

import type { ReactElement } from "react";
import type { ScenarioInputs } from "@upshot/db";
import { Segmented, UiSlider, Money, Button, UIcon } from "@upshot/ui";
import { labelMonth, addMonths } from "./planner-atoms";
import type { PlannerPreview } from "./planner-types";

const MONO = "var(--font-mono)";

const MODE_OPTIONS = [
  { value: "FORWARD", label: "Set an amount" },
  { value: "TARGET_DATE", label: "Pick a date" },
];

export function AllocationBlock({
  inputs,
  preview,
  minimumsCents,
  startMonth,
  onPatch,
}: {
  inputs: ScenarioInputs;
  preview: PlannerPreview | null;
  minimumsCents: number;
  startMonth: string;
  onPatch: (p: Partial<ScenarioInputs>) => void;
}): ReactElement {
  const pct = Math.round(inputs.toDebtShareBps / 100);
  const extraCents = preview?.extraPaymentCents ?? 0;
  const headroomCents = preview?.headroomCents ?? 0;
  const raisedExtraCents = preview?.raisedExtraPaymentCents ?? null;
  const unreachable =
    inputs.mode === "TARGET_DATE" &&
    preview != null &&
    (!preview.achievable || preview.overHeadroom);
  // target stepper: default targetMonth to start+12 when not set.
  const target = inputs.targetMonth ?? addMonths(startMonth, 12);

  return (
    <div>
      <Segmented
        options={MODE_OPTIONS}
        value={inputs.mode}
        onValueChange={(v) => onPatch({ mode: v as ScenarioInputs["mode"] })}
        aria-label="Allocation mode"
        fullWidth
      />
      {inputs.mode === "FORWARD" ? (
        <div style={{ marginTop: 16, minHeight: 96 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 12.5, color: "var(--text-2)", fontWeight: 600 }}>
              Extra toward debts
            </span>
            <span style={{ display: "inline-flex", alignItems: "baseline", gap: 7 }}>
              {raisedExtraCents != null ? (
                <>
                  <Money cents={extraCents} kind="neutral" size={14} weight={600} showCents={false} />
                  <span style={{ color: "var(--text-3)" }}>→</span>
                  <Money cents={raisedExtraCents} kind="neutral" size={17} weight={700} showCents={false} />
                </>
              ) : (
                <Money cents={extraCents} kind="neutral" size={17} weight={700} showCents={false} />
              )}
              <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>/mo</span>
            </span>
          </div>
          <UiSlider
            value={[pct]}
            min={0}
            max={100}
            step={1}
            onValueChange={([v]) => onPatch({ toDebtShareBps: (v ?? 0) * 100 })}
            aria-label="Share of spare cash toward debt"
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 9,
              fontSize: 11.5,
              color: "var(--text-3)",
            }}
          >
            <span>{pct}% of spare cash</span>
            <span className="tnum" style={{ fontFamily: MONO }}>
              ${Math.round(headroomCents / 100).toLocaleString()} spare / mo
            </span>
          </div>
          {raisedExtraCents != null && (
            <div style={{ marginTop: 7, fontSize: 11, color: "var(--coral-text)", fontWeight: 600 }}>
              ↑ steps up at your pay rise
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginTop: 16, minHeight: 96 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 12.5, color: "var(--text-2)", fontWeight: 600 }}>
              Be debt-free by
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Button
                size="sm"
                variant="secondary"
                aria-label="Later"
                onClick={() => onPatch({ targetMonth: addMonths(target, 1) })}
                style={{ width: 34, padding: 0 }}
              >
                −
              </Button>
              <span
                className="tnum"
                style={{
                  fontFamily: MONO,
                  fontSize: 14,
                  fontWeight: 700,
                  minWidth: 72,
                  textAlign: "center",
                }}
              >
                {labelMonth(target)}
              </span>
              <Button
                size="sm"
                variant="secondary"
                leadingIcon="plus"
                aria-label="Sooner"
                onClick={() => onPatch({ targetMonth: addMonths(target, -1) })}
                style={{ width: 34, padding: 0 }}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "11px 13px",
              borderRadius: "var(--radius-data)",
              background: unreachable
                ? "color-mix(in oklch, var(--warn) 12%, transparent)"
                : "var(--surface-2)",
              border: unreachable
                ? "1px solid color-mix(in oklch, var(--warn) 30%, transparent)"
                : "1px solid var(--line)",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-2)" }}>You&apos;d need to pay</span>
            <Money
              cents={minimumsCents + extraCents}
              kind="neutral"
              size={15}
              weight={700}
              showCents={false}
            />
          </div>
          {unreachable && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 9,
                marginTop: 10,
                fontSize: 12,
                color: "var(--warn)",
                lineHeight: 1.45,
              }}
            >
              <span style={{ flexShrink: 0, marginTop: 1 }}>
                <UIcon name="alert" size={15} />
              </span>
              <span>
                That&apos;s{" "}
                <b className="tnum" style={{ fontFamily: MONO }}>
                  ${Math.round(Math.max(0, extraCents - headroomCents) / 100).toLocaleString()}
                </b>{" "}
                more than your{" "}
                <b className="tnum">${Math.round(headroomCents / 100).toLocaleString()}</b> spare
                each month. Push the date out, or free up cash above.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
