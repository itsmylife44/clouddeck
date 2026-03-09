"use client";

import { useState } from "react";
import { Copy, Check, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerIps } from "@/hooks/use-servers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function NetworkTab({ serverId }: { serverId: string }) {
  const { data: ipData, isLoading } = useServerIps(serverId);
  const [editingIp, setEditingIp] = useState<string | null>(null);
  const [rdnsValue, setRdnsValue] = useState("");
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const ipv4List = ipData && "ipv4" in ipData ? ipData.ipv4 : [];
  const ipv6List = ipData && "ipv6" in ipData ? ipData.ipv6 : [];
  const hasIps = ipv4List.length > 0 || ipv6List.length > 0;

  function copyIp(ip: string) {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    toast.success("IP copied to clipboard");
    setTimeout(() => setCopiedIp(null), 2000);
  }

  async function saveRdns(ip: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/servers/${serverId}/network`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip, rdns: rdnsValue }),
      });
      if (!res.ok) throw new Error("Failed to update rDNS");
      toast.success("rDNS updated");
      setEditingIp(null);
    } catch {
      toast.error("Failed to update rDNS");
    } finally {
      setSaving(false);
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-indigo-600" />
          IP Addresses
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasIps ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No IP addresses found</p>
        ) : (
          <div className="space-y-4">
            {/* IPv4 */}
            {ipv4List.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">IPv4</h4>
                {ipv4List.map((entry) => (
                  <div
                    key={entry.ip}
                    className="flex flex-col gap-2 rounded-lg border border-slate-100 dark:border-slate-700 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="default">IPv4</Badge>
                      <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
                        {entry.ip}
                      </span>
                      <button
                        onClick={() => copyIp(entry.ip)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {copiedIp === entry.ip ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>GW: {entry.gw}</span>
                      <span>·</span>
                      <span>Mask: {entry.netmask}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {editingIp === entry.ip ? (
                        <>
                          <Input
                            value={rdnsValue}
                            onChange={(e) => setRdnsValue(e.target.value)}
                            placeholder="hostname.example.com"
                            className="h-8 w-60 text-xs"
                          />
                          <Button
                            size="sm"
                            onClick={() => saveRdns(entry.ip)}
                            disabled={saving}
                          >
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingIp(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            rDNS: {entry.rdns || "—"}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingIp(entry.ip);
                              setRdnsValue(entry.rdns || "");
                            }}
                          >
                            Edit
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* IPv6 */}
            {ipv6List.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">IPv6</h4>
                {ipv6List.map((entry) => (
                  <div
                    key={entry.subnet}
                    className="flex flex-col gap-2 rounded-lg border border-slate-100 dark:border-slate-700 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">IPv6</Badge>
                      <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
                        {entry.firstip}
                      </span>
                      <button
                        onClick={() => copyIp(entry.firstip)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {copiedIp === entry.firstip ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>Subnet: {entry.subnet}</span>
                      <span>·</span>
                      <span>GW: {entry.gw}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
