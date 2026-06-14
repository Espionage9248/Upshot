import { cn } from "../lib/cn";
import { UiSwitch } from "../primitives/switch";

export interface ToggleRowProps {
  label: string;
  sub?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function ToggleRow({
  label,
  sub,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  className,
}: ToggleRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-[14px] py-[12px]",
        className,
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold">{label}</div>
        {sub && (
          <div className="text-[11.5px] text-[var(--text-3)] mt-[2px]">{sub}</div>
        )}
      </div>
      <UiSwitch
        aria-label={label}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}
