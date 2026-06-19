import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

/**
 * Projects the user is a member of (Inbox first). Pass `archived: true` to load
 * the archived-only list (used by the My Projects page toggle); the default
 * active list keys as ["projects"] so the sidebar usage stays untouched.
 */
export function useProjects(archived = false) {
  return useQuery({
    queryKey: archived ? ["projects", "archived"] : ["projects"],
    queryFn: async () =>
      (await api.get("/api/projects", { params: archived ? { archived: true } : {} })).data,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => (await api.post("/api/projects", body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }) => (await api.patch(`/api/projects/${id}`, patch)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`/api/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

/** Convenience: the user's Inbox project (or undefined while loading). */
export function useInbox() {
  const query = useProjects();
  const inbox = query.data?.find((p) => p.inbox);
  return { ...query, inbox };
}
