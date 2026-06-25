"use client";

import { Money, Button, UIcon } from "@upshot/ui";

function formatDebtFreeMonth(m: string | null): string {
  if (!m) return "—";
  const d = new Date(m + "-01");
  const mon = d.toLocaleDateString("en-AU", { month: "short" });
  const yy = String(d.getFullYear()).slice(-2);
  return `${mon} '${yy}`;
}

export function ScenarioCard({
  name,
  debtFreeMonth,
  extraPaymentCents,
  interestSavedCents,
  isLocked,
  onOpen,
  onPromote,
  onDelete,
  pending = false,
}: {
  name: string;
  debtFreeMonth: string | null;
  extraPaymentCents: number;
  interestSavedCents: number;
  isLocked: boolean;
  onOpen: () => void;
  onPromote?: () => void;
  onDelete?: () => void;
  pending?: boolean;
}): React.ReactElement {
  return (
    <div
      style={{
        borderRadius: "var(--radius-data)",
        padding: 15,
        border: isLocked
          ? "1px solid color-mix(in oklch, var(--coral) 38%, transparent)"
          : "1px dashed var(--line)",
        background: isLocked ? "var(--coral-dim)" : "var(--surface)",
        position: "relative",
      }}
    >
      {/* Header: pill + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        {isLocked ? (
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
        ) : (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "var(--text-3)",
            }}
          >
            <UIcon name="sparkle" size={11} />
            WHAT-IF
          </span>
        )}
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
          {name}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
        <div>
          <div
            style={{
              fontSize: 10.5,
              color: "var(--text-3)",
              fontWeight: 600,
              marginBottom: 2,
              whiteSpace: "nowrap",
            }}
          >
            DEBT-FREE
          </div>
          <div
            className="tnum"
            style={{
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: "var(--coral-text)",
            }}
          >
            {formatDebtFreeMonth(debtFreeMonth)}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 10.5,
              color: "var(--text-3)",
              fontWeight: 600,
              marginBottom: 2,
              whiteSpace: "nowrap",
            }}
          >
            EXTRA/MO
          </div>
          <div
            className="tnum"
            style={{
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
            }}
          >
            <Money cents={extraPaymentCents} size={14} weight={700} />
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 10.5,
              color: "var(--text-3)",
              fontWeight: 600,
              marginBottom: 2,
              whiteSpace: "nowrap",
            }}
          >
            SAVES
          </div>
          {isLocked ? (
            <span
              className="tnum"
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: "var(--text-3)",
              }}
            >
              —
            </span>
          ) : (
            <Money cents={interestSavedCents} kind="saved" size={13.5} weight={700} />
          )}
        </div>
      </div>

      {/* Footer line */}
      <div
        style={{
          fontSize: 10.5,
          color: "var(--text-3)",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <UIcon name="repeat" size={11} /> Recomputed against today's balances
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Button
          size="sm"
          variant="secondary"
          leadingIcon="sliders"
          onClick={onOpen}
          disabled={pending}
          style={{ flex: 1 }}
        >
          Open
        </Button>
        {!isLocked && (
          <Button
            size="sm"
            variant="primary"
            leadingIcon="lock"
            onClick={onPromote}
            disabled={pending}
            aria-label="Promote to locked plan"
            style={{ padding: "0 12px" }}
          />
        )}
        {!isLocked && (
          <Button
            size="sm"
            variant="ghost"
            leadingIcon="x"
            onClick={onDelete}
            disabled={pending}
            aria-label="Delete scenario"
            style={{ padding: "0 10px" }}
          />
        )}
      </div>
    </div>
  );
}
