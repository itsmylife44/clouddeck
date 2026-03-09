"use client";

import Link from "next/link";
import { ArrowRight, Server, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatExpiry } from "@/lib/formatters";
import type { ServiceListItem } from "@clouddeck/datalix-client";

interface ServerCardProps {
  server: ServiceListItem & { customLabel?: string | null };
}

export function ServerCard({ server }: ServerCardProps) {
  return (
    <Link href={`/servers/${server.id}`} className="group">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between pb-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Server className="h-4 w-4 text-slate-400" />
              {server.customLabel || server.name || `Server`}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="default">
                {server.productdisplay || "VPS"}
              </Badge>
              {server.daysleft !== undefined && server.daysleft <= 7 && (
                <Badge variant={server.daysleft <= 0 ? "danger" : "warning"}>
                  {server.daysleft <= 0 ? "Expired" : `${server.daysleft}d left`}
                </Badge>
              )}
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500" />
        </CardHeader>
        <CardContent>
          {server.ip && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Globe className="h-4 w-4 text-slate-400" />
              <span className="font-mono">{server.ip}</span>
            </div>
          )}
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <span>Expires: {formatExpiry(server.expire_at)}</span>
            {server.price && (
              <>
                <span>·</span>
                <span>{server.price} €/mo</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
