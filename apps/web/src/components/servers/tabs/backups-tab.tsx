"use client";

import { useState } from "react";
import { Archive, Plus, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerBackups, useBackupAction } from "@/hooks/use-servers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function formatTimestamp(value: string | number | undefined): string {
  if (!value) return "—";
  const n = Number(value);
  if (!isNaN(n) && n > 1_000_000_000 && n < 10_000_000_000) {
    return new Date(n * 1000).toLocaleString();
  }
  if (!isNaN(n) && n > 1_000_000_000_000) {
    return new Date(n).toLocaleString();
  }
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

export function BackupsTab({ serverId }: { serverId: string }) {
  const { data: rawBackups, isLoading } = useServerBackups(serverId);
  const backups = Array.isArray(rawBackups) ? rawBackups : [];
  const backupMutation = useBackupAction(serverId);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleAction(action: "create" | "restore" | "delete", backup?: string) {
    if (action === "delete" && confirmDelete !== backup) {
      setConfirmDelete(backup ?? null);
      return;
    }

    setConfirmDelete(null);
    backupMutation.mutate(
      { action, backup },
      {
        onSuccess: () => toast.success(`Backup ${action} executed`),
        onError: (err) => toast.error(err.message),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <Card className="hover:translate-y-0">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-indigo-600" />
          Backups
        </CardTitle>
        <Button
          size="sm"
          onClick={() => handleAction("create")}
          disabled={backupMutation.isPending}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Create Backup
        </Button>
      </CardHeader>
      <CardContent>
        {!backups || backups.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No backups yet</p>
        ) : (
          <div className="space-y-3">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-700 p-4"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{backup.displayname || backup.backupname || backup.id}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{formatTimestamp(backup.created_on)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAction("restore", backup.id)}
                    disabled={backupMutation.isPending}
                    className="gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restore
                  </Button>
                  {confirmDelete === backup.id ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleAction("delete", backup.id)}
                        disabled={backupMutation.isPending}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDelete(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAction("delete", backup.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
