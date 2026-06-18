import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

/** The user's labels (span all projects). */
export function useLabels() {
  return useQuery({
    queryKey: ["labels"],
    queryFn: async () => (await api.get("/api/labels")).data,
  });
}

export function useCreateLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => (await api.post("/api/labels", body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["labels"] }),
  });
}

/** Replace a task's labels. Refreshes the task lists + detail. */
export function useSetTaskLabels() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, labelIds }) =>
      (await api.put(`/api/tasks/${taskId}/labels`, { labelIds })).data,
    onSuccess: (_data, { taskId }) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task", taskId] });
      qc.invalidateQueries({ queryKey: ["subtasks"] });
    },
  });
}
