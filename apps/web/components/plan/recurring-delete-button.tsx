"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@upshot/ui";
import { deleteRecurringAction } from "@/server-actions/recurring";

export function RecurringDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteRecurringAction(id);
      router.refresh();
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Remove recurring item"
      onClick={handleDelete}
      disabled={pending}
    >
      Delete
    </Button>
  );
}
