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
      qc.invalidateQueries({ queryKey: ["projects"] }); // count may change (complete)
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
    // `body` carries the full task fields (content, description, priority,
    // dueDate, assigneeId) — the sub-task composer reuses the shared TaskForm.
    mutationFn: async (body) =>
      (await api.post(`/api/tasks/${parentTaskId}/subtasks`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subtasks", parentTaskId] });
      qc.invalidateQueries({ queryKey: ["tasks"] });    // show in list + update 0/N
      qc.invalidateQueries({ queryKey: ["projects"] }); // adds to the count
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", taskId] });
      qc.invalidateQueries({ queryKey: ["tasks"] }); // refresh the row comment-count badge
    },
  });
}

/** Edit a comment's text. */
export function useUpdateComment(taskId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content }) =>
      (await api.patch(`/api/comments/${id}`, { content })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", taskId] }),
  });
}

/** Delete a comment. */
export function useDeleteComment(taskId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`/api/comments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", taskId] });
      qc.invalidateQueries({ queryKey: ["tasks"] }); // comment-count badge
    },
  });
}
