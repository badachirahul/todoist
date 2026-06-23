import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

const invitesKey = (projectId) => ["invitations", projectId];

/** Pending invitations for a project. */
export function useInvitations(projectId) {
  return useQuery({
    queryKey: invitesKey(projectId),
    queryFn: async () => (await api.get(`/api/projects/${projectId}/invitations`)).data,
    enabled: !!projectId,
  });
}

/** Invite a person by email (creates a pending invite + sends an email). */
export function useInviteMember(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (email) =>
      (await api.post(`/api/projects/${projectId}/invitations`, { email })).data,
    // Optimistic: show the "Pending" row instantly, before the email is sent.
    onMutate: async (email) => {
      await qc.cancelQueries({ queryKey: invitesKey(projectId) });
      const prev = qc.getQueryData(invitesKey(projectId));
      const e = email.trim().toLowerCase();
      qc.setQueryData(invitesKey(projectId), (old = []) =>
        old.some((i) => i.email === e)
          ? old
          : [...old, { id: `temp-${e}`, email: e, status: "PENDING" }]
      );
      return { prev };
    },
    onError: (_err, _email, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(invitesKey(projectId), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: invitesKey(projectId) }),
  });
}

/** Cancel a pending invitation. */
export function useCancelInvitation(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invitationId) =>
      api.delete(`/api/projects/${projectId}/invitations/${invitationId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: invitesKey(projectId) }),
  });
}

/** Accept an invitation by token → returns { projectId }. */
export async function acceptInvite(token) {
  return (await api.post(`/api/invites/${token}/accept`)).data;
}
