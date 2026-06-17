import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

/** A single task (fresh), used by the detail modal. */
export function useTask(taskId) {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => (await api.get(`/api/tasks/${taskId}`)).data,
    enabled: !!taskId,
  });
}

/** Update a task by id and refresh detail + list + subtask views. */
export function useUpdateTaskById() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }) => (await api.patch(`/api/tasks/${id}`, patch)).data,
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["task", id] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["subtasks"] });
    },
  });
}

export function useSubtasks(parentTaskId) {
  return useQuery({
    queryKey: ["subtasks", parentTaskId],
    queryFn: async () => (await api.get(`/api/tasks/${parentTaskId}/subtasks`)).data,
    enabled: !!parentTaskId,
  });
}

export function useCreateSubtask(parentTaskId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content) =>
      (await api.post(`/api/tasks/${parentTaskId}/subtasks`, { content })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subtasks", parentTaskId] }),
  });
}

export function useComments(taskId) {
  return useQuery({
    queryKey: ["comments", taskId],
    queryFn: async () => (await api.get(`/api/tasks/${taskId}/comments`)).data,
    enabled: !!taskId,
  });
}

export function useCreateComment(taskId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content) =>
      (await api.post(`/api/tasks/${taskId}/comments`, { content })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", taskId] }),
  });
}
