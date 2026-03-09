"use client";

import { useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Server, Plus, Trash2, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { LoadingSpinner, ErrorState, EmptyState } from "@/components/ui/loading-state";
import { useUserPermissions, useUpsertPermission, useDeletePermission } from "@/hooks/use-permissions";
import { useServers, useServerLabels } from "@/hooks/use-servers";
import { Permission, RoleTemplate } from "@/lib/permissions";

const PERMISSION_FLAGS = [
  { flag: Permission.VIEW, label: "View", description: "See server details, status, IPs, monitoring" },
  { flag: Permission.POWER, label: "Power", description: "Start, stop, restart, shutdown" },
  { flag: Permission.CONSOLE, label: "Console", description: "noVNC console access" },
  { flag: Permission.NETWORK, label: "Network", description: "Manage rDNS, view IPs" },
  { flag: Permission.BACKUP, label: "Backup", description: "Create, restore, delete backups" },
  { flag: Permission.CRON, label: "Cron", description: "Manage cron jobs" },
  { flag: Permission.REINSTALL, label: "Reinstall", description: "Reinstall OS" },
  { flag: Permission.EXTEND, label: "Extend", description: "Extend service, hide server" },
];

const ROLE_TEMPLATES = [
  { label: "Viewer", mask: RoleTemplate.VIEWER, color: "bg-blue-50 text-blue-700 border-blue-200" },
  { label: "Operator", mask: RoleTemplate.OPERATOR, color: "bg-amber-50 text-amber-700 border-amber-200" },
  { label: "Manager", mask: RoleTemplate.MANAGER, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
];

function hasFlag(mask: number, flag: number): boolean {
  return (mask & flag) === flag;
}

function toggleFlag(mask: number, flag: number): number {
  return hasFlag(mask, flag) ? mask & ~flag : mask | flag;
}

export default function UserPermissionsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const { data: permissions, isLoading, error, refetch } = useUserPermissions(userId);
  const { data: servers } = useServers();
  const { data: labels } = useServerLabels();
  const upsertPermission = useUpsertPermission();
  const deletePermission = useDeletePermission();
  const [showAdd, setShowAdd] = useState(false);

  function handleToggleFlag(serviceId: string, currentMask: number, flag: number) {
    const newMask = toggleFlag(currentMask, flag);

    // Ensure VIEW is always set if any other permission is set
    const finalMask = newMask > 0 && !hasFlag(newMask, Permission.VIEW)
      ? newMask | Permission.VIEW
      : newMask;

    upsertPermission.mutate(
      { userId, serviceId, mask: finalMask },
      {
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function handleApplyTemplate(serviceId: string, templateMask: number) {
    upsertPermission.mutate(
      { userId, serviceId, mask: templateMask },
      {
        onSuccess: () => toast.success("Template applied"),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function handleRemoveServer(serviceId: string) {
    deletePermission.mutate(
      { userId, serviceId },
      {
        onSuccess: () => toast.success("Server access removed"),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  // Resolve server display name from labels or API name
  function getServerName(serviceId: string): string {
    if (labels?.[serviceId]) return labels[serviceId];
    const srv = servers?.find((s) => String(s.id) === serviceId);
    return srv?.name || `Server ${serviceId}`;
  }

  // Servers not yet assigned to this user
  const assignedServiceIds = new Set(permissions?.map((p) => p.serviceId) ?? []);
  const unassignedServers = servers?.filter((s) => !assignedServiceIds.has(String(s.id))) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Server Permissions
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              User ID: {userId}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAdd(true)} disabled={unassignedServers.length === 0}>
          <Plus className="h-4 w-4" />
          Add Server
        </Button>
      </div>

      {isLoading && <LoadingSpinner />}

      {error && (
        <ErrorState
          title="Failed to load permissions"
          message={error.message}
          onRetry={() => refetch()}
        />
      )}

      {permissions && permissions.length === 0 && (
        <EmptyState
          icon={Shield}
          title="No server permissions"
          description="This user has no server access yet. Click 'Add Server' to grant access."
        />
      )}

      {permissions && permissions.length > 0 && (
        <div className="space-y-4">
          {permissions.map((perm) => (
            <Card key={perm.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                      <Server className="h-5 w-5 text-indigo-600" />
                    </div>
                    <CardTitle className="text-base">
                      {getServerName(perm.serviceId)}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Role templates */}
                    {ROLE_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.label}
                        onClick={() => handleApplyTemplate(perm.serviceId, tmpl.mask)}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-all hover:opacity-80 ${
                          perm.mask === tmpl.mask ? tmpl.color + " ring-1 ring-offset-1" : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {tmpl.label}
                      </button>
                    ))}
                    <button
                      onClick={() => handleRemoveServer(perm.serviceId)}
                      className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PERMISSION_FLAGS.map((p) => {
                    const active = hasFlag(perm.mask, p.flag);
                    return (
                      <button
                        key={p.flag}
                        onClick={() => handleToggleFlag(perm.serviceId, perm.mask, p.flag)}
                        className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
                          active
                            ? "border-indigo-200 bg-indigo-50"
                            : "border-slate-100 bg-slate-50 opacity-50 hover:opacity-75"
                        }`}
                      >
                        <span className={`text-sm font-medium ${active ? "text-indigo-700" : "text-slate-500"}`}>
                          {p.label}
                        </span>
                        <span className="mt-0.5 text-[11px] leading-tight text-slate-400">
                          {p.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-slate-400">Mask:</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {perm.mask}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Server Modal */}
      <AddServerModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        userId={userId}
        servers={unassignedServers}
      />
    </div>
  );
}

/* ─── Add Server Modal ──────────────────────────────────────── */

function AddServerModal({
  open,
  onClose,
  userId,
  servers,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  servers: { id: string; name?: string | null; productdisplay?: string; customLabel?: string | null }[];
}) {
  const upsertPermission = useUpsertPermission();
  const [selectedServer, setSelectedServer] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(0);

  function handleAdd() {
    if (!selectedServer) return;

    const mask = selectedTemplate || Permission.VIEW;
    upsertPermission.mutate(
      { userId, serviceId: selectedServer, mask },
      {
        onSuccess: () => {
          toast.success("Server access granted");
          setSelectedServer("");
          setSelectedTemplate(0);
          onClose();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Grant Server Access">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Server</Label>
          {servers.length === 0 ? (
            <p className="text-sm text-slate-500">All servers already assigned</p>
          ) : (
            <select
              value={selectedServer}
              onChange={(e) => setSelectedServer(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Select a server...</option>
              {servers.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.customLabel || s.productdisplay || s.name || `Server ${s.id}`}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-2">
          <Label>Role Template</Label>
          <div className="grid grid-cols-3 gap-2">
            {ROLE_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.label}
                type="button"
                onClick={() => setSelectedTemplate(tmpl.mask)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  selectedTemplate === tmpl.mask
                    ? tmpl.color + " ring-1 ring-offset-1"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            className="flex-1"
            disabled={!selectedServer || upsertPermission.isPending}
          >
            {upsertPermission.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Grant Access"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
