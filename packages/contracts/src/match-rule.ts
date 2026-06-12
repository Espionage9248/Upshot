import { z } from "zod";
import { MATCH_FIELDS, MATCH_MODES, MATCH_ACTION_TYPES } from "./enums";

export const matchRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  isActive: z.boolean().default(true),
  priority: z.number().int(),
});
export type MatchRule = z.infer<typeof matchRuleSchema>;

export const matchConditionSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  field: z.enum(MATCH_FIELDS),
  mode: z.enum(MATCH_MODES),
  value: z.string(),
  amountCents: z.number().int().nullable(),
  toleranceCents: z.number().int().nullable(),
  currency: z.string().nullable(),
});
export type MatchCondition = z.infer<typeof matchConditionSchema>;

export const matchActionSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  type: z.enum(MATCH_ACTION_TYPES),
  value: z.string().nullable(),
  targetId: z.string().nullable(),
});
export type MatchAction = z.infer<typeof matchActionSchema>;
