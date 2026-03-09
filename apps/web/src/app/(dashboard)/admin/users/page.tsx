"use client";

import { useState, useMemo } from "react";
import {
  Users,
  Plus,
  Shield,
  UserIcon,
  ToggleLeft,
  ToggleRight,
  Key,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { LoadingSpinner, ErrorState } from "@/components/ui/loading-state";
import { useUsers, useCreateUser, useUpdateUser } from "@/hooks/use-admin";

export default function AdminUsersPage() {
  const { data: users, isLoading, error, refetch } = useUsers();
  const updateUser = useUpdateUser();
  const [showCreate, setShowCreate] = useState(false);

  const adminCount = useMemo(
    () => users?.filter((u) => u.role === "ADMIN").length ?? 0,
    [users],
  );
  const activeCount = useMemo(
    () => users?.filter((u) => u.active).length ?? 0,
    [users],
  );

  function handleToggleActive(id: string, active: boolean) {
    updateUser.mutate(
      { id, active: !active },
      {
        onSuccess: () =>
          toast.success(`User ${!active ? "activated" : "deactivated"}`),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function handleToggleRole(id: string, currentRole: "ADMIN" | "USER") {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    updateUser.mutate(
      { id, role: newRole },
      {
        onSuccess: () => toast.success(`Role changed to ${newRole}`),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            User Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage accounts and permissions
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{users?.length ?? 0}</p>
              <p className="text-sm text-slate-500">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50">
              <Shield className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{adminCount}</p>
              <p className="text-sm text-slate-500">Admins</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
              <UserIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
              <p className="text-sm text-slate-500">Active</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />

      {/* User Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <LoadingSpinner className="py-12" />}

          {error && (
            <ErrorState
              title="Failed to load users"
              message={error.message}
              onRetry={() => refetch()}
            />
          )}

          {users && users.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">No users found</p>
          )}

          {users && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-left font-semibold text-slate-500">User</th>
                    <th className="pb-3 text-left font-semibold text-slate-500">Role</th>
                    <th className="pb-3 text-left font-semibold text-slate-500">Status</th>
                    <th className="pb-3 text-left font-semibold text-slate-500">API Keys</th>
                    <th className="pb-3 text-left font-semibold text-slate-500">Created</th>
                    <th className="pb-3 text-right font-semibold text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((user) => (
                    <tr key={user.id} className="group">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100">
                            <UserIcon className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {user.name || "—"}
                            </p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={user.role === "ADMIN" ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleToggleRole(user.id, user.role)}
                        >
                          {user.role === "ADMIN" ? (
                            <Shield className="mr-1 h-3 w-3" />
                          ) : (
                            <UserIcon className="mr-1 h-3 w-3" />
                          )}
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleToggleActive(user.id, user.active)}
                          className="flex items-center gap-1.5 text-sm transition-colors hover:text-indigo-600"
                        >
                          {user.active ? (
                            <>
                              <ToggleRight className="h-5 w-5 text-emerald-500" />
                              <span className="text-emerald-600">Active</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-5 w-5 text-slate-400" />
                              <span className="text-slate-400">Inactive</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Key className="h-3.5 w-3.5 text-slate-400" />
                          {user._count.apiKeys}
                        </div>
                      </td>
                      <td className="py-3 text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-xs text-slate-400">
                          Click role/status to edit
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Create User Modal ──────────────────────────────────────── */

function CreateUserModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createUser = useCreateUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");

  function resetForm() {
    setName("");
    setEmail("");
    setPassword("");
    setRole("USER");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    createUser.mutate(
      { name, email, password, role },
      {
        onSuccess: () => {
          toast.success("User created successfully");
          resetForm();
          onClose();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Create New User">
      <form onSubmit={handleSubmit} className="space-y-4">
        {createUser.error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {createUser.error.message}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="create-name">Name</Label>
          <Input
            id="create-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="create-email">Email</Label>
          <Input
            id="create-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="create-password">Password</Label>
          <Input
            id="create-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={8}
          />
        </div>

        <div className="space-y-2">
          <Label>Role</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRole("USER")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                role === "USER"
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <UserIcon className="h-4 w-4" />
              User
            </button>
            <button
              type="button"
              onClick={() => setRole("ADMIN")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                role === "ADMIN"
                  ? "border-violet-300 bg-violet-50 text-violet-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Shield className="h-4 w-4" />
              Admin
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={createUser.isPending}>
            {createUser.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create User"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
