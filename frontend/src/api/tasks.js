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
        return old.map((t) => (t.id === id ? { ...t, ...patch } : t));
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
