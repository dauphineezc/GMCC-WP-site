"use client";

import { useEffect } from "react";

export default function FinancialAidEstimator() {
  useEffect(() => {
    // ------- ORIGINAL LOGIC STARTS HERE ----------
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

    const incomeSel = document.getElementById("gm-income") as HTMLSelectElement;
    const sizeSel   = document.getElementById("gm-size") as HTMLSelectElement;
    const resultEl  = document.getElementById("gm-result") as HTMLElement;

    // Populate income options
    INCOME_RANGES.forEach((label, idx) => {
      const opt = document.createElement("option");
      opt.value = String(idx);
      opt.textContent = label;
      incomeSel.appendChild(opt);
    });

    function render() {
      const row = incomeSel.value;
      const size = sizeSel.value;

      if (!row || !size) {
        resultEl.className = "gm-result";
        resultEl.textContent =
          "Select an income range and a household size to see your estimated eligibility.";
        return;
      }

      const ok = (ELIGIBILITY[size] && ELIGIBILITY[size][Number(row)]) === true;

      if (ok) {
        resultEl.className = "gm-result gm-ok";
        resultEl.innerHTML =
          `You are likely eligible for financial assistance with our sliding scale program. ` +
          `Find out exactly how much you could save by filling out the application: ` +
          `<a href="https://static1.squarespace.com/static/54352636e4b03176bba53234/t/67ed3211153f540535644fe6/1743598098804/Sliding+Scale+Application+Form+%26+Survey.pdf">Financial Assistance Application</a>`;
      } else {
        resultEl.className = "gm-result gm-warn";
        resultEl.innerHTML =
          `You likely do not qualify for financial assistance with our sliding scale program, ` +
          `but if you'd like to confirm, please provide us with more details by submitting the application: ` +
          `<a href="https://static1.squarespace.com/static/54352636e4b03176bba53234/t/67ed3211153f540535644fe6/1743598098804/Sliding+Scale+Application+Form+%26+Survey.pdf">Financial Assistance Application</a>`;
      }
    }

    incomeSel.addEventListener("change", render);
    sizeSel.addEventListener("change", render);
    render();

    return () => {
      incomeSel.removeEventListener("change", render);
      sizeSel.removeEventListener("change", render);
    };
    // ------- ORIGINAL LOGIC ENDS HERE ----------
  }, []);

  return (
    <div className="gm-card">
      <h3>Sliding Scale Financial Assistance Estimator</h3>

      <div className="gm-grid">
        <label className="gm-field">
          <span>Annual household income</span>
          <select id="gm-income">
            <option value="" selected>
              — Select income range —
            </option>
          </select>
        </label>

        <label className="gm-field">
          <span>Household size</span>
          <select id="gm-size">
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

      <div id="gm-result" className="gm-result" aria-live="polite"></div>

      {/* Inject your CSS exactly as-is */}
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