import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

const tasksKey = (projectId) => ["tasks", projectId];

/** Tasks in a project (top-level, not completed). */
export function useTasks(projectId) {
  return useQuery({
    queryKey: tasksKey(projectId),
    queryFn: async () => (await api.get(`/api/projects/${projectId}/tasks`)).data,
    enabled: !!projectId,
  });
}

export function useCreateTask(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) =>
      (await api.post(`/api/projects/${projectId}/tasks`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: tasksKey(projectId) }),
  });
}

/**
 * Update a task. Optimistic: completing a task removes it from the list
 * immediately; other field changes are merged in place. Rolls back on error.
 */
export function useUpdateTask(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }) =>
      (await api.patch(`/api/tasks/${id}`, patch)).data,
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: tasksKey(projectId) });
      const previous = qc.getQueryData(tasksKey(projectId));
      qc.setQueryData(tasksKey(projectId), (old = []) => {
        if (patch.completed === true) return old.filter((t) => t.id !== id);
        return old.map((t) =>
          t.id === id ? { ...t, ...patch, ...(patch.clearDueDate ? { dueDate: null } : {}) } : t
        );
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(tasksKey(projectId), ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: tasksKey(projectId) }),
  });
}

/**
 * Move/re-parent a task (drag-and-drop). Optimistically re-parents and reindexes
 * the destination sibling group in the cache (mirrors the backend) so the list
 * doesn't flash, then reconciles with the server on settle.
 */
export function useMoveTask(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, parentId, sectionId, position }) =>
      (await api.patch(`/api/tasks/${id}/move`, { parentId, sectionId, position })).data,
    onMutate: async ({ id, parentId, sectionId, position }) => {
      await qc.cancelQueries({ queryKey: tasksKey(projectId) });
      const previous = qc.getQueryData(tasksKey(projectId));
      qc.setQueryData(tasksKey(projectId), (old = []) => {
        if (!old.some((t) => t.id === id)) return old;
        const next = old.map((t) =>
          t.id === id ? { ...t, parentTaskId: parentId ?? null, sectionId: sectionId ?? null } : t
        );
        const moved = next.find((t) => t.id === id);
        const sibs = next
          .filter((t) => t.id !== id
            && (t.parentTaskId ?? null) === (parentId ?? null)
            && (t.sectionId ?? null) === (sectionId ?? null))
          .sort((a, b) => a.position - b.position);
        const idx = Math.max(0, Math.min(position, sibs.length));
        sibs.splice(idx, 0, moved);
        const pos = new Map(sibs.map((t, i) => [t.id, i]));
        return next.map((t) => (pos.has(t.id) ? { ...t, position: pos.get(t.id) } : t));
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(tasksKey(projectId), ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: tasksKey(projectId) }),
  });
}

/** Delete a task. Optimistic removal with rollback. */
export function useDeleteTask(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`/api/tasks/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: tasksKey(projectId) });
      const previous = qc.getQueryData(tasksKey(projectId));
      qc.setQueryData(tasksKey(projectId), (old = []) => old.filter((t) => t.id !== id));
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(tasksKey(projectId), ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: tasksKey(projectId) }),
  });
}
