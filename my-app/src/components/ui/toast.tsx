import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "error";

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let idSeq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion() ?? false;
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "default") => {
      const id = ++idSeq;
      setItems((prev) => [...prev.slice(-4), { id, message, variant }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4 safe-bottom"
        aria-live="polite"
        aria-relevant="additions"
      >
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
              className={cn(
                "pointer-events-auto flex max-w-md items-start gap-3 rounded-control border px-4 py-3 text-sm shadow-soft-lg",
                item.variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900",
                item.variant === "error" && "border-red-200 bg-red-50 text-red-900",
                item.variant === "default" && "border-border bg-card text-foreground"
              )}
              role="status"
            >
              <p className="flex-1 leading-snug">{item.message}</p>
              <button
                type="button"
                className="shrink-0 rounded-sm p-0.5 opacity-70 hover:opacity-100"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
