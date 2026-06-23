import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, API_BASE_URL } from "../lib/api";

/** Absolute URL to open/preview a saved attachment in a new tab. */
export const fileUrl = (att) => (att ? `${API_BASE_URL}${att.url}` : null);

/** Upload a file to a comment (multipart). axios sets the boundary for FormData. */
export async function uploadCommentAttachment(commentId, file) {
  const fd = new FormData();
  fd.append("file", file);
  return (await api.post(`/api/comments/${commentId}/attachment`, fd)).data;
}

/**
 * "Task attachment": Todoist stores attachments on comments, so attaching a file
 * to a task creates a comment (no text) that carries the file.
 */
export function useAttachFileToTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, file }) => {
      const comment = (await api.post(`/api/tasks/${taskId}/comments`, { content: "" })).data;
      return uploadCommentAttachment(comment.id, file);
    },
    onSuccess: (_d, { taskId }) => {
      qc.invalidateQueries({ queryKey: ["comments", taskId] });
      qc.invalidateQueries({ queryKey: ["comments"] });
      qc.invalidateQueries({ queryKey: ["tasks"] }); // comment-count badge
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
