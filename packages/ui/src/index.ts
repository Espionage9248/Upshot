export { cn } from "./lib/cn";
export * from "./icons";
export { Money, type MoneyKind } from "./finance/money";
export { Button, type ButtonProps, type ButtonVariants } from "./primitives/button";
export { Badge, type BadgeProps, type BadgeTone } from "./primitives/badge";
export { Input, type InputProps } from "./primitives/input";
export { Textarea, type TextareaProps } from "./primitives/textarea";
export { UiSelect, type UiSelectProps, type UiSelectOption } from "./primitives/select";
export { UiSwitch, type UiSwitchProps } from "./primitives/switch";
export { UiCheckbox, type UiCheckboxProps } from "./primitives/checkbox";
export { UiSlider, type UiSliderProps } from "./primitives/slider";
export {
  UiTabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "./primitives/tabs";
export { UiProgress, type UiProgressProps } from "./primitives/progress";
export { Skeleton, type SkeletonProps } from "./primitives/skeleton";
export { Alert, type AlertProps, type AlertTone } from "./primitives/alert";
export { Toaster, toast, type ToastInput, type ToastTone } from "./primitives/toast";
export { Card, CardHeader, CardTitle, CardBody } from "./primitives/card";
export {
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  type TRProps,
  type THProps,
  type TDProps,
} from "./primitives/table";
export {
  Dialog,
  DialogTrigger,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./primitives/dialog";
// Raw Radix Dialog namespace for callers needing Portal/Content composition
// (e.g. the top-anchored command palette) without taking a direct radix dep.
export { Dialog as DialogPrimitive } from "radix-ui";
export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetClose,
  type SheetSide,
} from "./primitives/sheet";
export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
} from "./primitives/popover";
export {
  Tooltip,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
} from "./primitives/tooltip";
export { Stat, type StatProps } from "./finance/stat";
export { SyncStatus, type SyncStatusProps, type SyncState } from "./finance/sync-status";
export { Confidence, type ConfidenceProps, type ConfidenceLevel } from "./finance/confidence";
export { ReadinessGauge, type ReadinessGaugeProps } from "./finance/readiness-gauge";
export { InsightCard, type InsightCardProps } from "./finance/insight-card";
export { UpcomingBills, type UpcomingBillsProps, type BillItem } from "./finance/upcoming-bills";
export { EmptyState, type EmptyStateProps } from "./finance/empty-state";
export {
  Segmented,
  type SegmentedProps,
  type SegmentedOption,
} from "./shell/segmented";
export {
  ToggleRow,
  type ToggleRowProps,
} from "./shell/toggle-row";
export {
  FilterChip,
  type FilterChipProps,
  type FilterChipOption,
} from "./shell/filter-chip";
export {
  SettingsNav,
  SETTINGS_SECTIONS,
  type SettingsNavProps,
  type SettingsSection,
} from "./shell/settings-nav";
