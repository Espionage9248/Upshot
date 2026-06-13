import { z } from "zod";
import { ACCOUNT_TYPES, ACCOUNT_OWNERSHIPS, ACCOUNT_ROLES } from "./enums";

export const accountSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(ACCOUNT_TYPES),
  ownership: z.enum(ACCOUNT_OWNERSHIPS),
  balanceCents: z.number().int(),
  role: z.enum(ACCOUNT_ROLES),
  monthlyAllocationCents: z.number().int().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastSyncedAt: z.string().nullable(),
});
export type Account = z.infer<typeof accountSchema>;
export type AccountType = (typeof ACCOUNT_TYPES)[number];
export type AccountOwnership = (typeof ACCOUNT_OWNERSHIPS)[number];
