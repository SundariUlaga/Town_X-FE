/** Real amortization math — no placeholder/fake numbers. */

export interface EmiInput {
  principal: number;
  annualRatePercent: number;
  tenureYears: number;
  downPaymentPercent?: number;
}

export interface EmiResult {
  loanAmount: number;
  downPayment: number;
  monthlyEmi: number;
  totalPayment: number;
  totalInterest: number;
}

export function calculateEmi({
  principal,
  annualRatePercent,
  tenureYears,
  downPaymentPercent = 0,
}: EmiInput): EmiResult {
  const downPayment = principal * (downPaymentPercent / 100);
  const loanAmount = Math.max(principal - downPayment, 0);
  const months = Math.max(Math.round(tenureYears * 12), 1);
  const monthlyRate = annualRatePercent / 12 / 100;

  let monthlyEmi: number;
  if (monthlyRate === 0) {
    monthlyEmi = loanAmount / months;
  } else {
    const factor = Math.pow(1 + monthlyRate, months);
    monthlyEmi = (loanAmount * monthlyRate * factor) / (factor - 1);
  }

  const totalPayment = monthlyEmi * months;
  const totalInterest = totalPayment - loanAmount;

  return {
    loanAmount,
    downPayment,
    monthlyEmi: Number.isFinite(monthlyEmi) ? monthlyEmi : 0,
    totalPayment: Number.isFinite(totalPayment) ? totalPayment : 0,
    totalInterest: Number.isFinite(totalInterest) ? totalInterest : 0,
  };
}

export interface RentVsBuyInput {
  homePrice: number;
  monthlyRent: number;
  annualRatePercent: number;
  tenureYears: number;
  downPaymentPercent?: number;
  appreciationPercent?: number;
  rentInflationPercent?: number;
  compareYears?: number;
}

export interface RentVsBuyResult {
  monthlyEmi: number;
  downPayment: number;
  totalRentPaid: number;
  totalBuyOutlay: number;
  estimatedHomeEquity: number;
  netBuyCost: number;
  buyAdvantage: number;
  recommendation: "buy" | "rent" | "close";
}

/**
 * Simple rent-vs-buy model for education — not financial advice.
 */
export function calculateRentVsBuy({
  homePrice,
  monthlyRent,
  annualRatePercent,
  tenureYears,
  downPaymentPercent = 20,
  appreciationPercent = 4,
  rentInflationPercent = 5,
  compareYears,
}: RentVsBuyInput): RentVsBuyResult {
  const years = Math.max(1, Math.round(compareYears ?? tenureYears));
  const emi = calculateEmi({
    principal: homePrice,
    annualRatePercent,
    tenureYears,
    downPaymentPercent,
  });

  let totalRent = 0;
  let rent = monthlyRent;
  for (let y = 0; y < years; y += 1) {
    totalRent += rent * 12;
    rent *= 1 + rentInflationPercent / 100;
  }

  const totalEmiPaid = emi.monthlyEmi * years * 12;
  const totalBuyOutlay = emi.downPayment + totalEmiPaid;
  const appreciated = homePrice * Math.pow(1 + appreciationPercent / 100, years);
  const loan = emi.loanAmount;
  const fractionPaid = Math.min(1, years / Math.max(tenureYears, 1));
  const remainingPrincipal = loan * (1 - fractionPaid);
  const estimatedHomeEquity = Math.max(0, appreciated - remainingPrincipal);
  const netBuyCost = totalBuyOutlay - estimatedHomeEquity;
  const buyAdvantage = totalRent - netBuyCost;

  let recommendation: RentVsBuyResult["recommendation"] = "close";
  if (buyAdvantage > homePrice * 0.02) recommendation = "buy";
  else if (buyAdvantage < -homePrice * 0.02) recommendation = "rent";

  return {
    monthlyEmi: emi.monthlyEmi,
    downPayment: emi.downPayment,
    totalRentPaid: totalRent,
    totalBuyOutlay,
    estimatedHomeEquity,
    netBuyCost,
    buyAdvantage,
    recommendation,
  };
}

export function formatInr(value: number, { compact = false }: { compact?: boolean } = {}) {
  if (!value || Number.isNaN(value)) return "N/A";
  if (compact) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function pricePerSqft(price?: number | null, carpetArea?: number | null, builtUp?: number | null) {
  const area = Number(carpetArea) > 0 ? Number(carpetArea) : Number(builtUp) > 0 ? Number(builtUp) : 0;
  const p = Number(price);
  if (!p || !area) return null;
  return Math.round(p / area);
}

export function formatPricePerSqft(price?: number | null, carpetArea?: number | null, builtUp?: number | null) {
  const pps = pricePerSqft(price, carpetArea, builtUp);
  if (pps == null) return null;
  return `₹${pps.toLocaleString("en-IN")}/sqft`;
}
