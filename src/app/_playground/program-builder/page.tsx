"use client";

import { useState } from "react";

type Offering =
  | "class"
  | "clinic"
  | "camp"
  | "league"
  | "trip"
  | "workshop"
  | "dropin";

export default function ProgramBuilder() {
  const [offeringType, setOfferingType] = useState<Offering>("class");
  const [form, setForm] = useState({
    title: "",
    summary: "",
    ageMin: "",
    ageMax: "",
    skillLevel: "Beginner",
    duration: "",
    priceFrom: "",
    activityCode: "",
    sectionCodes: "",
    deepLink: "",
    nextStartDate: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const isRecTrac = true; // pretend registrationSystem = rectrac for now

  const showScheduleGroup =
    isRecTrac && ["class", "clinic", "camp", "league", "dropin"].includes(offeringType);

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Program Playground</h1>
      <p className="text-sm text-neutral-600">
        This doesn’t save anywhere—just lets you test field visibility & structure.
      </p>

      <div className="grid gap-4">
        <label className="block">
          <span className="text-sm font-medium">Title *</span>
          <input className="mt-1 w-full rounded border p-2" value={form.title} onChange={set("title")} placeholder="Beginner Tennis Clinic" />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Short Summary (160–220 chars) *</span>
          <textarea className="mt-1 w-full rounded border p-2" value={form.summary} onChange={set("summary")} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Offering Type *</span>
          <select
            className="mt-1 w-full rounded border p-2"
            value={offeringType}
            onChange={e => setOfferingType(e.target.value as Offering)}
          >
            <option value="class">Class</option>
            <option value="clinic">Clinic</option>
            <option value="camp">Camp</option>
            <option value="league">League</option>
            <option value="trip">Trip</option>
            <option value="workshop">Workshop</option>
            <option value="dropin">Drop-in</option>
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium">Age Min</span>
            <input className="mt-1 w-full rounded border p-2" value={form.ageMin} onChange={set("ageMin")} type="number" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Age Max</span>
            <input className="mt-1 w-full rounded border p-2" value={form.ageMax} onChange={set("ageMax")} type="number" />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Skill Level</span>
          <select className="mt-1 w-full rounded border p-2" value={form.skillLevel} onChange={set("skillLevel")}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
            <option>All Levels</option>
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium">Duration</span>
            <input className="mt-1 w-full rounded border p-2" value={form.duration} onChange={set("duration")} placeholder="6 weeks" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Price From</span>
            <input className="mt-1 w-full rounded border p-2" value={form.priceFrom} onChange={set("priceFrom")} type="number" />
          </label>
        </div>

        {showScheduleGroup && (
          <fieldset className="rounded-lg border p-4">
            <legend className="px-2 text-sm font-medium">External Schedule (RecTrac)</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Activity Code</span>
                <input className="mt-1 w-full rounded border p-2" value={form.activityCode} onChange={set("activityCode")} />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Section Codes (comma-sep)</span>
                <input className="mt-1 w-full rounded border p-2" value={form.sectionCodes} onChange={set("sectionCodes")} placeholder="A1,A2" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-medium">Deep Link URL</span>
                <input className="mt-1 w-full rounded border p-2" value={form.deepLink} onChange={set("deepLink")} placeholder="https://register..." />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Next Start Date</span>
                <input className="mt-1 w-full rounded border p-2" value={form.nextStartDate} onChange={set("nextStartDate")} type="date" />
              </label>
            </div>
          </fieldset>
        )}

        <pre className="mt-4 overflow-auto rounded bg-neutral-50 p-4 text-xs">
{JSON.stringify(
  {
    type: "program",
    title: form.title,
    summary: form.summary,
    offeringType,
    ageRange: { min: Number(form.ageMin) || undefined, max: Number(form.ageMax) || undefined },
    skillLevel: form.skillLevel,
    duration: form.duration,
    priceFrom: form.priceFrom ? Number(form.priceFrom) : undefined,
    externalSchedule: showScheduleGroup ? {
      system: "rectrac",
      activityCode: form.activityCode || undefined,
      sectionCodes: form.sectionCodes ? form.sectionCodes.split(",").map(s => s.trim()) : undefined,
      deepLink: form.deepLink || undefined,
      nextStartDate: form.nextStartDate || undefined,
    } : undefined,
  },
  null,
  2
)}
        </pre>
      </div>
    </main>
  );
}
