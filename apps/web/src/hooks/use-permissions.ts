"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiDelete } from "@/lib/api-fetch";

export interface ServerPermissionData {
  id: string;
  serviceId: string;
  mask: number;
  createdAt: string;
  updatedAt: string;
}

// Admin: get all permissions for a user
export function useUserPermissions(userId: string | null) {
  return useQuery<ServerPermissionData[]>({
    queryKey: ["admin-permissions", userId],
    queryFn: () => apiFetch(`/api/admin/permissions?userId=${encodeURIComponent(userId!)}`),
    enabled: !!userId,
  });
}

// Admin: upsert a permission
export function useUpsertPermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { userId: string; serviceId: string; mask: number }) =>
      apiPost("/api/admin/permissions", data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-permissions", variables.userId] });
    },
  });
}

// Admin: delete a permission
export function useDeletePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { userId: string; serviceId: string }) =>
      apiDelete("/api/admin/permissions", data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-permissions", variables.userId] });
    },
  });
}

// Current user: get my permission mask for a server
export function useMyPermissions(serviceId: string) {
  return useQuery<{ mask: number; role: string }>({
    queryKey: ["my-permissions", serviceId],
    queryFn: () => apiFetch(`/api/me/permissions?serviceId=${encodeURIComponent(serviceId)}`),
    staleTime: 60_000,
  });
}

// Current user: get all my permissions
export function useAllMyPermissions() {
  return useQuery<{ permissions: { serviceId: string; mask: number }[]; role: string }>({
    queryKey: ["my-permissions-all"],
    queryFn: () => apiFetch("/api/me/permissions"),
    staleTime: 60_000,
  });
}
