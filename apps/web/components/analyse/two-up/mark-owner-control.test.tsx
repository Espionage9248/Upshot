import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MarkOwnerControl } from "./mark-owner-control";

type ActionFn = (a: unknown) => Promise<{ ok: true; data: undefined }>;
const action = vi.fn<ActionFn>(async () => ({ ok: true, data: undefined }));
vi.mock("@/server-actions/two-up", () => ({ updateTwoUpAttributionAction: (a: unknown) => action(a) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe("MarkOwnerControl", () => {
  it("invokes the action with the chosen owner", async () => {
    render(<MarkOwnerControl id="t1" owner="UNASSIGNED" category={null} />);
    fireEvent.click(screen.getByRole("button", { name: /owner/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: "James" }));
    await waitFor(() => expect(action).toHaveBeenCalledWith({ id: "t1", owner: "JAMES" }));
  });
});
