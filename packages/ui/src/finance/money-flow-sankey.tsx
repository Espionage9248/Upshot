"use client";

import { useId, type ReactElement } from "react";
// @visx/sankey re-exports d3-sankey layout functions — use the layout fn,
// not the React component, to stay compatible with React 19.
import { sankey, sankeyLinkHorizontal } from "@visx/sankey";
import type { SankeyGraph } from "@visx/sankey";
import { EmptyState } from "./empty-state";
import { Money } from "./money";

export interface MoneyFlowSankeyProps {
  incomeCents: number; // single source node
  categories: Array<{ label: string; valueCents: number }>; // expense sinks
  savedCents: number; // saved sink
  w?: number;
  h?: number;
}

// Node indices:
//  0 = Income (source)
//  1 = merged (coral hub)
//  2…N+1 = category expense sinks
//  N+2 = Saved sink

type NodeExtra = { id: string; label: string; color: string };
type LinkExtra = { color: string };

/**
 * MoneyFlowSankey — 3-column Sankey centrepiece for the Reports room.
 * income (`--income`) → merged node (`--coral`) → categories (`--expense`) + saved (`--saved`).
 * Links draw in on mount (`--duration-slow`); reduced-motion shows final state.
 * Uses @visx/sankey (d3-sankey) for layout; renders token-styled SVG paths/rects.
 * Client component; serializable cents props only.
 */
