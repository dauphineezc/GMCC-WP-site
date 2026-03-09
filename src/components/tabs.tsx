"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

export type TabItem<T extends string = string> = {
  id: T;
  label: string;
  content: ReactNode;
};

type SponsorshipTabsProps<T extends string = string> = {
  tabs: ReadonlyArray<TabItem<T>>;
  defaultTab?: T;
};

export default function SponsorshipTabs<T extends string = string>({
  tabs,
  defaultTab,
}: SponsorshipTabsProps<T>) {
  const firstTabId = tabs[0]?.id;
  const initialTab = defaultTab ?? firstTabId;

  const [activeTab, setActiveTab] = useState<T | undefined>(initialTab);

  const activeTabContent = useMemo(
    () => tabs.find((tab) => tab.id === activeTab)?.content,
    [activeTab, tabs],
  );

  if (!tabs.length) return null;

  return (
    <div className="space-y-4">
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors
                ${
                  activeTab === tab.id
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
                }
              `}
              aria-current={activeTab === tab.id ? "page" : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[200px]">{activeTabContent}</div>
    </div>
  );
}
