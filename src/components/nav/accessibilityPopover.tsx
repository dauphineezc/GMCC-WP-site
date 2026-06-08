"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
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

  const updatePanelPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const panelWidth = 320; // w-80
    const centeredLeft = rect.left + rect.width / 2 - panelWidth / 2;
    const left = Math.max(8, Math.min(centeredLeft, window.innerWidth - panelWidth - 8));
    setPanelStyle({ position: "fixed", top: rect.bottom + 8, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", updatePanelPosition);
    return () => window.removeEventListener("resize", updatePanelPosition);
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
        onClick={() => {
          if (!open) updatePanelPosition();
          setOpen((v) => !v);
        }}
        className="flex items-center justify-center p-1.5 rounded transition-colors hover:bg-neutral-200/60"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Accessibility Options"
      >
        <Image src="/accessibilityOptionsIcon.png" alt="" width={22} height={22} className="w-5 h-5 object-contain" />
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
              <IconX className="h-4 w-4 text-neutral-700" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Text size slider */}
            <TextSizeSlider
              value={state.textSize}
              options={textSizeOptions}
              onChange={(value) => setState((s) => ({ ...s, textSize: value }))}
            />

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

function TextSizeSlider({
  value,
  options,
  onChange,
}: {
  value: TextSize;
  options: Array<{ value: TextSize; label: string }>;
  onChange: (value: TextSize) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return value;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      
      // Snap to nearest option
      const index = Math.round(percent * (options.length - 1));
      return options[index].value;
    },
    [options, value]
  );

  const handleMove = useCallback(
    (clientX: number) => {
      const newValue = getValueFromPosition(clientX);
      if (newValue !== value) {
        onChange(newValue);
      }
    },
    [getValueFromPosition, onChange, value]
  );

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMove]);

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const currentIndex = options.findIndex((o) => o.value === value);
  const percent = (currentIndex / (options.length - 1)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-neutral-700">Text size</div>
        <div className="text-xs font-medium text-gmcc-navy">
          {options.find((o) => o.value === value)?.label}
        </div>
      </div>

      {/* Slider track */}
      <div
        ref={trackRef}
        className="relative pt-1 pb-6 cursor-pointer select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Track background */}
        <div className="h-2 bg-neutral-200 rounded-full" />

        {/* Active track */}
        <div
          className={`absolute top-1 left-0 h-2 bg-gmcc-navy rounded-full ${
            isDragging ? "" : "transition-all duration-150"
          }`}
          style={{ width: `${percent}%` }}
        />

        {/* Tick marks / points */}
        <div className="absolute top-0 left-0 right-0 flex justify-between pointer-events-none">
          {options.map((opt, idx) => {
            const isActive = value === opt.value;
            const isPast = currentIndex >= idx;
            return (
              <div key={opt.value} className="relative flex flex-col items-center">
                {/* Point */}
                <div
                  className={[
                    "w-4 h-4 rounded-full border-2",
                    isDragging ? "" : "transition-all duration-150",
                    isActive
                      ? "bg-gmcc-navy border-gmcc-navy scale-125"
                      : isPast
                        ? "bg-gmcc-navy border-gmcc-navy"
                        : "bg-white border-neutral-300",
                  ].join(" ")}
                />
                {/* Label */}
                <span
                  className={[
                    "absolute top-6 text-[10px] font-medium whitespace-nowrap",
                    isDragging ? "" : "transition-colors",
                    isActive ? "text-gmcc-navy" : "text-neutral-500",
                  ].join(" ")}
                >
                  {opt.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Draggable thumb (invisible, for larger hit area) */}
        <div
          className={`absolute top-0 w-6 h-6 -ml-3 rounded-full ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{ left: `${percent}%` }}
        />
      </div>
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
