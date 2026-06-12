import { z } from "zod";
import { JOB_NAMES, JOB_STATUSES } from "./enums";

export const jobRunSchema = z.object({
  id: z.string(),
  job: z.enum(JOB_NAMES),
  status: z.enum(JOB_STATUSES),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  cursor: z.string().nullable(),
  counts: z.record(z.string(), z.number()).nullable(),
  error: z.string().nullable(),
  attempt: z.number().int().default(1),
});
export type JobRun = z.infer<typeof jobRunSchema>;
