import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

const sectionsKey = (projectId) => ["sections", projectId];

export function useSections(projectId) {
  return useQuery({
    queryKey: sectionsKey(projectId),
    queryFn: async () => (await api.get(`/api/projects/${projectId}/sections`)).data,
    enabled: !!projectId,
  });
}

export function useCreateSection(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name) =>
      (await api.post(`/api/projects/${projectId}/sections`, { name })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: sectionsKey(projectId) }),
  });
}

export function useRenameSection(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }) => (await api.patch(`/api/sections/${id}`, { name })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: sectionsKey(projectId) }),
  });
}

export function useDeleteSection(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`/api/sections/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sectionsKey(projectId) });
      qc.invalidateQueries({ queryKey: ["tasks", projectId] }); // tasks become section-less
    },
  });
}
