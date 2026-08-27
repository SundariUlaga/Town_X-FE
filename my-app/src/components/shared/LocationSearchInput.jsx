import React, { useEffect, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { locationAPI } from "@/services/api";

const panelVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.18, ease: "easeOut" },
  },
  exit: { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.12 } },
};

const TYPE_LABELS = {
  district: "District",
  taluk: "Taluk",
  village: "Village",
};

export default function LocationSearchInput({
  value,
  onChange,
  onSubmit,
  onSelectLocation,
  placeholder = "Search location, type, keyword...",
  className = "",
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const rootRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const results = await locationAPI.search(query);
        if (!cancelled) setSuggestions(results);
      } catch (error) {
        console.error("Location search failed:", error);
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setFocused(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const showSuggestions = focused && value.trim().length >= 2;

  const handleSelect = (item) => {
    onChange?.(item.name);
    onSelectLocation?.(item);
    setFocused(false);
    setSuggestions([]);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.(event);
          setFocused(false);
        }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            onFocus={() => setFocused(true)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-control focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
        </div>
      </form>

      <AnimatePresence>
        {showSuggestions ? (
          <motion.div
            variants={reduceMotion ? undefined : panelVariants}
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? false : "visible"}
            exit={reduceMotion ? undefined : "exit"}
            className="absolute z-50 mt-2 w-full rounded-card border border-gray-200 bg-white shadow-soft-md overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-gray-100 text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Tamil Nadu locations
            </div>

            <ul className="max-h-64 overflow-y-auto py-1">
              {loading ? (
                <li className="px-3 py-3 text-sm text-gray-500">Searching locations...</li>
              ) : suggestions.length === 0 ? (
                <li className="px-3 py-3 text-sm text-gray-500">No matching districts, taluks, or villages</li>
              ) : (
                suggestions.map((item, index) => (
                  <motion.li
                    key={`${item.type}-${item.id}`}
                    initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                    animate={reduceMotion ? false : { opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.15), duration: 0.15 }}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="w-full px-3 py-2.5 text-left hover:bg-brand-50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <MapPin size={15} className="text-brand-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500 truncate">{item.label}</p>
                        </div>
                        <span className="ml-auto shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                          {TYPE_LABELS[item.type] || item.type}
                        </span>
                      </div>
                    </button>
                  </motion.li>
                ))
              )}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
