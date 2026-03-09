"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost } from "@/lib/api-fetch";
import type { ServiceListItem, Service, ServiceStatus, ServiceIpResponse, Backup, CronJob, ServiceOs, PowerAction, LiveData, TrafficData } from "@clouddeck/datalix-client";

export function useServers() {
  return useQuery<ServiceListItem[]>({
    queryKey: ["servers"],
    queryFn: () => apiFetch("/api/servers"),
    refetchInterval: 30_000,
  });
}

export function useServer(id: string) {
  return useQuery<Service>({
    queryKey: ["server", id],
    queryFn: () => apiFetch(`/api/servers/${id}`),
  });
}

export function useServerStatus(id: string) {
  return useQuery<ServiceStatus>({
    queryKey: ["server-status", id],
    queryFn: () => apiFetch(`/api/servers/${id}/status`),
    refetchInterval: 15_000,
  });
}

export function useServerIps(id: string) {
  return useQuery<ServiceIpResponse>({
    queryKey: ["server-ips", id],
    queryFn: () => apiFetch(`/api/servers/${id}/network`),
  });
}

export function useServerBackups(id: string) {
  return useQuery<Backup[]>({
    queryKey: ["server-backups", id],
    queryFn: () => apiFetch(`/api/servers/${id}/backups`),
  });
}

export function useServerCrons(id: string) {
  return useQuery<CronJob[]>({
    queryKey: ["server-crons", id],
    queryFn: () => apiFetch(`/api/servers/${id}/cron`),
  });
}

export function useServerLiveData(id: string) {
  return useQuery<LiveData>({
    queryKey: ["server-livedata", id],
    queryFn: () => apiFetch(`/api/servers/${id}/livedata`),
    refetchInterval: 5_000,
  });
}

export function useServerTraffic(id: string) {
  return useQuery<TrafficData>({
    queryKey: ["server-traffic", id],
    queryFn: () => apiFetch(`/api/servers/${id}/traffic`),
    refetchInterval: 60_000,
  });
}

export function useServerOs(id: string) {
  return useQuery<ServiceOs[]>({
    queryKey: ["server-os", id],
    queryFn: () => apiFetch(`/api/servers/${id}/reinstall`),
    enabled: false,
  });
}

export function usePowerAction(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: PowerAction) =>
      apiPost(`/api/servers/${id}/power`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["server-status", id] });
      queryClient.invalidateQueries({ queryKey: ["servers"] });
    },
  });
}

export function useBackupAction(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { action: string; backup?: string }) =>
      apiPost(`/api/servers/${id}/backups`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["server-backups", id] });
    },
  });
}

export function useExtendService(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { days: number; credit?: boolean }) =>
      apiPost(`/api/servers/${id}/extend`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["server", id] });
      queryClient.invalidateQueries({ queryKey: ["servers"] });
    },
  });
}

export function useHideService(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost(`/api/servers/${id}/hide`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servers"] });
    },
  });
}

export function useNoVnc(id: string) {
  return useQuery<{ url: string }>({
    queryKey: ["server-novnc", id],
    queryFn: () => apiFetch(`/api/servers/${id}/novnc`),
    enabled: false, // only fetch on demand
  });
}
