"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@upshot/ui";
import { updateInstallmentNotesAction } from "@/server-actions/installments";

/** Inline editor for a BNPL plan's free-text note. */
export function InstallmentNotesEditor({ id, notes }: { id: string; notes: string | null }): ReactNode {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(notes ?? "");

  function save() {
    startTransition(async () => {
      await updateInstallmentNotesAction(id, value.trim() || null);
      router.refresh();
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{notes || "No note"}</span>
        <Button variant="ghost" size="sm" aria-label="Edit BNPL note" onClick={() => setEditing(true)}>
          {notes ? "Edit note" : "Add note"}
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <Input
        aria-label="BNPL note"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a note"
        style={{ height: 28, fontSize: 12 }}
      />
      <Button variant="ghost" size="sm" onClick={save} disabled={pending}>
        Save
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setValue(notes ?? "");
          setEditing(false);
        }}
      >
        Cancel
      </Button>
    </div>
  );
}
