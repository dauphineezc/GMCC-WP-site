"use client";

import { useState } from "react";

const INCOME_RANGES = [
  "$0–$25,500",
  "$25,501–$30,500",
  "$30,501–$35,500",
  "$35,501–$40,500",
  "$40,501–$45,500",
  "$45,501–$50,500",
  "$50,501–$55,500",
  "$55,501–$60,500",
  "$60,501–$65,500",
  "$65,501–$70,500",
  "$70,501–$75,500",
  "$75,501–$80,500",
  "$80,501–$85,500",
  "$85,501+"
];

const ELIGIBILITY: Record<string, boolean[]> = {
  "1":  [true,true,true,true,true,true,true,false,false,false,false,false,false,false],
  "2":  [true,true,true,true,true,true,true,true,false,false,false,false,false,false],
  "3":  [true,true,true,true,true,true,true,true,true,true,true,false,false,false],
  "4":  [true,true,true,true,true,true,true,true,true,true,true,true,false,false],
  "5":  [true,true,true,true,true,true,true,true,true,true,true,true,false,false],
  "6+": [true,true,true,true,true,true,true,true,true,true,true,true,true,false],
};

type Props = {
  onClose?: () => void;
};

export default function FinancialAidEstimator({ onClose }: Props) {
  const [incomeIndex, setIncomeIndex] = useState<string>("");
  const [householdSize, setHouseholdSize] = useState<string>("");

  const getResult = () => {
    if (!incomeIndex || !householdSize) {
      return {
        className: "rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600",
        content: "Select an income range and a household size to see your estimated eligibility."
      };
    }

    const ok = ELIGIBILITY[householdSize]?.[Number(incomeIndex)] === true;

    if (ok) {
      return {
        className: "rounded-xl border border-gmcc-green bg-gmcc-green/10 p-4 text-sm text-gmcc-navy",
        content: (
          <>
            You are likely eligible for financial assistance with our sliding scale program.
            Find out exactly how much you could save by filling out the application:{" "}
            <a className="link font-semibold text-gmcc-teal underline-offset-4 group-hover:underline" href="https://static1.squarespace.com/static/54352636e4b03176bba53234/t/67ed3211153f540535644fe6/1743598098804/Sliding+Scale+Application+Form+%26+Survey.pdf">
              Financial Assistance Application
            </a>
          </>
        )
      };
    } else {
      return {
        className: "rounded-xl border border-gmcc-blue-light bg-gmcc-blue-light/10 p-4 text-sm text-gmcc-navy",
        content: (
          <>
            You likely do not qualify for financial assistance with our sliding scale program,
            but if you&apos;d like to confirm, please provide us with more details by submitting the application:{" "}
            <a className="link font-semibold text-gmcc-teal underline-offset-4 group-hover:underline" href="https://static1.squarespace.com/static/54352636e4b03176bba53234/t/67ed3211153f540535644fe6/1743598098804/Sliding+Scale+Application+Form+%26+Survey.pdf">
              Financial Assistance Application
            </a>
          </>
        )
      };
    }
  };

  const result = getResult();

  return (
    <div className="mt-16 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg">
      <div className="bg-gmcc-navy px-6 py-5 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
              Sliding Scale Financial Assistance Estimator
            </h3>
            <p className="mt-1 text-sm text-white/70">
              Answer two quick questions to get an eligibility estimate.
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close financial assistance estimator"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-5 px-6 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="small font-semibold text-gmcc-navy">Annual household income</span>
          <select
            value={incomeIndex}
            onChange={(e) => setIncomeIndex(e.target.value)}
            className="w-full rounded-xl border-2 border-neutral-200 bg-white px-4 py-3 text-sm text-gmcc-navy transition-all focus:border-gmcc-navy/40 focus:outline-none focus:ring-2 focus:ring-gmcc-blue-light/60"
          >
            <option value="">— Select income range —</option>
            {INCOME_RANGES.map((label, idx) => (
              <option key={idx} value={String(idx)}>
                {label}
              </option>
            ))}
          </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="small font-semibold text-gmcc-navy">Household size</span>
          <select
            value={householdSize}
            onChange={(e) => setHouseholdSize(e.target.value)}
            className="w-full rounded-xl border-2 border-neutral-200 bg-white px-4 py-3 text-sm text-gmcc-navy transition-all focus:border-gmcc-navy/40 focus:outline-none focus:ring-2 focus:ring-gmcc-blue-light/60"
          >
            <option value="">— Select household size —</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6+">6+</option>
          </select>
          </label>
        </div>

        <div className={result.className} aria-live="polite">
          {result.content}
        </div>
      </div>
    </div>
  );
}