export function MoneyFlowSankey({
  incomeCents,
  categories,
  savedCents,
  w = 540,
  h = 280,
}: MoneyFlowSankeyProps): ReactElement {
  const clipId = useId();
  const animId = useId();

  if (incomeCents <= 0) {
    return (
      <EmptyState
        icon="trend"
        title="No income data"
        hint="Money-flow appears once income transactions sync."
      />
    );
  }

  // ── Build d3-sankey graph ────────────────────────────────────────────────
  // Nodes
  const incomeNode: NodeExtra = { id: "income", label: "Income", color: "var(--income)" };
  const mergedNode: NodeExtra = { id: "merged", label: "Merged", color: "var(--coral)" };
  const catNodes: NodeExtra[] = categories.map((c) => ({
    id: `cat-${c.label}`,
    label: c.label,
    color: "var(--expense)",
  }));
  const savedNode: NodeExtra = { id: "saved", label: "Saved", color: "var(--saved)" };

  const allNodes: NodeExtra[] = [incomeNode, mergedNode, ...catNodes, savedNode];

  // Total flow through the merged node
  const totalOut = categories.reduce((s, c) => s + c.valueCents, 0) + savedCents;
  // Clamp income to be at least totalOut so Sankey doesn't break
  const effectiveIncome = Math.max(incomeCents, totalOut, 1);

  // Links — use string IDs as source/target to match nodeId accessor
  type RawLink = { source: string; target: string; value: number; color: string };
  const links: RawLink[] = [
    // income → merged
    {
      source: "income",
      target: "merged",
      value: effectiveIncome,
      color: "var(--income)",
    },
    // merged → each category
    ...categories.map((c) => ({
      source: "merged",
      target: `cat-${c.label}`,
      value: Math.max(c.valueCents, 1),
      color: "var(--expense)",
    })),
    // merged → saved (only if savedCents > 0)
    ...(savedCents > 0
      ? [
          {
            source: "merged",
            target: "saved",
            value: savedCents,
            color: "var(--saved)",
          },
        ]
      : []),
  ];

  // If no out-links at all (edge case: no categories + no saved), bail
  if (links.length <= 1 && savedCents === 0 && categories.length === 0) {
    return (
      <EmptyState
        icon="trend"
        title="No spending data"
        hint="Money-flow appears once categories or savings are recorded."
      />
    );
  }

  // Pad around the SVG
  const padX = 16;
  const padY = 12;

  // Before layout(), links have string source/target IDs; the SankeyGraph type
  // expects fully-resolved nodes but d3-sankey accepts string IDs at input time.
  const graph = {
    nodes: allNodes.map((n) => ({ ...n })),
    links: links.map((l) => ({ ...l })),
  } as SankeyGraph<NodeExtra, LinkExtra>;

  const layout = sankey<NodeExtra, LinkExtra>()
    .nodeId((n) => n.id)
    .nodeWidth(14)
    .nodePadding(10)
    .extent([
      [padX, padY],
      [w - padX, h - padY],
    ]);

  const computed = layout(graph);
  const pathGen = sankeyLinkHorizontal();

  // ── Legend items ─────────────────────────────────────────────────────────
  const legendItems = [
    { label: "Income", cents: incomeCents, color: "var(--income)" },
    ...categories.map((c) => ({ label: c.label, cents: c.valueCents, color: "var(--expense)" })),
    ...(savedCents > 0 ? [{ label: "Saved", cents: savedCents, color: "var(--saved)" }] : []),
  ];

  // ── aria label ───────────────────────────────────────────────────────────
  const ariaLabel = `Money flow: income of $${(incomeCents / 100).toFixed(0)} splits into ${categories.map((c) => c.label).join(", ")}${savedCents > 0 ? " and Saved" : ""}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Inject animation keyframes + reduced-motion guard */}
      <style>{`
        @keyframes mfs-draw-${animId.replace(/:/g, "")} {
          from { stroke-dashoffset: 1; }
          to   { stroke-dashoffset: 0; }
        }
        .mfs-link-${animId.replace(/:/g, "")} {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: mfs-draw-${animId.replace(/:/g, "")} var(--duration-slow, 280ms) var(--ease-out, ease) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .mfs-link-${animId.replace(/:/g, "")} {
            animation: none;
            stroke-dashoffset: 0;
          }
        }
      `}</style>

      <svg
        width="100%"
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={ariaLabel}
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          {/* pathLength="1" trick: we don't know path length, use userSpaceOnUse scaled to 1 */}
          <clipPath id={clipId}>
            <rect x={0} y={0} width={w} height={h} />
          </clipPath>
        </defs>

        {/* Links */}
        {computed.links.map((link, i) => {
          const rawLink = links[i];
          const d = pathGen(link as Parameters<typeof pathGen>[0]);
          if (!d) return null;
          const linkColor = rawLink?.color ?? "var(--text-3)";
          // Compute stroke-width from link.width (set by d3-sankey)
          const sw = Math.max(1, link.width ?? 0);
          return (
            <path
              key={i}
              data-link={i}
              d={d}
              fill="none"
              stroke={linkColor}
              strokeWidth={sw}
              strokeOpacity={0.28}
              pathLength={1}
              className={`mfs-link-${animId.replace(/:/g, "")}`}
              style={{
                animationDelay: `${i * 40}ms`,
              }}
            />
          );
        })}

        {/* Nodes */}
        {computed.nodes.map((node, i) => {
          const { x0, y0, x1, y1 } = node;
          if (
            x0 === undefined ||
            y0 === undefined ||
            x1 === undefined ||
            y1 === undefined
          ) {
            return null;
          }
          return (
            <rect
              key={i}
              data-node={node.id}
              x={x0}
              y={y0}
              width={x1 - x0}
              height={Math.max(y1 - y0, 2)}
              rx={3}
              fill={node.color}
            />
          );
        })}

        {/* Node labels — left of income, right of sinks */}
        {computed.nodes.map((node, i) => {
          const { x0, x1, y0, y1 } = node;
          if (
            x0 === undefined ||
            x1 === undefined ||
            y0 === undefined ||
            y1 === undefined
          ) {
            return null;
          }
          // skip the merged/hub node label
          if (node.id === "merged") return null;

          const midY = (y0 + y1) / 2 + 3.5;
          const isLeft = node.id === "income";
          const textX = isLeft ? x1 + 7 : x0 - 7;
          const anchor = isLeft ? "start" : "end";
          const color = node.id === "saved" ? "var(--saved)" : "var(--text-2)";

          return (
            <text
              key={i}
              x={textX}
              y={midY}
              fontSize={11}
              fill={color}
              textAnchor={anchor}
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {node.label}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 20px",
        }}
      >
        {legendItems.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              minWidth: 120,
              justifyContent: "space-between",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 3,
                  background: item.color,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12, color: "var(--text-2)" }}>{item.label}</span>
            </span>
            <Money cents={item.cents} kind="neutral" size={12} weight={600} showCents={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
