"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@upshot/ui";
import { deleteInstallmentPlanAction } from "@/server-actions/installments";

export function InstallmentDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteInstallmentPlanAction(id);
      router.refresh();
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Delete BNPL plan"
      onClick={handleDelete}
      disabled={pending}
    >
      Delete
    </Button>
  );
}
