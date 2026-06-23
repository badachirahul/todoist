import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, API_BASE_URL } from "../lib/api";

/** Absolute URL to open/preview a saved attachment in a new tab. */
export const fileUrl = (att) => (att ? `${API_BASE_URL}${att.url}` : null);

/** Upload helpers (multipart). axios sets the boundary automatically for FormData. */
export async function uploadTaskAttachment(taskId, file) {
  const fd = new FormData();
  fd.append("file", file);
  return (await api.post(`/api/tasks/${taskId}/attachment`, fd)).data;
}

export async function uploadCommentAttachment(commentId, file) {
  const fd = new FormData();
  fd.append("file", file);
  return (await api.post(`/api/comments/${commentId}/attachment`, fd)).data;
}

/** Attach a file to a task (one per task); refreshes the task + list. */
export function useUploadTaskAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, file }) => uploadTaskAttachment(taskId, file),
    onSuccess: (_d, { taskId }) => {
      qc.invalidateQueries({ queryKey: ["task", taskId] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

/** Attach a file to a comment; refreshes the comment list. */
export function useUploadCommentAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, file }) => uploadCommentAttachment(commentId, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments"] }),
  });
}

/** Remove an attachment (task or comment). */
export function useDeleteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/api/attachments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["comments"] });
    },
  });
}
