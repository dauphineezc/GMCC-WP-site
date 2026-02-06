"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useOutsideClick } from "./useOutsideClick";

type TextSize = "normal" | "large" | "xlarge";

type A11yState = {
  textSize: TextSize;
  highContrast: boolean;
  reduceMotion: boolean;
};

const STORAGE_KEY = "gmcc_a11y";

const DEFAULT_STATE: A11yState = {
  textSize: "normal",
  highContrast: false,
  reduceMotion: false,
};

function applyA11yToDom(state: A11yState) {
  const root = document.documentElement;

  // text size via data attr
  root.dataset.textSize = state.textSize;

  // contrast + motion via classes
  root.classList.toggle("a11y-contrast", state.highContrast);
  root.classList.toggle("reduce-motion", state.reduceMotion);
}

export default function AccessibilityPopover({
  className = "",
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<A11yState>(DEFAULT_STATE);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Calculate fixed position when opening
  const updatePanelPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPanelStyle({
        position: "fixed",
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, []);

  useEffect(() => {
    if (open) {
      updatePanelPosition();
      window.addEventListener("scroll", updatePanelPosition, { passive: true });
      window.addEventListener("resize", updatePanelPosition);
      return () => {
        window.removeEventListener("scroll", updatePanelPosition);
        window.removeEventListener("resize", updatePanelPosition);
      };
    }
  }, [open, updatePanelPosition]);

  useOutsideClick([buttonRef as React.RefObject<HTMLElement>, panelRef as React.RefObject<HTMLElement>], () => setOpen(false), open);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<A11yState>;
        const next: A11yState = {
          textSize: parsed.textSize ?? DEFAULT_STATE.textSize,
          highContrast: !!parsed.highContrast,
          reduceMotion: !!parsed.reduceMotion,
        };
        setState(next);
        applyA11yToDom(next);
      } else {
        applyA11yToDom(DEFAULT_STATE);
      }
    } catch {
      applyA11yToDom(DEFAULT_STATE);
    }
  }, []);

  // persist + apply
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
    applyA11yToDom(state);
  }, [state]);

  // escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const textSizeOptions = useMemo(
    () =>
      [
        { value: "normal" as const, label: "Default" },
        { value: "large" as const, label: "Larger" },
        { value: "xlarge" as const, label: "Largest" },
      ] satisfies Array<{ value: TextSize; label: string }>,
    []
  );

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors font-secondary text-neutral-600 hover:text-gmcc-navy hover:bg-neutral-200/60 leading-none"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <IconA11y className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="hidden xl:inline">Accessibility</span>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Accessibility options"
          className="w-80 rounded-xl border border-neutral-200 bg-white shadow-lg p-4 z-[200]"
          style={panelStyle}
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="text-sm font-semibold text-gmcc-navy">
                Accessibility
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">
                Preferences are saved on this device.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-neutral-100"
              aria-label="Close accessibility menu"
            >
              <IconX className="h-4 w-4 text-neutral-600" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Text size */}
            <div>
              <div className="text-xs font-semibold text-neutral-700 mb-2">
                Text size
              </div>
              <div className="flex gap-2">
                {textSizeOptions.map((opt) => {
                  const active = state.textSize === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setState((s) => ({ ...s, textSize: opt.value }))}
                      className={[
                        "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                        active
                          ? "border-gmcc-navy bg-gmcc-blue-light text-gmcc-navy"
                          : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
                      ].join(" ")}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toggles */}
            <ToggleRow
              label="High contrast"
              description="Increase contrast for readability."
              checked={state.highContrast}
              onChange={(v) => setState((s) => ({ ...s, highContrast: v }))}
            />
            <ToggleRow
              label="Reduce motion"
              description="Minimize animations and transitions."
              checked={state.reduceMotion}
              onChange={(v) => setState((s) => ({ ...s, reduceMotion: v }))}
            />

            <div className="pt-2 border-t border-neutral-200 flex justify-end">
              <button
                type="button"
                onClick={() => setState(DEFAULT_STATE)}
                className="text-xs font-medium text-neutral-600 hover:text-gmcc-navy"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-xs font-semibold text-neutral-700">{label}</div>
        <div className="text-xs text-neutral-500 mt-0.5">{description}</div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          checked ? "bg-gmcc-navy" : "bg-neutral-300",
        ].join(" ")}
        aria-pressed={checked}
        aria-label={label}
      >
        <span
          className={[
            "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
            checked ? "translate-x-5" : "translate-x-1",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

function IconA11y({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4a2 2 0 110 4 2 2 0 010-4z" />
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 8h12" />
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 20l5-11 5 11" />
    </svg>
  );
}

function IconX({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
