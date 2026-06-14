import { cn } from "../lib/cn";
import { Money } from "./money";

export interface BillItem {
  id: string;
  name: string;
  sub?: string;
  cents: number;
  daysUntil: number;
}

export interface UpcomingBillsProps {
  bills: BillItem[];
  className?: string;
}

export function UpcomingBills({ bills, className }: UpcomingBillsProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {bills.map((bill) => {
        const isUrgent = bill.daysUntil <= 2;
        const chipColor = isUrgent ? "var(--warn)" : "var(--surface-2)";
        const chipTextColor = isUrgent ? "var(--warn)" : "var(--text-3)";
        const chipBorder = isUrgent
          ? `color-mix(in oklch, var(--warn) 30%, transparent)`
          : "var(--line)";

        return (
          <div
            key={bill.id}
            className="flex items-center gap-3 py-2"
            style={{ borderBottom: "1px solid var(--line-soft)" }}
          >
            {/* day-count chip */}
            <span
              data-daychip=""
              data-warn={isUrgent ? "true" : "false"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 36,
                padding: "3px 7px",
                borderRadius: "var(--radius-data)",
                fontSize: 10,
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: chipTextColor,
                background: `color-mix(in oklch, ${chipColor} 18%, transparent)`,
                border: `1px solid ${chipBorder}`,
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {bill.daysUntil}d
            </span>
            {/* name + sub */}
            <div className="flex flex-col flex-1 min-w-0">
              <span
                style={{
                  fontSize: "var(--text-bodysm)",
                  fontWeight: 600,
                  color: "var(--text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {bill.name}
              </span>
              {bill.sub && (
                <span
                  style={{
                    fontSize: "var(--text-caption)",
                    color: "var(--text-3)",
                  }}
                >
                  {bill.sub}
                </span>
              )}
            </div>
            {/* projected money */}
            <Money cents={bill.cents} kind="projected" size={13} weight={600} />
          </div>
        );
      })}
    </div>
  );
}
