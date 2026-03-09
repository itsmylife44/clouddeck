"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch, apiPost } from "@/lib/api-fetch";
import type { KvmPacket } from "@clouddeck/datalix-client";

export interface LineData {
  id: string;
  label: string;
  packages: KvmPacket[];
}

const LINE_LABELS: Record<string, string> = {
  intelxeon: "Intel Xeon",
  amdepyc: "AMD EPYC",
  amdryzen: "AMD Ryzen",
  ipv6: "IPv6 Only",
  xeon: "Xeon",
  epyc: "EPYC",
  ryzen: "Ryzen",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
  kvmstarter: "KVM Starter",
  kvmpro: "KVM Pro",
  kvmenterprise: "KVM Enterprise",
};

export function usePackageLines() {
  return useQuery<LineData[]>({
    queryKey: ["order-packages"],
    queryFn: async () => {
      const raw = await apiFetch<Record<string, KvmPacket[]>>(
        "/api/orders/packages",
      );
      return Object.entries(raw).map(([id, pkgs]) => ({
        id,
        label: LINE_LABELS[id] || id,
        packages: pkgs,
      }));
    },
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: (data: {
      packetId: string;
      os: string;
      paymentMethod: string;
      ipcount: number;
      credit: boolean;
    }) => apiPost<{ link?: string }>("/api/orders/create", data),
  });
}
