"use client";

import { useState } from "react";

type TabId = "about" | "history" | "visit" | "programs" | "membership";

type Tab = {
  id: TabId;
  label: string;
  content: React.ReactNode;
};

type CenterTabsProps = {
  tabs: Tab[];
  defaultTab?: TabId;
};

export default function CenterTabs({ tabs, defaultTab = "about" }: CenterTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
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

      {/* Tab Content */}
      <div className="min-h-[200px]">{activeTabContent}</div>
    </div>
  );
}

