export type MembershipPricingInput = {
  monthly: number | null;
  annually: number | null;
  paymentSplit: { frequency: string; cost: number | null } | null;
};

export type MembershipPricingSavings = {
  /** Savings vs paying monthly for the same period as one split payment */
  splitVsMonthlyPercent: number | null;
  /** Savings vs paying monthly for 12 months */
  annualVsMonthlyPercent: number | null;
};

/** Months covered by one split payment (e.g. "3-Months" → 3, "Every 6 Months" → 6) */
export function getMonthsPerSplitPayment(frequency: string): number | null {
  const normalized = frequency.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized.includes("semi")) return 6;
  if (normalized.includes("quarter")) return 3;

  const everyMonths = normalized.match(/every\s+(\d+)\s*month/);
  if (everyMonths) {
    const months = Number.parseInt(everyMonths[1]!, 10);
    if (months > 0) return months;
  }

  const monthsMatch = normalized.match(/(\d+)[\s-]*months?/);
  if (monthsMatch) {
    const months = Number.parseInt(monthsMatch[1]!, 10);
    if (months > 0) return months;
  }

  return null;
}

function savingsPercentVsBaseline(
  baseline: number,
  optionCost: number
): number | null {
  if (baseline <= 0 || optionCost >= baseline) return null;
  return Math.round((1 - optionCost / baseline) * 100);
}

export function computeMembershipPricingSavings(
  pricing: MembershipPricingInput
): MembershipPricingSavings {
  const monthly = pricing.monthly;
  if (monthly == null || monthly <= 0) {
    return { splitVsMonthlyPercent: null, annualVsMonthlyPercent: null };
  }

  const monthlyAnnualized = monthly * 12;
  const split = pricing.paymentSplit;

  let splitVsMonthlyPercent: number | null = null;
  if (split?.cost != null && split.cost > 0) {
    const monthsPerPayment = getMonthsPerSplitPayment(split.frequency);
    if (monthsPerPayment != null && monthsPerPayment > 0) {
      splitVsMonthlyPercent = savingsPercentVsBaseline(
        monthly * monthsPerPayment,
        split.cost
      );
    }
  }

  let annualVsMonthlyPercent: number | null = null;
  if (pricing.annually != null && pricing.annually > 0) {
    annualVsMonthlyPercent = savingsPercentVsBaseline(
      monthlyAnnualized,
      pricing.annually
    );
  }

  return { splitVsMonthlyPercent, annualVsMonthlyPercent };
}
