"use client";

import { useState } from "react";
import { Monitor, ExternalLink, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ConsoleTab({ serverId }: { serverId: string }) {
  const [loading, setLoading] = useState(false);
  const [consoleUrl, setConsoleUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchConsoleUrl() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/servers/${serverId}/novnc`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to get console URL");
      }
      // The API may return a URL string or an object with url property
      const data = json.data;
      const url = typeof data === "string" ? data : data?.url;
      if (url) {
        setConsoleUrl(url);
      } else {
        setError("noVNC console is not available for this server.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load console");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="hover:translate-y-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-indigo-600" />
          Web Console (noVNC)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!consoleUrl && !error && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-8 text-center">
            <Monitor className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm text-slate-500">
              Access your server directly through the browser using noVNC web console.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              The console provides full keyboard and mouse access to your server.
            </p>
            <Button
              onClick={fetchConsoleUrl}
              disabled={loading}
              className="mt-6 gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Monitor className="h-4 w-4" />
              )}
              Open Console
            </Button>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
            <p className="mt-3 text-sm text-red-600">{error}</p>
            <Button
              variant="secondary"
              onClick={fetchConsoleUrl}
              disabled={loading}
              className="mt-4 gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Retry
            </Button>
          </div>
        )}

        {consoleUrl && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <iframe
                src={consoleUrl}
                className="h-[600px] w-full border-0"
                title="noVNC Console"
                allow="clipboard-read; clipboard-write"
              />
            </div>
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                onClick={fetchConsoleUrl}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Reconnect
              </Button>
              <a
                href={consoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Open in New Tab
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
