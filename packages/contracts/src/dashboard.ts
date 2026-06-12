import { z } from "zod";

export const dashboardWidgetSchema = z.object({
  id: z.string(),
  widgetKey: z.string(),
  position: z.number().int(),
  size: z.string(),
  visible: z.boolean().default(true),
  config: z.record(z.string(), z.unknown()).nullable(),
});
export type DashboardWidget = z.infer<typeof dashboardWidgetSchema>;
