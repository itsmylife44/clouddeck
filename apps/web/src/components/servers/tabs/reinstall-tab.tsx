"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { useServerOs } from "@/hooks/use-servers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ReinstallTab({ serverId }: { serverId: string }) {
  const { data: rawOsOptions, isLoading, refetch } = useServerOs(serverId);
  const osOptions = Array.isArray(rawOsOptions) ? rawOsOptions : [];
  const [selectedOs, setSelectedOs] = useState<{ id: string; proxmoxid: number } | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [reinstalling, setReinstalling] = useState(false);
  const [loaded, setLoaded] = useState(false);

  function loadOs() {
    refetch();
    setLoaded(true);
  }

  async function handleReinstall() {
    if (!selectedOs) return;
    if (!confirm) {
      setConfirm(true);
      return;
    }

    setReinstalling(true);
    try {
      const res = await fetch(`/api/servers/${serverId}/reinstall`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ os: selectedOs.proxmoxid }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Reinstall initiated. This may take several minutes.");
      setConfirm(false);
      setSelectedOs(null);
    } catch {
      toast.error("Failed to reinstall");
    } finally {
      setReinstalling(false);
    }
  }

  return (
    <Card className="hover:translate-y-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-indigo-600" />
          Reinstall Operating System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">Danger Zone</p>
              <p className="text-sm text-amber-700 mt-1">
                Reinstalling the OS will <strong>permanently delete all data</strong> on this
                server. This action cannot be undone. Make sure you have a backup.
              </p>
            </div>
          </div>
        </div>

        {!loaded ? (
          <Button variant="secondary" onClick={loadOs}>
            Load OS Options
          </Button>
        ) : isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {osOptions?.map((os) => (
                <button
                  key={os.id}
                  onClick={() => {
                    setSelectedOs({ id: os.id, proxmoxid: os.proxmoxid });
                    setConfirm(false);
                  }}
                  className={`rounded-lg border p-3 text-left text-sm transition-all duration-200 ${
                    selectedOs?.id === os.id
                      ? "border-indigo-300 bg-indigo-50 ring-2 ring-indigo-500"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <p className="font-medium text-slate-900">{os.displayname}</p>
                  <p className="text-xs text-slate-500">{os.type}</p>
                </button>
              ))}
            </div>

            {selectedOs && (
              <div className="flex items-center gap-3">
                <Button
                  variant="danger"
                  onClick={handleReinstall}
                  disabled={reinstalling}
                >
                  {reinstalling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : confirm ? (
                    "I understand, reinstall now"
                  ) : (
                    "Reinstall Server"
                  )}
                </Button>
                {confirm && (
                  <Button variant="ghost" onClick={() => setConfirm(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
