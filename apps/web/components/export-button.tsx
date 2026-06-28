"use client";

import { useTransition } from "react";
import { Button } from "@upshot/ui";
import type { ActionResult } from "@/lib/action";

type CsvResult = { filename: string; csv: string };

export function ExportButton({
  onExport,
  label = "Export CSV",
}: {
  onExport: () => Promise<ActionResult<CsvResult>>;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const res = await onExport();
      if (!res.ok) return;
      const blob = new Blob([res.data.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.data.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <Button variant="ghost" size="sm" className="no-print" onClick={run} disabled={pending}>
      {label}
    </Button>
  );
}

export function PrintButton({ label = "Print / Save as PDF" }: { label?: string }) {
  return (
    <Button variant="ghost" size="sm" className="no-print" onClick={() => window.print()}>
      {label}
    </Button>
  );
}
