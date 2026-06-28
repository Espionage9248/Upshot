import type { ReactElement } from "react";

export function Avatar({
  name,
  color,
  size = 26,
}: {
  name: string;
  color: string;
  size?: number;
}): ReactElement {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: `color-mix(in oklch, ${color} 22%, transparent)`,
        border: `1.5px solid ${color}`,
        color: color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.42,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {name[0]}
    </span>
  );
}
