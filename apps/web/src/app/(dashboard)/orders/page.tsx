"use client";

import { useState, useMemo } from "react";
import {
  ShoppingCart,
  Cpu,
  MemoryStick,
  HardDrive,
  Globe,
  Zap,
  Check,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-state";
import { usePackageLines, useCreateOrder } from "@/hooks/use-orders";
import { formatMemory, formatDisk, formatUplink, num } from "@/lib/formatters";
import type { KvmPacket } from "@clouddeck/datalix-client";

export default function OrdersPage() {
  const { data: lines, isLoading } = usePackageLines();
  const createOrder = useCreateOrder();
  const [activeLine, setActiveLine] = useState<string>("");
  const [selectedPacket, setSelectedPacket] = useState<KvmPacket | null>(null);

  // Set initial active line when data loads
  const resolvedActiveLine = activeLine || lines?.[0]?.id || "";

  const activeLineData = lines?.find((l) => l.id === resolvedActiveLine);
  const activePackages = useMemo(
    () => activeLineData?.packages.filter((p) => p.active === 1) ?? [],
    [activeLineData],
  );
  const inactivePackages = useMemo(
    () => activeLineData?.packages.filter((p) => p.active !== 1) ?? [],
    [activeLineData],
  );

  function handleOrder() {
    if (!selectedPacket) return;

    createOrder.mutate(
      {
        packetId: selectedPacket.id,
        os: "1",
        paymentMethod: "credit",
        ipcount: 1,
        credit: true,
      },
      {
        onSuccess: (data) => {
          toast.success("Order created successfully!");
          if (data?.link) {
            window.open(data.link, "_blank");
          }
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Order failed");
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Order{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            New Server
          </span>
        </h1>
        <p className="mt-1 text-slate-500">
          Browse available KVM packages and order a new server
        </p>
      </div>

      {isLoading && <LoadingSpinner className="py-12" />}

      {/* Line Tabs */}
      {!isLoading && lines && lines.length > 0 && (
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 overflow-x-auto">
          {lines.map((line) => {
            const activeCount = line.packages.filter((p) => p.active === 1).length;
            return (
              <button
                key={line.id}
                onClick={() => {
                  setActiveLine(line.id);
                  setSelectedPacket(null);
                }}
                className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  resolvedActiveLine === line.id
                    ? "bg-white text-indigo-700 shadow-[0_1px_3px_rgba(79,70,229,0.1)]"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {line.label}
                {activeCount > 0 && (
                  <span className="ml-1.5 text-xs text-slate-400">({activeCount})</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* No active packages */}
      {!isLoading && resolvedActiveLine && activePackages.length === 0 && (
        <Card className="hover:translate-y-0">
          <CardContent className="py-12 text-center">
            <ShoppingCart className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">
              No active packages in this line.
              {inactivePackages.length > 0 && ` (${inactivePackages.length} currently unavailable)`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Package Grid */}
      {!isLoading && activePackages.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {activePackages.map((pkg, idx) => {
            const isSelected = selectedPacket?.id === pkg.id;
            const price = num(pkg.price);
            const discount = num(pkg.discount);
            const discountedPrice = num(pkg.discountedprice);
            const setupFee = num(pkg.firstpayment);
            const traffic = num(pkg.traffic);
            const isPopular = activePackages.length >= 3 && idx === Math.floor(activePackages.length / 2);

            return (
              <Card
                key={pkg.id}
                className={`relative cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "ring-2 ring-indigo-500 border-indigo-300"
                    : "hover:-translate-y-1"
                } ${isPopular ? "lg:scale-[1.03]" : ""}`}
                onClick={() => setSelectedPacket(pkg)}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 shadow-md">
                      Popular
                    </Badge>
                  </div>
                )}
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{pkg.displayname}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    {discount > 0 && discountedPrice > 0 ? (
                      <>
                        <span className="text-2xl font-extrabold text-slate-900">
                          {discountedPrice.toFixed(2)}€
                        </span>
                        <span className="text-sm text-slate-400 line-through">
                          {price.toFixed(2)}€
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-extrabold text-slate-900">
                        {price.toFixed(2)}€
                      </span>
                    )}
                    <span className="text-sm text-slate-500">/mo</span>
                  </div>
                  {setupFee > 0 && (
                    <p className="text-xs text-slate-400">
                      + {setupFee.toFixed(2)}€ setup
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Cpu className="h-4 w-4 text-indigo-500" />
                    <span className="font-medium">{pkg.cores} vCPU</span>
                    {pkg.ghzbase && (
                      <span className="text-xs text-slate-400">
                        {pkg.ghzbase}/{pkg.ghzturbo} GHz
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MemoryStick className="h-4 w-4 text-violet-500" />
                    <span>{formatMemory(pkg.memory)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <HardDrive className="h-4 w-4 text-emerald-500" />
                    <span>{formatDisk(pkg.disk)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span>{formatUplink(pkg.uplink)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Globe className="h-4 w-4 text-blue-500" />
                    <span>{traffic} TB Traffic · {pkg.ipv4} IPv4{pkg.ipv6 ? " · IPv6" : ""}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Summary Bar */}
      {selectedPacket && (
        <Card className="hover:translate-y-0 border-indigo-100 bg-indigo-50/30">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">
                {selectedPacket.displayname}
              </p>
              <p className="text-sm text-slate-500">
                {selectedPacket.cores} vCPU · {formatMemory(selectedPacket.memory)} RAM · {formatDisk(selectedPacket.disk)} SSD
              </p>
              <p className="mt-1 text-lg font-bold text-indigo-600">
                {num(selectedPacket.discount) > 0 && num(selectedPacket.discountedprice) > 0
                  ? num(selectedPacket.discountedprice).toFixed(2)
                  : num(selectedPacket.price).toFixed(2)}€/month
              </p>
            </div>
            <Button
              onClick={handleOrder}
              disabled={createOrder.isPending}
              className="gap-2"
            >
              {createOrder.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Order with Credit
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
