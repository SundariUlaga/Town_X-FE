import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { requiredMark } from "@/lib/statusStyles";
import { WithTooltip } from "@/components/ui/WithTooltip";

const listVariants = {
  hidden: { opacity: 0, y: -6, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.18, ease: "easeOut" },
  },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -6 },
  visible: (index) => ({
    opacity: 1,
    x: 0,
    transition: { delay: Math.min(index * 0.02, 0.12), duration: 0.15 },
  }),
};

export default function LocationSearchSelect({
  label,
  required = false,
  options = [],
  value = "",
  onChange,
  placeholder = "Search or select...",
  disabled = false,
  loading = false,
  emptyMessage = "No matches found",
  getOptionLabel = (option) => option.name,
  getOptionValue = (option) => String(option.id),
  renderOption,
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedOption = useMemo(
    () => options.find((option) => getOptionValue(option) === String(value)),
    [getOptionValue, options, value]
  );

  const filteredOptions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) =>
      getOptionLabel(option).toLowerCase().includes(needle)
    );
  }, [getOptionLabel, options, query]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery("");
    }
  }, [open]);

  const handleSelect = (option) => {
    onChange?.(option);
    setOpen(false);
    setQuery("");
  };

  const handleClear = (event) => {
    event.stopPropagation();
    onChange?.(null);
    setQuery("");
  };

  const displayValue = selectedOption ? getOptionLabel(selectedOption) : "";

  return (
    <div ref={rootRef} className="relative">
      {label ? (
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {label}
          {required ? <span className={requiredMark}>*</span> : null}
        </label>
      ) : null}

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`w-full px-2.5 py-2 text-xs border-2 rounded-control transition-colors text-left flex items-center gap-2 ${
          disabled
            ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
            : open
              ? "border-brand-500 bg-white text-gray-800"
              : "border-gray-200 bg-white text-gray-800 hover:border-gray-300"
        }`}
      >
        <span className={`flex-1 truncate ${displayValue ? "" : "text-gray-400"}`}>
          {loading && !displayValue ? "Loading..." : displayValue || placeholder}
        </span>
        {selectedOption && !disabled ? (
          <WithTooltip label="Clear selection">
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") handleClear(event);
              }}
              className="p-0.5 rounded-full hover:bg-gray-100 text-gray-400"
              aria-label="Clear selection"
            >
              <X size={12} />
            </span>
          </WithTooltip>
        ) : null}
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && !disabled ? (
          <motion.div
            variants={reduceMotion ? undefined : listVariants}
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? false : "visible"}
            exit={reduceMotion ? undefined : "exit"}
            className="absolute z-50 mt-1 w-full rounded-control border border-gray-200 bg-white shadow-soft-md overflow-hidden"
          >
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Type to search..."
                  className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-control focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <ul className="max-h-48 overflow-y-auto py-1">
              {loading ? (
                <li className="px-3 py-2 text-xs text-gray-500">Loading options...</li>
              ) : filteredOptions.length === 0 ? (
                <li className="px-3 py-2 text-xs text-gray-500">{emptyMessage}</li>
              ) : (
                filteredOptions.map((option, index) => {
                  const optionValue = getOptionValue(option);
                  const isSelected = optionValue === String(value);

                  return (
                    <motion.li
                      key={optionValue}
                      custom={index}
                      variants={reduceMotion ? undefined : itemVariants}
                      initial={reduceMotion ? false : "hidden"}
                      animate={reduceMotion ? false : "visible"}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelect(option)}
                        className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                          isSelected
                            ? "bg-brand-50 text-brand-700 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {renderOption ? renderOption(option) : getOptionLabel(option)}
                      </button>
                    </motion.li>
                  );
                })
              )}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
