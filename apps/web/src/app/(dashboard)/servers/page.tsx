"use client";

import { useServers } from "@/hooks/use-servers";
import { ServerCard } from "@/components/servers/server-card";
import { Server } from "lucide-react";
import { LoadingSpinner, ErrorState, EmptyState } from "@/components/ui/loading-state";

export default function ServersPage() {
  const { data: servers, isLoading, error, refetch } = useServers();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Your{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Servers
          </span>
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Manage and monitor your Datalix VPS instances
        </p>
      </div>

      {isLoading && <LoadingSpinner />}

      {error && (
        <ErrorState
          title="Failed to load servers"
          message={error.message}
          onRetry={() => refetch()}
        />
      )}

      {servers && servers.length === 0 && (
        <EmptyState
          icon={Server}
          title="No servers yet"
          description="Add your Datalix API key in Settings to see your servers"
        />
      )}

      {servers && servers.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servers.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      )}
    </div>
  );
}
