"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Key, Loader2, CheckCircle2, AlertCircle, ArrowRight, LayoutDashboard, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAddApiKey } from "@/hooks/use-settings";

type OnboardingStatus = {
  ready: boolean;
  reason?: "no_api_key" | "admin_no_api_key" | "no_permissions";
  role: "ADMIN" | "USER";
};

export default function OnboardingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/me/onboarding-status")
      .then((r) => {
        if (r.status === 401) {
          signOut({ callbackUrl: "/login" });
          return null;
        }
        return r.json();
      })
      .then((json) => {
        if (!json) return;
        const data = json.data as OnboardingStatus;
        setStatus(data);
        if (data.ready) {
          router.replace("/servers");
        }
      })
      .catch(() => {
        setError("Failed to check onboarding status. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md hover:translate-y-0">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="mt-4 text-sm text-slate-600">{error}</p>
            <Button onClick={fetchStatus} className="mt-4 gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!status || status.ready) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background blur orbs */}
      <div className="absolute top-[-200px] right-[-100px] w-[500px] h-[500px] bg-gradient-to-br from-indigo-200 to-violet-200 rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-[-150px] left-[-100px] w-[400px] h-[400px] bg-gradient-to-br from-violet-200 to-indigo-200 rounded-full blur-3xl opacity-20" />

      <div className="relative z-10 w-full max-w-lg">
        {status.role === "ADMIN" && status.reason === "no_api_key" && (
          <ApiKeySetup onComplete={() => router.replace("/servers")} />
        )}

        {status.role === "USER" && status.reason === "admin_no_api_key" && (
          <WaitingCard
            icon={<Clock className="h-8 w-8 text-amber-500" />}
            title="Waiting for Admin Setup"
            description="Your administrator hasn't configured the Datalix API key yet. Please ask them to complete the setup."
          />
        )}

        {status.role === "USER" && status.reason === "no_permissions" && (
          <WaitingCard
            icon={<AlertCircle className="h-8 w-8 text-amber-500" />}
            title="No Server Access"
            description="Your account exists but you haven't been assigned any servers yet. Ask your administrator to grant you server permissions."
          />
        )}
      </div>
    </div>
  );
}

/* ─── Admin: API Key Setup ───────────────────────────────────── */

function ApiKeySetup({ onComplete }: { onComplete: () => void }) {
  const addKey = useAddApiKey();
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("Default");
  const [success, setSuccess] = useState(false);

  // Cleanup-safe redirect after success
  useEffect(() => {
    if (!success) return;
    const id = setTimeout(onComplete, 1500);
    return () => clearTimeout(id);
  }, [success, onComplete]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;

    addKey.mutate(
      { label, apiKey },
      {
        onSuccess: () => {
          setSuccess(true);
          toast.success("API key verified and saved");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  if (success) {
    return (
      <Card className="hover:translate-y-0">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">You're all set!</h2>
          <p className="mt-2 text-sm text-slate-500">Redirecting to your dashboard...</p>
          <Loader2 className="mt-4 h-5 w-5 animate-spin text-indigo-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:translate-y-0">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-[0_4px_14px_0_rgba(79,70,229,0.3)]">
          <LayoutDashboard className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              CloudDeck
            </span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Connect your Datalix API key to get started
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <StepBadge step={1} label="Account" done />
          <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
          <StepBadge step={2} label="API Key" active />
          <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
          <StepBadge step={3} label="Dashboard" />
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {addKey.error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {addKey.error.message}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="api-key">Datalix API Key</Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your API key here"
                className="pl-10"
                required
                autoFocus
              />
            </div>
            <p className="text-xs text-slate-400">
              Find your API key in your{" "}
              <a
                href="https://datalix.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-500 underline hover:text-indigo-600"
              >
                Datalix account
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Label (optional)</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="My API Key"
            />
          </div>

          <Button type="submit" className="w-full" disabled={addKey.isPending || !apiKey.trim()}>
            {addKey.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify & Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-center text-xs text-slate-400">
            Your key is tested against the Datalix API, then encrypted with AES-256-GCM before storage.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

/* ─── Step Badge ──────────────────────────────────────────────── */

function StepBadge({
  step,
  label,
  done,
  active,
}: {
  step: number;
  label: string;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
          done
            ? "bg-emerald-100 text-emerald-700"
            : active
              ? "bg-indigo-100 text-indigo-700"
              : "bg-slate-100 text-slate-400"
        }`}
      >
        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : step}
      </div>
      <span
        className={`text-xs font-medium ${
          done ? "text-emerald-600" : active ? "text-indigo-600" : "text-slate-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

/* ─── Waiting Card (for regular users) ────────────────────────── */

function WaitingCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="hover:translate-y-0">
      <CardContent className="flex flex-col items-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
          {icon}
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p>
      </CardContent>
    </Card>
  );
}
