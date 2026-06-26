"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose, Button, UIcon, type UIconKey } from "@upshot/ui";

export type ConfirmKind = "lock" | "promote" | "unlock";

const CFG: Record<ConfirmKind, { icon: UIconKey; title: string; body: string; cta: string; danger: boolean }> = {
  lock: {
    icon: "lock",
    title: "Lock in this plan?",
    body: "This freezes the current payoff curve as your one tracked plan. Each month Upshot measures your real progress against it. You can re-model or unlock anytime — your what-ifs stay untouched.",
    cta: "Lock it in",
    danger: false,
  },
  promote: {
    icon: "lock",
    title: "Make this your tracked plan?",
    body: "Promoting replaces your current locked plan with this scenario, recomputed against today’s balances. The old plan’s tracking history is kept in activity.",
    cta: "Promote & lock",
    danger: false,
  },
  unlock: {
    icon: "unlock",
    title: "Unlock your plan?",
    body: "You’ll stop tracking progress against it and go back to free modelling. The plan is saved to your scenarios so you don’t lose it.",
    cta: "Unlock",
    danger: true,
  },
};

export function ConfirmDialog({
  kind,
  open,
  onOpenChange,
  onConfirm,
  pending = false,
}: {
  kind: ConfirmKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pending?: boolean;
}): React.ReactElement {
  const cfg = CFG[kind];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div
          aria-hidden
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            background: "var(--coral-dim)",
            color: "var(--coral-text)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <UIcon name={cfg.icon} size={22} />
        </div>
        <DialogTitle style={{ fontSize: 18 }}>{cfg.title}</DialogTitle>
        <DialogDescription style={{ fontSize: 13.5 }}>{cfg.body}</DialogDescription>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button variant={cfg.danger ? "danger" : "primary"} disabled={pending} onClick={onConfirm}>
            {cfg.cta}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
