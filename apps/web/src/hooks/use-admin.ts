"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiPatch } from "@/lib/api-fetch";

export interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "USER";
  active: boolean;
  createdAt: string;
  _count: { apiKeys: number };
}

export function useUsers() {
  return useQuery<UserData[]>({
    queryKey: ["admin-users"],
    queryFn: () => apiFetch("/api/admin/users"),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
      password: string;
      role: "USER" | "ADMIN";
    }) => apiPost("/api/admin/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      id: string;
      active?: boolean;
      role?: "ADMIN" | "USER";
    }) => apiPatch("/api/admin/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}
