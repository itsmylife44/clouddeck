"use client";

import { useState } from "react";
import { Clock, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerCrons } from "@/hooks/use-servers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";

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

export function CronTab({ serverId }: { serverId: string }) {
  const { data: rawCrons, isLoading } = useServerCrons(serverId);
  const crons = Array.isArray(rawCrons) ? rawCrons : [];
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", action: "restart", expression: "" });

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/servers/${serverId}/cron`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Cron job created");
      setShowForm(false);
      setForm({ name: "", action: "restart", expression: "" });
      queryClient.invalidateQueries({ queryKey: ["server-crons", serverId] });
    } catch {
      toast.error("Failed to create cron job");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cronId: string) {
    try {
      const res = await fetch(`/api/servers/${serverId}/cron`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cronId }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Cron job deleted");
      queryClient.invalidateQueries({ queryKey: ["server-crons", serverId] });
    } catch {
      toast.error("Failed to delete cron job");
    }
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
          <Clock className="h-5 w-5 text-indigo-600" />
          Cron Jobs
        </CardTitle>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Cron Job
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Daily restart"
                />
              </div>
              <div className="space-y-1">
                <Label>Action</Label>
                <select
                  value={form.action}
                  onChange={(e) => setForm({ ...form, action: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="start">Start</option>
                  <option value="stop">Stop</option>
                  <option value="restart">Restart</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Cron Expression</Label>
                <Input
                  value={form.expression}
                  onChange={(e) => setForm({ ...form, expression: e.target.value })}
                  placeholder="0 3 * * *"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!crons || crons.length === 0 ? (
          <p className="text-sm text-slate-500">No cron jobs configured</p>
        ) : (
          <div className="space-y-3">
            {crons.map((cron) => (
              <div
                key={cron.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 p-4"
              >
                <div>
                  <p className="font-medium text-slate-900">{cron.displayname}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">
                      {cron.expression}
                    </code>
                    <Badge>{cron.action}</Badge>
                    {cron.nextexecute && (
                      <span>Next: {formatTimestamp(cron.nextexecute)}</span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(String(cron.id))}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
