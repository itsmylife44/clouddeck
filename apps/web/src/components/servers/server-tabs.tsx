"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Permission, hasPermission } from "@/lib/permissions";
import { useMyPermissions } from "@/hooks/use-permissions";
import { MonitoringTab } from "./tabs/monitoring-tab";
import { NetworkTab } from "./tabs/network-tab";
import { BackupsTab } from "./tabs/backups-tab";
import { CronTab } from "./tabs/cron-tab";
import { ReinstallTab } from "./tabs/reinstall-tab";
import { ExtendTab } from "./tabs/extend-tab";
import { ConsoleTab } from "./tabs/console-tab";

const tabs = [
  { id: "monitoring", label: "Monitoring", flag: Permission.VIEW },
  { id: "console", label: "Console", flag: Permission.CONSOLE },
  { id: "network", label: "Network", flag: Permission.NETWORK },
  { id: "backups", label: "Backups", flag: Permission.BACKUP },
  { id: "cron", label: "Cron Jobs", flag: Permission.CRON },
  { id: "extend", label: "Extend", flag: Permission.EXTEND },
  { id: "reinstall", label: "Reinstall", flag: Permission.REINSTALL },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function ServerTabs({ serverId }: { serverId: string }) {
  const [activeTab, setActiveTab] = useState<TabId>("monitoring");
  const { data: perms } = useMyPermissions(serverId);

  // While permissions are loading, or for ADMINs, allow all
  const mask = perms?.role === "ADMIN" ? 255 : (perms?.mask ?? 0);

  const activeTabConfig = tabs.find((t) => t.id === activeTab);
  const hasAccess = activeTabConfig ? hasPermission(mask, activeTabConfig.flag) : false;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 p-1 overflow-x-auto">
        {tabs.map((tab) => {
          const allowed = hasPermission(mask, tab.flag);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "whitespace-nowrap flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200",
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-[0_1px_3px_rgba(79,70,229,0.1)]"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
                !allowed && "opacity-50"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div>
        {!perms ? null : !hasAccess ? (
          <NoPermission />
        ) : (
          <>
            {activeTab === "monitoring" && <MonitoringTab serverId={serverId} />}
            {activeTab === "console" && <ConsoleTab serverId={serverId} />}
            {activeTab === "network" && <NetworkTab serverId={serverId} />}
            {activeTab === "backups" && <BackupsTab serverId={serverId} />}
            {activeTab === "cron" && <CronTab serverId={serverId} />}
            {activeTab === "extend" && <ExtendTab serverId={serverId} />}
            {activeTab === "reinstall" && <ReinstallTab serverId={serverId} />}
          </>
        )}
      </div>
    </div>
  );
}

function NoPermission() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20">
        <ShieldAlert className="h-7 w-7 text-amber-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">No Permission</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        You don&apos;t have permission to access this feature. Contact your administrator to request access.
      </p>
    </div>
  );
}
