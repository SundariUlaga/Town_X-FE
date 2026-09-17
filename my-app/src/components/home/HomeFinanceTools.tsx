import { useMemo, useState } from "react";
import { Calculator, Scale } from "lucide-react";

import { calculateEmi, calculateRentVsBuy, formatInr } from "@/lib/finance";
import { cn } from "@/lib/utils";

type HomeFinanceToolsProps = {
  defaultPrice?: number | null;
  className?: string;
};

export function HomeFinanceTools({ defaultPrice, className }: HomeFinanceToolsProps) {
  const seed = defaultPrice && defaultPrice > 0 ? Math.round(defaultPrice) : 75_00_000;
  const [tab, setTab] = useState<"emi" | "rentbuy">("emi");

  const [principal, setPrincipal] = useState(seed);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);
  const [downPct, setDownPct] = useState(20);

  const [rent, setRent] = useState(25_000);
  const [appreciation, setAppreciation] = useState(4);
  const [rentInflation, setRentInflation] = useState(5);
  const [horizon, setHorizon] = useState(10);

  const emi = useMemo(
    () =>
      calculateEmi({
        principal: Number(principal) || 0,
        annualRatePercent: Number(rate) || 0,
        tenureYears: Number(years) || 1,
        downPaymentPercent: Number(downPct) || 0,
      }),
    [principal, rate, years, downPct]
  );

  const rentBuy = useMemo(
    () =>
      calculateRentVsBuy({
        homePrice: Number(principal) || 0,
        monthlyRent: Number(rent) || 0,
        annualRatePercent: Number(rate) || 0,
        tenureYears: Number(years) || 1,
        downPaymentPercent: Number(downPct) || 0,
        appreciationPercent: Number(appreciation) || 0,
        rentInflationPercent: Number(rentInflation) || 0,
        compareYears: Number(horizon) || 1,
      }),
    [principal, rent, rate, years, downPct, appreciation, rentInflation, horizon]
  );

  const inputClass =
    "mt-1 w-full rounded-control border border-gray-200 px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-brand-400";

  return (
    <section className={cn("rounded-control border border-gray-200 bg-white p-3", className)}>
      <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-gray-900">
        <Calculator className="size-4 text-brand-600" />
        Calculators
      </h2>

      <div className="mb-3 inline-flex rounded-control border border-gray-200 bg-gray-50 p-0.5">
        <button
          type="button"
          onClick={() => setTab("emi")}
          className={cn(
            "rounded-[0.5rem] px-3 py-1.5 text-xs font-semibold transition-colors",
            tab === "emi" ? "bg-white text-brand-800 shadow-soft-sm" : "text-gray-600"
          )}
        >
          EMI
        </button>
        <button
          type="button"
          onClick={() => setTab("rentbuy")}
          className={cn(
            "inline-flex items-center gap-1 rounded-[0.5rem] px-3 py-1.5 text-xs font-semibold transition-colors",
            tab === "rentbuy" ? "bg-white text-brand-800 shadow-soft-sm" : "text-gray-600"
          )}
        >
          <Scale className="size-3" />
          Rent vs buy
        </button>
      </div>

      <div className="space-y-2.5">
        <label className="block text-[11px] font-medium text-gray-600">
          Home price (₹)
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))}
            className={inputClass}
          />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="block text-[11px] font-medium text-gray-600">
            Down %
            <input
              type="number"
              value={downPct}
              onChange={(e) => setDownPct(Number(e.target.value))}
              className={inputClass}
            />
          </label>
          <label className="block text-[11px] font-medium text-gray-600">
            Rate %
            <input
              type="number"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className={inputClass}
            />
          </label>
          <label className="block text-[11px] font-medium text-gray-600">
            Loan yrs
            <input
              type="number"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className={inputClass}
            />
          </label>
        </div>

        {tab === "emi" ? (
          <div className="rounded-control bg-brand-50 px-3 py-2.5">
            <p className="text-[11px] text-brand-800/80">Est. monthly EMI</p>
            <p className="font-display text-lg font-semibold text-brand-900">
              {formatInr(emi.monthlyEmi)}
            </p>
            <p className="mt-1 text-[10px] text-brand-800/70">
              Loan {formatInr(emi.loanAmount, { compact: true })} · Interest{" "}
              {formatInr(emi.totalInterest, { compact: true })}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-[11px] font-medium text-gray-600">
                Monthly rent (₹)
                <input
                  type="number"
                  value={rent}
                  onChange={(e) => setRent(Number(e.target.value))}
                  className={inputClass}
                />
              </label>
              <label className="block text-[11px] font-medium text-gray-600">
                Horizon (yrs)
                <input
                  type="number"
                  value={horizon}
                  onChange={(e) => setHorizon(Number(e.target.value))}
                  className={inputClass}
                />
              </label>
              <label className="block text-[11px] font-medium text-gray-600">
                Home ↑ %/yr
                <input
                  type="number"
                  step="0.1"
                  value={appreciation}
                  onChange={(e) => setAppreciation(Number(e.target.value))}
                  className={inputClass}
                />
              </label>
              <label className="block text-[11px] font-medium text-gray-600">
                Rent ↑ %/yr
                <input
                  type="number"
                  step="0.1"
                  value={rentInflation}
                  onChange={(e) => setRentInflation(Number(e.target.value))}
                  className={inputClass}
                />
              </label>
            </div>
            <div className="rounded-control bg-brand-50 px-3 py-2.5 space-y-1">
              <p className="text-[11px] font-semibold text-brand-900">
                {rentBuy.recommendation === "buy"
                  ? "Buying looks better on this model"
                  : rentBuy.recommendation === "rent"
                    ? "Renting looks better on this model"
                    : "Close call — compare lifestyle factors"}
              </p>
              <p className="text-[11px] text-brand-800/80">
                EMI {formatInr(rentBuy.monthlyEmi)} · Rent paid{" "}
                {formatInr(rentBuy.totalRentPaid, { compact: true })}
              </p>
              <p className="text-[11px] text-brand-800/80">
                Est. equity {formatInr(rentBuy.estimatedHomeEquity, { compact: true })} · Net buy
                cost {formatInr(rentBuy.netBuyCost, { compact: true })}
              </p>
              <p className="text-[10px] text-gray-500">Illustrative only — not financial advice.</p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default HomeFinanceTools;
