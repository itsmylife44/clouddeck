"use client";

import { useState } from "react";
import { CalendarPlus, Loader2, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useExtendService } from "@/hooks/use-servers";

const EXTEND_OPTIONS = [
  { days: 30, label: "30 Days", description: "1 Month" },
  { days: 60, label: "60 Days", description: "2 Months" },
  { days: 90, label: "90 Days", description: "3 Months" },
  { days: 180, label: "180 Days", description: "6 Months" },
  { days: 365, label: "365 Days", description: "1 Year" },
];

export function ExtendTab({ serverId }: { serverId: string }) {
  const [selectedDays, setSelectedDays] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const extendMutation = useExtendService(serverId);

  function handleExtend() {
    if (!selectedDays) return;

    if (!confirming) {
      setConfirming(true);
      return;
    }

    extendMutation.mutate(
      { days: selectedDays, credit: true },
      {
        onSuccess: () => {
          toast.success(`Server extended by ${selectedDays} days`);
          setSelectedDays(null);
          setConfirming(false);
        },
        onError: (err) => {
          toast.error(err.message);
          setConfirming(false);
        },
      }
    );
  }

  return (
    <Card className="hover:translate-y-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarPlus className="h-5 w-5 text-indigo-600" />
          Extend Service
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-slate-500">
          Extend your server runtime. The cost will be charged to your credit balance.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXTEND_OPTIONS.map((option) => (
            <button
              key={option.days}
              onClick={() => {
                setSelectedDays(option.days);
                setConfirming(false);
              }}
              className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                selectedDays === option.days
                  ? "border-indigo-300 bg-indigo-50/50 ring-2 ring-indigo-500"
                  : "border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_4px_20px_-2px_rgba(79,70,229,0.1)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-slate-900">{option.label}</span>
                {selectedDays === option.days && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">{option.description}</p>
            </button>
          ))}
        </div>

        {confirming && selectedDays && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <span className="text-sm text-amber-800">
              Extend this server by <strong>{selectedDays} days</strong>? This will be charged to your credit balance.
            </span>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleExtend}
            disabled={!selectedDays || extendMutation.isPending}
            className="gap-2"
          >
            {extendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CalendarPlus className="h-4 w-4" />
            )}
            {confirming ? "Confirm Extension" : "Extend Service"}
          </Button>
          {confirming && (
            <Button
              variant="ghost"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
