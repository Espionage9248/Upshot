import type { ReactElement } from "react";
import { Badge, type BadgeTone } from "@upshot/ui";

export interface TxFlagsProps {
  isSalary: boolean;
  isTransfer: boolean;
  isInterest: boolean;
  isTaxDeductible: boolean;
}

/** The four transaction flags, each rendered as a semantic Badge (label-carried — never colour-only). */
const FLAGS: { key: keyof TxFlagsProps; label: string; tone: BadgeTone }[] = [
  { key: "isSalary", label: "Salary", tone: "income" },
  { key: "isTransfer", label: "Transfer", tone: "transfer" },
  { key: "isInterest", label: "Interest", tone: "saved" },
  { key: "isTaxDeductible", label: "Tax-deductible", tone: "coral" },
];

/**
 * Flag chips for a ledger row — salary / transfer / interest / tax-deductible.
 * Presentational only (server-safe): renders a Badge per active flag.
 */
export function TxFlags(props: TxFlagsProps): ReactElement {
  return (
    <span style={{ display: "inline-flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      {FLAGS.filter((f) => props[f.key]).map((f) => (
        <Badge key={f.key} tone={f.tone}>
          {f.label}
        </Badge>
      ))}
    </span>
  );
}
