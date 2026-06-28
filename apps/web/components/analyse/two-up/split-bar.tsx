import type { ReactElement } from "react";

export function SplitBar({
  aCents,
  bCents,
  ca,
  cb,
}: {
  aCents: number;
  bCents: number;
  ca: string;
  cb: string;
}): ReactElement {
  const tot = aCents + bCents;
  const aPct = tot > 0 ? (aCents / tot) * 100 : 50;
  const bPct = tot > 0 ? (bCents / tot) * 100 : 50;

  return (
    <div
      style={{
        display: "flex",
        height: 10,
        borderRadius: 999,
        overflow: "hidden",
        background: "var(--surface-3)",
      }}
    >
      <div style={{ width: aPct + "%", background: ca }} />
      <div style={{ width: bPct + "%", background: cb }} />
    </div>
  );
}
