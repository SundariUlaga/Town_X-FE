import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";

import { calculateEmi, formatInr } from "@/lib/finance";
import { cn } from "@/lib/utils";

type HomeEmiWidgetProps = {
  /** Seed price from market avg when available */
  defaultPrice?: number | null;
  className?: string;
};

export function HomeEmiWidget({ defaultPrice, className }: HomeEmiWidgetProps) {
  const seed = defaultPrice && defaultPrice > 0 ? Math.round(defaultPrice) : 75_00_000;
  const [principal, setPrincipal] = useState(seed);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);
  const [downPct, setDownPct] = useState(20);

  const result = useMemo(
    () =>
      calculateEmi({
        principal: Number(principal) || 0,
        annualRatePercent: Number(rate) || 0,
        tenureYears: Number(years) || 1,
        downPaymentPercent: Number(downPct) || 0,
      }),
    [principal, rate, years, downPct]
  );

  return (
    <section className={cn("rounded-control border border-gray-200 bg-white p-3", className)}>
      <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-gray-900">
        <Calculator className="size-4 text-brand-600" />
        EMI calculator
      </h2>
      <div className="space-y-2.5">
        <label className="block text-[11px] font-medium text-gray-600">
          Price (₹)
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))}
            className="mt-1 w-full rounded-control border border-gray-200 px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-brand-400"
          />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="block text-[11px] font-medium text-gray-600">
            Down %
            <input
              type="number"
              value={downPct}
              onChange={(e) => setDownPct(Number(e.target.value))}
              className="mt-1 w-full rounded-control border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-brand-400"
            />
          </label>
          <label className="block text-[11px] font-medium text-gray-600">
            Rate %
            <input
              type="number"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="mt-1 w-full rounded-control border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-brand-400"
            />
          </label>
          <label className="block text-[11px] font-medium text-gray-600">
            Years
            <input
              type="number"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="mt-1 w-full rounded-control border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-brand-400"
            />
          </label>
        </div>
        <div className="rounded-control bg-brand-50 px-3 py-2.5">
          <p className="text-[11px] text-brand-800/80">Est. monthly EMI</p>
          <p className="font-display text-lg font-semibold text-brand-900">
            {formatInr(result.monthlyEmi)}
          </p>
        </div>
        <p className="text-[10px] leading-snug text-gray-400">
          Estimate only — lender terms may differ.
        </p>
      </div>
    </section>
  );
}

export default HomeEmiWidget;
