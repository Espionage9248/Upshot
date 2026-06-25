import { toast, type ToastInput } from "@upshot/ui";

/** Fire a success toast when an ActionResult succeeded, otherwise an error toast. */
export function toastResult(res: { ok: boolean }, ok: ToastInput, err?: ToastInput): void {
  toast(res.ok ? ok : err ?? { tone: "warn", title: "Something went wrong" });
}
