import { z } from "zod";

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
});
export type Category = z.infer<typeof categorySchema>;
