"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@upshot/ui";
import { deletePurchaseAction } from "@/server-actions/purchases";

export function PurchaseDeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      await deletePurchaseAction(id);
      router.refresh();
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Remove from wishlist"
      disabled={pending}
      onClick={handleDelete}
    >
      Remove
    </Button>
  );
}
