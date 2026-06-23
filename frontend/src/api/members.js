import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

const membersKey = (projectId) => ["members", projectId];

/** Members of a project (owner first). */
export function useMembers(projectId) {
  return useQuery({
    queryKey: membersKey(projectId),
    queryFn: async () => (await api.get(`/api/projects/${projectId}/members`)).data,
    enabled: !!projectId,
  });
}

/** Invite a user to the project by email. */
export function useAddMember(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (email) =>
      (await api.post(`/api/projects/${projectId}/members`, { email })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: membersKey(projectId) }),
  });
}

/** Remove a member (owner only). */
export function useRemoveMember(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberUserId) =>
      api.delete(`/api/projects/${projectId}/members/${memberUserId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: membersKey(projectId) });
      qc.invalidateQueries({ queryKey: ["projects"] }); // a "Leave" drops it from your sidebar
    },
  });
}
