"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UIcon, DialogOverlay, DialogPrimitive as Dialog } from "@upshot/ui";
import {
  buildResults,
  groupResults,
  moveActiveIndex,
  roomForDigit,
  type Command,
} from "@/lib/commands";

const OPEN_EVENT = "upshot:open-command-palette";
const TOAST_MS = 2500;

/**
 * Global ⌘K command palette. Mounted once in the (app) layout; owns its own open
 * state. Opens on ⌘K/Ctrl-K or the TopBar trigger (custom event). ⌘1–5 jump to a
 * room globally (even when closed). Within the palette: type to filter, ↑↓ to
 * navigate, ⏎ to select, esc to close.
 *
 * The palette content is top-anchored (not centred), so it renders its own
 * Radix Dialog.Content rather than @upshot/ui's centred DialogContent — but
 * reuses the shared warm-black DialogOverlay scrim.
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const groups = groupResults(buildResults(query));
  // Single source for both render order and keyboard selection, so the
  // highlighted row and the Enter-selected row can never desync (independent of
  // how the underlying command list is ordered).
  const flat = groups.flatMap((g) => g.items);

  // Reset query + active row whenever the palette opens or closes.
  useEffect(() => {
    setQuery("");
    setActive(0);
  }, [open]);

  // Autofocus the input when opened (Radix's own autoFocus targets the dialog).
  useEffect(() => {
    if (open) {
      // Defer to after Radix mounts/focuses the content.
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [open]);

  // Global keydown: ⌘K toggles; ⌘1–5 jumps to a room (even when closed).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (meta && e.key >= "1" && e.key <= "5") {
        const href = roomForDigit(Number(e.key));
        if (href) {
          e.preventDefault();
          setOpen(false);
          router.push(href);
        }
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, onOpenEvent);
    };
  }, [router]);

  // Clean up a pending toast timer on unmount.
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const select = useCallback(
    (cmd: Command) => {
      setOpen(false);
      if (cmd.kind === "go-to" && cmd.href) {
        router.push(cmd.href);
        return;
      }
      // Phase N: replace with app-wide toast.
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast(`${cmd.label} — coming soon`);
      toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
    },
    [router],
  );

  function onContentKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => moveActiveIndex(i, e.key as "ArrowDown" | "ArrowUp", flat.length));
    } else if (e.key === "Enter") {
      const cmd = flat[active];
      if (cmd) {
        e.preventDefault();
        select(cmd);
      }
    }
  }

  // Flat index across groups, so the active row maps to results[active].
  let flatIndex = -1;

  return (
    <>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <DialogOverlay />
          <Dialog.Content
            onKeyDown={onContentKeyDown}
            aria-label="Command palette"
            style={{
              position: "fixed",
              top: 70,
              left: "50%",
              transform: "translateX(-50%)",
              width: 600,
              maxWidth: "calc(100vw - 2rem)",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 16,
              boxShadow: "var(--elev-3)",
              overflow: "hidden",
              zIndex: 50,
              outline: "none",
            }}
            className={
              "transition-[opacity,transform] duration-[var(--duration-slow)] ease-[var(--ease-out)] " +
              "data-[state=open]:opacity-100 data-[state=closed]:opacity-0 " +
              "motion-reduce:transition-none"
            }
          >
            {/* Radix requires a Title for an accessible name; visually hidden. */}
            <Dialog.Title
              style={{
                position: "absolute",
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: "hidden",
                clip: "rect(0 0 0 0)",
                whiteSpace: "nowrap",
                border: 0,
              }}
            >
              Command palette
            </Dialog.Title>

            {/* Search header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 18px",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <span style={{ color: "var(--text-3)", display: "inline-flex" }}>
                <UIcon name="search" size={19} />
              </span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder="Search or jump to…"
                aria-label="Search or jump to a room"
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 16,
                  color: "var(--text)",
                }}
              />
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-3)",
                }}
              >
                esc
              </span>
            </div>

            {/* Results */}
            <div
              role="listbox"
              aria-label="Commands"
              style={{
                padding: 10,
                maxHeight: 470,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {groups.map((group) => (
                <div key={group.group}>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: "var(--text-3)",
                      padding: "8px 12px 4px",
                      textTransform: "uppercase",
                    }}
                  >
                    {group.group}
                  </div>
                  {group.items.map((cmd) => {
                    flatIndex += 1;
                    const isActive = flatIndex === active;
                    return (
                      <CmdRow
                        key={cmd.id}
                        cmd={cmd}
                        active={isActive}
                        onSelect={() => select(cmd)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "11px 18px",
                borderTop: "1px solid var(--line)",
                background: "var(--surface-2)",
                fontSize: 11,
                color: "var(--text-3)",
                fontFamily: "var(--font-mono)",
              }}
            >
              <span>↑↓ navigate</span>
              <span>⏎ select</span>
              <span>⌘1–5 jump to a room</span>
              <span style={{ marginLeft: "auto" }}>esc close</span>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {toast && (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 60,
            padding: "10px 16px",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            boxShadow: "var(--elev-2)",
            fontSize: 12.5,
            color: "var(--text-2)",
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
}

function CmdRow({
  cmd,
  active,
  onSelect,
}: {
  cmd: Command;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      data-active={active}
      // Pointer-driven select; keyboard select is handled at the content level.
      onClick={onSelect}
      onMouseDown={(e) => e.preventDefault()}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 10,
        width: "100%",
        textAlign: "left",
        border: "none",
        cursor: "pointer",
        background: active ? "var(--coral-dim)" : "transparent",
      }}
    >
      <span
        style={{
          color: active ? "var(--coral)" : "var(--text-3)",
          display: "inline-flex",
        }}
      >
        <UIcon name={cmd.icon} size={17} active={active} />
      </span>
      <span
        style={{
          fontSize: 13.5,
          fontWeight: active ? 600 : 500,
          color: active ? "var(--text)" : "var(--text-2)",
        }}
      >
        {cmd.label}
      </span>
      {cmd.sub && (
        <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{cmd.sub}</span>
      )}
    </button>
  );
}
