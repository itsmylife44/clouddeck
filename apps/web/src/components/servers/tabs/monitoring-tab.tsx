"use client";

import { Loader2, Activity, Cpu, MemoryStick, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useServerLiveData, useServerTraffic } from "@/hooks/use-servers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatMB(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

export function MonitoringTab({ serverId }: { serverId: string }) {
  const { data: liveData, isLoading: liveLoading } = useServerLiveData(serverId);
  const { data: trafficData, isLoading: trafficLoading } = useServerTraffic(serverId);

  if (liveLoading && trafficLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  const cpuPercent = liveData ? (liveData.cpu * 100).toFixed(1) : "—";
  const memUsed = liveData ? formatBytes(liveData.mem) : "—";
  const netIn = liveData ? formatBytes(liveData.netin) : "—";
  const netOut = liveData ? formatBytes(liveData.netout) : "—";

  const chartData = trafficData?.history?.last30days?.map((day) => ({
    date: formatDate(day.date),
    inbound: Math.round(day.in),
    outbound: Math.round(day.out),
  })) ?? [];

  return (
    <div className="space-y-4">
      {/* Live Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:translate-y-0">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
              <Cpu className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">CPU Usage</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{cpuPercent}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:translate-y-0">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/30">
              <MemoryStick className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">RAM Used</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{memUsed}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:translate-y-0">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
              <ArrowDownToLine className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Network In</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{netIn}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:translate-y-0">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/30">
              <ArrowUpFromLine className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Network Out</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{netOut}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Usage Summary */}
      {trafficData && (
        <Card className="hover:translate-y-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5 text-indigo-600" />
              Traffic Usage
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={trafficData.normalpercentage > 80 ? "danger" : trafficData.normalpercentage > 50 ? "warning" : "success"}>
                {trafficData.current} GB / {trafficData.max} TB
              </Badge>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({trafficData.percentage}%)
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {/* Usage bar */}
            <div className="mb-4">
              <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${Math.max(Math.min(trafficData.normalpercentage, 100), 0.5)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 30 Day Traffic Chart */}
      {chartData.length > 0 && (
        <Card className="hover:translate-y-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Traffic History (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    className="text-slate-500 dark:text-slate-400"
                    stroke="currentColor"
                    axisLine={{ className: "stroke-slate-200 dark:stroke-slate-700" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-slate-500 dark:text-slate-400"
                    stroke="currentColor"
                    tickFormatter={(v) => formatMB(v)}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                    wrapperClassName="!bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 !shadow-lg [&_.recharts-tooltip-label]:!text-slate-900 dark:[&_.recharts-tooltip-label]:!text-slate-100"
                    formatter={(value, name) => [
                      formatMB(Number(value)),
                      name === "inbound" ? "Inbound" : "Outbound",
                    ]}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {value === "inbound" ? "Inbound" : "Outbound"}
                      </span>
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="inbound"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    fill="url(#colorIn)"
                  />
                  <Area
                    type="monotone"
                    dataKey="outbound"
                    stroke="#7C3AED"
                    strokeWidth={2}
                    fill="url(#colorOut)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Breakdown */}
      {trafficData?.history?.months && trafficData.history.months.length > 0 && (
        <Card className="hover:translate-y-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trafficData.history.months.map((m) => ({
                    month: new Date(m.date).toLocaleDateString("de-DE", { month: "short", year: "numeric" }),
                    inbound: Math.round(m.in),
                    outbound: Math.round(m.out),
                  }))}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    className="text-slate-500 dark:text-slate-400"
                    stroke="currentColor"
                    axisLine={{ className: "stroke-slate-200 dark:stroke-slate-700" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-slate-500 dark:text-slate-400"
                    stroke="currentColor"
                    tickFormatter={(v) => formatMB(v)}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                    wrapperClassName="!bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 !shadow-lg"
                    formatter={(value, name) => [
                      formatMB(Number(value)),
                      name === "inbound" ? "Inbound" : "Outbound",
                    ]}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {value === "inbound" ? "Inbound" : "Outbound"}
                      </span>
                    )}
                  />
                  <Bar dataKey="inbound" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outbound" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
