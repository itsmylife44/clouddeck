"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiDelete } from "@/lib/api-fetch";

export interface StoredApiKey {
  id: string;
  label: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export function useApiKeys() {
  return useQuery<StoredApiKey[]>({
    queryKey: ["api-keys"],
    queryFn: () => apiFetch("/api/settings/api-keys"),
  });
}

export function useAddApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { label: string; apiKey: string }) =>
      apiPost("/api/settings/api-keys", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete("/api/settings/api-keys", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });
}
