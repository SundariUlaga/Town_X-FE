import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export type DropdownOption<T extends string = string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

export type DropdownProps<T extends string = string> = {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  label?: ReactNode;
  className?: string;
  triggerClassName?: string;
  /** Full width of parent */
  fullWidth?: boolean;
  size?: "sm" | "md";
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
};

/** Accessible select-style dropdown — mobile-friendly, keyboard navigable. */
export function Dropdown<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = "Select…",
  label,
  className,
  triggerClassName,
  fullWidth = false,
  size = "md",
  disabled = false,
  id: idProp,
  "aria-label": ariaLabel,
}: DropdownProps<T>) {
  const reactId = useId();
  const listboxId = `${reactId}-listbox`;
  const triggerId = idProp ?? `${reactId}-trigger`;
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const reduceMotion = useReducedMotion() ?? false;

  const selected = options.find((o) => o.value === value);
  const enabledIndexes = options
    .map((o, i) => (o.disabled ? -1 : i))
    .filter((i) => i >= 0);

  const close = useCallback(() => {
    setOpen(false);
    setHighlight(-1);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        document.getElementById(triggerId)?.focus();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close, triggerId]);

  useEffect(() => {
    if (!open) return;
    const idx = options.findIndex((o) => o.value === value && !o.disabled);
    setHighlight(idx >= 0 ? idx : enabledIndexes[0] ?? -1);
    // Focus list for arrow keys after open
    requestAnimationFrame(() => listRef.current?.focus());
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (next: T) => {
    onChange(next);
    close();
    document.getElementById(triggerId)?.focus();
  };

  const moveHighlight = (dir: 1 | -1) => {
    if (enabledIndexes.length === 0) return;
    const pos = enabledIndexes.indexOf(highlight);
    const nextPos =
      pos < 0
        ? dir === 1
          ? 0
          : enabledIndexes.length - 1
        : (pos + dir + enabledIndexes.length) % enabledIndexes.length;
    setHighlight(enabledIndexes[nextPos]);
  };

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveHighlight(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveHighlight(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      setHighlight(enabledIndexes[0] ?? -1);
    } else if (e.key === "End") {
      e.preventDefault();
      setHighlight(enabledIndexes[enabledIndexes.length - 1] ?? -1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const opt = options[highlight];
      if (opt && !opt.disabled) commit(opt.value);
    } else if (e.key === "Tab") {
      close();
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn("relative", fullWidth ? "w-full" : "inline-flex flex-col", className)}
    >
      {label ? (
        <label
          htmlFor={triggerId}
          className="mb-1.5 block text-xs font-medium text-gray-600 sm:text-sm"
        >
          {label}
        </label>
      ) : null}

      <button
        type="button"
        id={triggerId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "inline-flex w-full items-center justify-between gap-2 rounded-control border border-gray-200 bg-white text-left text-gray-900 shadow-soft-sm outline-none transition-colors",
          "hover:border-brand-300 focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/25",
          "disabled:cursor-not-allowed disabled:opacity-60",
          size === "sm" ? "min-h-9 px-2.5 py-1.5 text-xs" : "min-h-10 px-3 py-2 text-sm",
          open && "border-brand-400 ring-2 ring-brand-500/20",
          fullWidth ? "w-full" : "min-w-[10.5rem]",
          triggerClassName
        )}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-gray-500 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={triggerId}
            onKeyDown={onListKeyDown}
            initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className={cn(
              "absolute left-0 right-0 z-50 mt-1.5 max-h-[min(60vh,16rem)] overflow-auto rounded-control border border-gray-200 bg-white py-1 shadow-soft-lg",
              "focus:outline-none"
            )}
          >
            {options.map((opt, index) => {
              const isSelected = opt.value === value;
              const isActive = index === highlight;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled || undefined}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-sm sm:py-2",
                    opt.disabled && "cursor-not-allowed opacity-40",
                    isActive && !opt.disabled && "bg-brand-50 text-brand-900",
                    isSelected && !isActive && "bg-gray-50 font-medium"
                  )}
                  onMouseEnter={() => !opt.disabled && setHighlight(index)}
                  onClick={() => !opt.disabled && commit(opt.value)}
                >
                  <span className="min-w-0 truncate">{opt.label}</span>
                  {isSelected ? <Check className="size-4 shrink-0 text-brand-600" /> : null}
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default Dropdown;
