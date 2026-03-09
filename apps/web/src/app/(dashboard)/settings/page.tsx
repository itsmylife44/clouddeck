"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Key, Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-state";
import { useApiKeys, useAddApiKey, useDeleteApiKey, useChangePassword } from "@/hooks/use-settings";

export default function SettingsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const { data: apiKeys, isLoading } = useApiKeys();
  const addKey = useAddApiKey();
  const deleteKey = useDeleteApiKey();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("Default");
  const [newApiKey, setNewApiKey] = useState("");

  function handleAdd() {
    if (!newApiKey.trim()) return;

    addKey.mutate(
      { label: newLabel, apiKey: newApiKey },
      {
        onSuccess: () => {
          toast.success("API key added and verified");
          setShowAddForm(false);
          setNewLabel("Default");
          setNewApiKey("");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function handleDelete(id: string) {
    deleteKey.mutate(id, {
      onSuccess: () => toast.success("API key deleted"),
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Settings
          </span>
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          {isAdmin ? "Manage your API keys and account preferences" : "Manage your account preferences"}
        </p>
      </div>

      {/* Change Password */}
      <ChangePasswordCard />

      {/* API Keys — Admin only */}
      {isAdmin && <Card className="hover:translate-y-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-indigo-600" />
              Datalix API Keys
            </CardTitle>
            <CardDescription className="mt-1">
              Your API keys are encrypted and stored securely. They are never
              sent to your browser.
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Key
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddForm && (
            <div className="rounded-lg border border-indigo-100 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20 p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Label</Label>
                  <Input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="My API Key"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Datalix API Key</Label>
                  <Input
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    placeholder="Paste your API key here"
                    type="password"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                The key will be tested against the Datalix API before saving.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAdd} disabled={addKey.isPending}>
                  {addKey.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Verify & Save"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <LoadingSpinner className="py-4" />
          ) : !apiKeys || apiKeys.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <p className="mt-2 font-medium text-slate-900 dark:text-slate-100">No API key configured</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Add your Datalix API key to start managing your servers
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-700 p-4"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{key.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Added {new Date(key.createdAt).toLocaleDateString()}
                        {key.lastUsedAt &&
                          ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(key.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>}
    </div>
  );
}

/* ─── Change Password Card ──────────────────────────────────── */

function ChangePasswordCard() {
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 12) {
      toast.error("Password must be at least 12 characters");
      return;
    }

    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success("Password updated successfully");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <Card className="hover:translate-y-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-indigo-600" />
          Change Password
        </CardTitle>
        <CardDescription>
          Update your account password. Minimum 12 characters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={12}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={12}
              />
            </div>
          </div>
          <Button type="submit" disabled={changePassword.isPending || !currentPassword || !newPassword || !confirmPassword}>
            {changePassword.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
