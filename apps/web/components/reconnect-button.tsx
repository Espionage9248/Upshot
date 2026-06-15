"use client";

import { Button } from "@upshot/ui";

/**
 * Reconnect the Up bank connection.
 *
 * Up uses Personal Access Tokens, which do not expire on a schedule — they are
 * valid until revoked. A reconnect is only needed when the API rejects the token
 * (HTTP 401/403). The real reconnect flow (re-entering a PAT) lands in Phase 4.3;
 * in Phase 3 this button correctly surfaces the affordance but the flow is a
 * no-op placeholder — it does not fabricate a backend call.
 */
export function ReconnectButton() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      leadingIcon="sync"
      onClick={() => {
        // Phase 4.3: open the PAT re-entry flow. Intentionally inert for now.
      }}
    >
      Reconnect
    </Button>
  );
}
