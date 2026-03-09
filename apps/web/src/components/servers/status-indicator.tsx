import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: string;
  className?: string;
}

const PULSING_STATUSES = ["running", "starting", "installing", "createbackup", "restorebackup"];
const AMBER_STATUSES = ["installing", "starting", "createbackup", "restorebackup", "backupplanned", "restoreplanned", "stopping"];

function getColor(status: string): string {
  if (status === "running") return "bg-emerald-500";
  if (status === "stopped" || status === "shutdown") return "bg-red-500";
  if (status === "error") return "bg-red-600";
  if (AMBER_STATUSES.includes(status)) return "bg-amber-500";
  if (status === "preorder") return "bg-blue-500";
  return "bg-slate-400";
}

function getPulseColor(status: string): string {
  if (status === "running") return "bg-emerald-400";
  if (AMBER_STATUSES.includes(status)) return "bg-amber-400";
  return "bg-slate-400";
}

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  const shouldPulse = PULSING_STATUSES.includes(status);

  return (
    <span className={cn("relative flex h-2.5 w-2.5", className)}>
      {shouldPulse && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            getPulseColor(status)
          )}
        />
      )}
      <span
        className={cn(
          "relative inline-flex h-2.5 w-2.5 rounded-full",
          getColor(status)
        )}
      />
    </span>
  );
}
