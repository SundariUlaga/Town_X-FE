import { Link } from "react-router-dom";
import { Scale, X } from "lucide-react";

import { useCompare, MAX_COMPARE } from "@/context/CompareContext";

export function CompareBar() {
  const { ids, clear, remove } = useCompare();
  if (ids.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[60] w-[min(92vw,32rem)] -translate-x-1/2 rounded-card border border-brand-200 bg-white/95 p-3 shadow-soft-lg backdrop-blur-sm safe-bottom">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <Scale className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">
            Compare ({ids.length}/{MAX_COMPARE})
          </p>
          <p className="text-[11px] text-gray-500">Add up to {MAX_COMPARE} listings, then review side by side.</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {ids.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => remove(id)}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-700 hover:bg-gray-100"
              >
                #{id}
                <X className="size-3" />
              </button>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <Link
            to="/compare"
            className="rounded-control bg-brand-600 px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-brand-700"
          >
            Open
          </Link>
          <button
            type="button"
            onClick={clear}
            className="text-[10px] font-medium text-gray-500 hover:text-gray-800"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompareBar;
