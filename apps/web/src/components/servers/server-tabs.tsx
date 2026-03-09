"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MonitoringTab } from "./tabs/monitoring-tab";
import { NetworkTab } from "./tabs/network-tab";
import { BackupsTab } from "./tabs/backups-tab";
import { CronTab } from "./tabs/cron-tab";
import { ReinstallTab } from "./tabs/reinstall-tab";
import { ExtendTab } from "./tabs/extend-tab";
import { ConsoleTab } from "./tabs/console-tab";

const tabs = [
  { id: "monitoring", label: "Monitoring" },
  { id: "console", label: "Console" },
  { id: "network", label: "Network" },
  { id: "backups", label: "Backups" },
  { id: "cron", label: "Cron Jobs" },
  { id: "extend", label: "Extend" },
  { id: "reinstall", label: "Reinstall" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function ServerTabs({ serverId }: { serverId: string }) {
  const [activeTab, setActiveTab] = useState<TabId>("monitoring");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "whitespace-nowrap flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200",
              activeTab === tab.id
                ? "bg-white text-indigo-700 shadow-[0_1px_3px_rgba(79,70,229,0.1)]"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "monitoring" && <MonitoringTab serverId={serverId} />}
        {activeTab === "console" && <ConsoleTab serverId={serverId} />}
        {activeTab === "network" && <NetworkTab serverId={serverId} />}
        {activeTab === "backups" && <BackupsTab serverId={serverId} />}
        {activeTab === "cron" && <CronTab serverId={serverId} />}
        {activeTab === "extend" && <ExtendTab serverId={serverId} />}
        {activeTab === "reinstall" && <ReinstallTab serverId={serverId} />}
      </div>
    </div>
  );
}
