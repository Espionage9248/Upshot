"use client";

import { useState, useTransition } from "react";
import type { CSSProperties, ReactNode } from "react";
import { UIcon } from "@upshot/ui";
import type { DashboardWidget } from "@/server-actions/dashboard";
import { saveLayoutAction } from "@/server-actions/dashboard";
import {
  SIZE_SPAN,
  WIDGET_REGISTRY,
  addWidget,
  defByKey,
  defaultLayout,
  hideWidget,
  reorder,
} from "./dash-layout";

const GRID_GAP = 14;

const pillBase: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  height: 38,
  padding: "0 15px",
  borderRadius: 999,
  border: "1px solid var(--line)",
  background: "transparent",
  color: "var(--text-2)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

/** A single bento widget shell (title + minimal placeholder body). */
function Widget({
  widget,
  editing,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  children,
}: {
  widget: DashboardWidget;
  editing: boolean;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  children: ReactNode;
}) {
  const span = SIZE_SPAN[widget.size] ?? 1;
  return (
    <div
      draggable={editing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
        gridColumn: `span ${span}`,
        background: "var(--surface)",
        border: editing
          ? "1px dashed color-mix(in oklch, var(--coral) 45%, transparent)"
          : "1px solid var(--line)",
        borderRadius: "var(--radius-card)",
        padding: 16,
        position: "relative",
        minHeight: 0,
      }}
    >
      {editing && (
        <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
          <span
            aria-label="Drag to reorder"
            role="img"
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: "var(--surface-3)",
              color: "var(--text-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "grab",
            }}
          >
            <UIcon name="drag" size={13} />
          </span>
          <button
            type="button"
            aria-label={`Remove ${defByKey(widget.widgetKey)?.title ?? widget.widgetKey}`}
            onClick={onRemove}
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: "color-mix(in oklch, var(--expense) 18%, transparent)",
              color: "var(--expense)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <UIcon name="x" size={13} />
          </button>
        </div>
      )}
      {children}
    </div>
  );
}

function WidgetBody({ widget }: { widget: DashboardWidget }) {
  const def = defByKey(widget.widgetKey);
  return (
    <>
      <div
        style={{
          fontSize: 11.5,
          color: "var(--text-3)",
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {def?.title ?? widget.widgetKey}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>Coming soon</div>
    </>
  );
}

/**
 * Configurable dashboard bento. Holds the layout in state; "Arrange" enters edit
 * mode (drag handles + add-rail), native HTML5 drag reorders, the × hides a
 * widget, and "Done" persists via saveLayoutAction. "Reset to default" restores
 * the registry defaults. Pure layout logic lives in ./dash-layout.
 */
export function DashGrid({
  initial,
  startEditing = false,
}: {
  initial: DashboardWidget[];
  startEditing?: boolean;
}): ReactNode {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(initial);
  const [editing, setEditing] = useState(startEditing);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = widgets.filter((w) => w.visible);
  const addable = WIDGET_REGISTRY.filter(
    (d) => !visible.some((w) => w.widgetKey === d.widgetKey),
  );

  function done() {
    setEditing(false);
    const snapshot = widgets;
    startTransition(() => {
      void saveLayoutAction(snapshot);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        {editing ? (
          <>
            <button
              type="button"
              style={pillBase}
              onClick={() => setWidgets(defaultLayout())}
            >
              Reset to default
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={done}
              style={{
                ...pillBase,
                border: "none",
                background: "var(--coral)",
                color: "#2a1410",
                fontWeight: 700,
                padding: "0 18px",
              }}
            >
              <UIcon name="check" size={15} /> Done
            </button>
          </>
        ) : (
          <button type="button" style={pillBase} onClick={() => setEditing(true)}>
            <UIcon name="filter" size={15} /> Arrange
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: GRID_GAP,
          }}
        >
          {visible.map((w) => {
            const index = widgets.indexOf(w);
            return (
              <Widget
                key={w.id}
                widget={w}
                editing={editing}
                onRemove={() => setWidgets((cur) => hideWidget(cur, w.id))}
                onDragStart={() => setDragFrom(index)}
                onDragOver={(e) => {
                  if (editing) e.preventDefault();
                }}
                onDrop={() => {
                  if (dragFrom !== null) {
                    setWidgets((cur) => reorder(cur, dragFrom, index));
                    setDragFrom(null);
                  }
                }}
              >
                <WidgetBody widget={w} />
              </Widget>
            );
          })}
        </div>

        {editing && (
          <div
            style={{
              width: 232,
              flexShrink: 0,
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-card)",
              padding: 16,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Add a widget</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 14 }}>
              Tap to add to the grid
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {addable.map((d) => (
                <button
                  key={d.widgetKey}
                  type="button"
                  onClick={() => setWidgets((cur) => addWidget(cur, d.widgetKey))}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 11px",
                    borderRadius: 9,
                    background: "var(--surface-2)",
                    border: "1px solid var(--line)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ color: "var(--text-3)" }}>
                    <UIcon name={d.icon} size={16} />
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 500, flex: 1 }}>{d.title}</span>
                  <span style={{ color: "var(--coral)" }}>
                    <UIcon name="plus" size={15} />
                  </span>
                </button>
              ))}
              {addable.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>All widgets added</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
