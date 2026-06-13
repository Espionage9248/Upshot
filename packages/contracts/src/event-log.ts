import { z } from "zod";

export const eventLogSchema = z.object({
  id: z.string(),
  category: z.string(),
  action: z.string(),
  entityType: z.string().nullable(),
  entityId: z.string().nullable(),
  entityName: z.string().nullable(),
  description: z.string(),
  before: z.record(z.string(), z.unknown()).nullable(),
  after: z.record(z.string(), z.unknown()).nullable(),
  meta: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string(),
});
export type EventLog = z.infer<typeof eventLogSchema>;
