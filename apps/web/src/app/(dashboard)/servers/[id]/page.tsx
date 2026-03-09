"use client";

import { use, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Play,
  Square,
  RotateCcw,
  Power,
  Loader2,
  Cpu,
  MemoryStick,
  HardDrive,
  Calendar,
  Server,
  Globe,
  Monitor,
  Network,
  KeyRound,
  User,
  Hash,
  Tag,
  Pencil,
  Check,
  X,
  EyeOff as EyeOffIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useServer, useServerStatus, usePowerAction, useHideService, useUpdateServerLabel } from "@/hooks/use-servers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "@/components/servers/status-indicator";
import { ServerTabs } from "@/components/servers/server-tabs";
import { CopyButton } from "@/components/ui/copy-button";
import { PasswordField } from "@/components/ui/password-field";
import { LoadingSpinner } from "@/components/ui/loading-state";
import { formatMemory, formatDisk, formatUplink, formatExpiry, formatDate } from "@/lib/formatters";

export default function ServerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const { data: server, isLoading } = useServer(id);
  const { data: status } = useServerStatus(id);
  const powerMutation = usePowerAction(id);
  const hideMutation = useHideService(id);
  const updateLabel = useUpdateServerLabel();
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState("");
  const labelInputRef = useRef<HTMLInputElement>(null);

  function handlePower(action: "start" | "stop" | "shutdown" | "restart") {
    if (["stop", "shutdown", "restart"].includes(action) && confirmAction !== action) {
      setConfirmAction(action);
      return;
    }

    setConfirmAction(null);
    powerMutation.mutate(action, {
      onSuccess: () => toast.success(`Server ${action} executed`),
      onError: (err) => toast.error(err.message),
    });
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!server) {
    return (
      <div className="py-20 text-center text-slate-500">Server not found</div>
    );
  }

  const displayStatus = status?.status ?? server.status ?? "unknown";

  // Feature flags from the display object
  const features = {
    novnc: server.novnc,
    livedata: server.livedata,
    backup: server.backup,
    cron: server.cron,
    traffic: server.traffic,
  };

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => router.push("/servers")}
          className="group mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Servers
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              {editingLabel ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateLabel.mutate(
                      { serviceId: id, label: labelDraft },
                      {
                        onSuccess: () => {
                          setEditingLabel(false);
                          toast.success(labelDraft.trim() ? "Label saved" : "Label removed");
                        },
                        onError: (err) => toast.error(err.message),
                      },
                    );
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={labelInputRef}
                    value={labelDraft}
                    onChange={(e) => setLabelDraft(e.target.value)}
                    placeholder={server.name || server.hostname || "Server label"}
                    maxLength={100}
                    className="h-10 rounded-lg border border-indigo-300 bg-white px-3 text-2xl font-extrabold tracking-tight text-slate-900 outline-none ring-2 ring-indigo-100"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={updateLabel.isPending}
                    aria-label="Save label"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50"
                  >
                    {updateLabel.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingLabel(false)}
                    aria-label="Cancel edit"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                    {server.customLabel || server.name || server.hostname || "Server"}
                  </h1>
                  {session?.user?.role === "ADMIN" && (
                    <button
                      onClick={() => {
                        setLabelDraft(server.customLabel || "");
                        setEditingLabel(true);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600"
                      title="Edit server label"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="mt-1 flex items-center gap-3">
              <StatusIndicator status={displayStatus} />
              <Badge
                variant={
                  displayStatus === "running"
                    ? "success"
                    : displayStatus === "stopped" || displayStatus === "shutdown"
                    ? "danger"
                    : "warning"
                }
              >
                {displayStatus}
              </Badge>
              <span className="text-sm text-slate-500">
                {server.productdisplay || "VPS"}
              </span>
            </div>
          </div>

          {/* Power controls */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handlePower("start")}
              disabled={powerMutation.isPending}
              className="gap-1.5"
            >
              <Play className="h-3.5 w-3.5" />
              Start
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handlePower("restart")}
              disabled={powerMutation.isPending}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restart
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handlePower("shutdown")}
              disabled={powerMutation.isPending}
              className="gap-1.5"
            >
              <Power className="h-3.5 w-3.5" />
              Shutdown
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handlePower("stop")}
              disabled={powerMutation.isPending}
              className="gap-1.5"
            >
              <Square className="h-3.5 w-3.5" />
              Force Stop
            </Button>
            <div className="w-px h-6 bg-slate-200" />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmAction("hide")}
              disabled={hideMutation.isPending}
              className="gap-1.5 text-slate-500 hover:text-red-600"
            >
              {hideMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <EyeOffIcon className="h-3.5 w-3.5" />
              )}
              Hide
            </Button>
          </div>
        </div>

        {/* Confirm dialog */}
        {confirmAction && confirmAction !== "hide" && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <span className="text-sm text-amber-800">
              Are you sure you want to <strong>{confirmAction}</strong> this server?
            </span>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handlePower(confirmAction as "stop" | "shutdown" | "restart")}
            >
              {powerMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Confirm"
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmAction(null)}
            >
              Cancel
            </Button>
          </div>
        )}

        {confirmAction === "hide" && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <span className="text-sm text-red-800">
              Are you sure you want to <strong>hide</strong> this server? It will be removed from your server list.
            </span>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                hideMutation.mutate(undefined, {
                  onSuccess: () => {
                    toast.success("Server hidden from list");
                    router.push("/servers");
                  },
                  onError: (err) => toast.error(err.message),
                });
              }}
            >
              {hideMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Hide Server"
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmAction(null)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Hardware Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:translate-y-0">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
              <Cpu className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">CPU</p>
              <p className="text-lg font-bold text-slate-900">{server.cores ?? "—"} vCPU</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:translate-y-0">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
              <MemoryStick className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">RAM</p>
              <p className="text-lg font-bold text-slate-900">{formatMemory(server.memory)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:translate-y-0">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <HardDrive className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Storage</p>
              <p className="text-lg font-bold text-slate-900">{formatDisk(server.disk)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:translate-y-0">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Globe className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Uplink</p>
              <p className="text-lg font-bold text-slate-900">{formatUplink(server.uplink)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Access Credentials & Server Details */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Credentials Card */}
        <Card className="hover:translate-y-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-5 w-5 text-indigo-600" />
              Access Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {server.user && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <User className="h-4 w-4" />
                  Username
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium text-slate-900">{server.user}</span>
                  <CopyButton value={server.user} />
                </div>
              </div>
            )}
            {server.password && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <KeyRound className="h-4 w-4" />
                  Password
                </div>
                <PasswordField value={server.password} />
              </div>
            )}
            {server.hostname && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Server className="h-4 w-4" />
                  Hostname
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-slate-900">{server.hostname}</span>
                  <CopyButton value={server.hostname} />
                </div>
              </div>
            )}
            {server.ip && typeof server.ip === "string" && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Globe className="h-4 w-4" />
                  IP Address
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-slate-900">{server.ip}</span>
                  <CopyButton value={server.ip} />
                </div>
              </div>
            )}
            {!server.user && !server.password && !server.hostname && (
              <p className="text-sm text-slate-400">No credentials available</p>
            )}
          </CardContent>
        </Card>

        {/* Server Info Card */}
        <Card className="hover:translate-y-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Monitor className="h-5 w-5 text-indigo-600" />
              Server Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(server.osName || server.os) && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Monitor className="h-4 w-4" />
                  OS Template
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    {server.osName || server.os}
                  </span>
                </div>
              </div>
            )}
            {server.mac && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Network className="h-4 w-4" />
                  MAC Address
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-slate-900">{server.mac}</span>
                  <CopyButton value={server.mac} />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="h-4 w-4" />
                Created
              </div>
              <span className="text-sm text-slate-900">{formatDate(server.created_on)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="h-4 w-4" />
                Expires
              </div>
              <span className="text-sm text-slate-900">{formatExpiry(server.expire_at)}</span>
            </div>
            {server.price && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Tag className="h-4 w-4" />
                  Price
                </div>
                <span className="text-sm font-medium text-slate-900">{server.price} €/month</span>
              </div>
            )}
            {server.proxmoxid && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Hash className="h-4 w-4" />
                  VM ID
                </div>
                <span className="font-mono text-sm text-slate-900">{server.proxmoxid}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Badges */}
      <div className="flex flex-wrap gap-2">
        {features.novnc ? (
          <Badge variant="default">noVNC Console</Badge>
        ) : null}
        {features.livedata ? (
          <Badge variant="default">Live Monitoring</Badge>
        ) : null}
        {features.backup ? (
          <Badge variant="default">Backups</Badge>
        ) : null}
        {features.cron ? (
          <Badge variant="default">Cron Jobs</Badge>
        ) : null}
        {features.traffic ? (
          <Badge variant="default">Traffic Stats</Badge>
        ) : null}
      </div>

      {/* Tabs: Network, Backups, Cron, Reinstall */}
      <ServerTabs serverId={id} />
    </div>
  );
}
