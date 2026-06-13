import { Tabs } from "radix-ui";
import { cn } from "../lib/cn";

// Re-export Root as UiTabs for a named, discoverable entry point.
// TabsList, TabsTrigger, TabsContent are styled composable wrappers.

export function UiTabs({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Tabs.Root>) {
  return <Tabs.Root className={cn("flex flex-col", className)} {...props} />;
}

export function TabsList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Tabs.List>) {
  return (
    <Tabs.List
      className={cn(
        // 1px --line bottom border on the tablist; gap-4 between triggers
        // (ds.jsx); negative margin trick so the active trigger's 2px
        // indicator sits flush over the line.
        "flex gap-[4px] border-b border-[var(--line)]",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Tabs.Trigger>) {
  return (
    <Tabs.Trigger
      className={cn(
        // Layout + spacing from ds.jsx: padding '8px 14px', font-size 13px
        "px-[14px] py-[8px] text-[13px] select-none cursor-pointer",
        // Pull the trigger down 1px so the indicator overlaps the list's border
        "mb-[-1px]",
        // Bottom border acts as the underline indicator; transparent when inactive
        "border-b-2 border-transparent",
        "outline-none",
        // Inactive: text-3, weight 500
        "text-[var(--text-3)] font-[500]",
        // Active: text colour, coral indicator, bold
        "data-[state=active]:text-[var(--text)] data-[state=active]:font-[700]",
        "data-[state=active]:border-[var(--coral)]",
        // Transition per spec: --duration-base + --ease-out
        "transition-[color,border-color] duration-[var(--duration-base)] ease-[var(--ease-out)]",
        "focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Tabs.Content>) {
  // No baked-in padding — callers own panel spacing.
  return <Tabs.Content className={className} {...props} />;
}
