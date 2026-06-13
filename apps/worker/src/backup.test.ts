import { describe, it, expect } from "vitest";
import { runBackupStub } from "./backup";
import { InMemoryJobRunRepo } from "@upshot/core";

describe("runBackupStub", () => {
  it("records a SUCCESS BACKUP job_run", async () => {
    const jobRuns = new InMemoryJobRunRepo();
    const id = await runBackupStub(jobRuns, { newId: () => "b1", now: () => new Date("2026-06-13T03:00:00.000Z") });
    expect(id).toBe("b1");
    const run = await jobRuns.getById("b1");
    expect(run?.job).toBe("BACKUP");
    expect(run?.status).toBe("SUCCESS");
    expect(run?.finishedAt).toBe("2026-06-13T03:00:00.000Z");
  });
});
