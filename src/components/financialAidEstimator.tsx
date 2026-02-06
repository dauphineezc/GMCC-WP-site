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

export default function FinancialAidEstimator() {
  const [incomeIndex, setIncomeIndex] = useState<string>("");
  const [householdSize, setHouseholdSize] = useState<string>("");

  const getResult = () => {
    if (!incomeIndex || !householdSize) {
      return {
        className: "gm-result",
        content: "Select an income range and a household size to see your estimated eligibility."
      };
    }

    const ok = ELIGIBILITY[householdSize]?.[Number(incomeIndex)] === true;

    if (ok) {
      return {
        className: "gm-result gm-ok",
        content: (
          <>
            You are likely eligible for financial assistance with our sliding scale program.
            Find out exactly how much you could save by filling out the application:{" "}
            <a className="link font-semibold text-gmcc-navy underline-offset-4 group-hover:underline" href="https://static1.squarespace.com/static/54352636e4b03176bba53234/t/67ed3211153f540535644fe6/1743598098804/Sliding+Scale+Application+Form+%26+Survey.pdf">
              Financial Assistance Application
            </a>
          </>
        )
      };
    } else {
      return {
        className: "gm-result gm-warn",
        content: (
          <>
            You likely do not qualify for financial assistance with our sliding scale program,
            but if you&apos;d like to confirm, please provide us with more details by submitting the application:{" "}
            <a className="link font-semibold text-gmcc-navy underline-offset-4 group-hover:underline" href="https://static1.squarespace.com/static/54352636e4b03176bba53234/t/67ed3211153f540535644fe6/1743598098804/Sliding+Scale+Application+Form+%26+Survey.pdf">
              Financial Assistance Application
            </a>
          </>
        )
      };
    }
  };

  const result = getResult();

  return (
    <div className="gm-card">
      <h3 style={{ marginBottom: '12px' }}>Sliding Scale Financial Assistance Estimator</h3>

      <div className="gm-grid">
        <label className="gm-field">
          <span>Annual household income</span>
          <select
            value={incomeIndex}
            onChange={(e) => setIncomeIndex(e.target.value)}
          >
            <option value="">— Select income range —</option>
            {INCOME_RANGES.map((label, idx) => (
              <option key={idx} value={String(idx)}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="gm-field">
          <span>Household size</span>
          <select
            value={householdSize}
            onChange={(e) => setHouseholdSize(e.target.value)}
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

      <style>{`
        .gm-card {
          --bg: #ffffff;
          --text:#111827;
          --muted:#6b7280;
          --brand:#0ea5e9;
          --ring:rgba(14,165,233,.25);
          --ok:#065f46;
          --warn:#7c2d12;

          max-width: 680px;
          margin: 1.25rem auto;
          padding: 1.25rem 1.25rem 1.5rem;
          background: var(--bg);
          color: var(--text);
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          box-shadow: 0 6px 24px rgba(0,0,0,.06);
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        }
        .gm-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: .85rem;
        }
        @media (max-width:640px){ .gm-grid{ grid-template-columns: 1fr; } }
        .gm-field { display:flex; flex-direction:column; gap:.35rem; font-size:.95rem; }
        .gm-field span{ color: var(--muted); font-weight:600; }
        .gm-field select{
          appearance:none; width:100%;
          padding:.7rem .9rem; border:1px solid #e5e7eb; border-radius:10px;
          background:#fff;
        }
        .gm-result {
          margin-top: 1rem;
          padding:.9rem 1rem;
          border-radius:10px;
          border:1px dashed #e5e7eb;
          font-size: .98rem;
        }
        .gm-ok {
          border-color:#a7f3d0;
          background:#ecfdf5;
          color:var(--ok);
        }
        .gm-warn {
          border-color:#fde68a;
          background:#fffbeb;
          color:var(--warn);
        }
      `}</style>
    </div>
  );
}