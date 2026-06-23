import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

/** All notifications for the logged-in user, newest first. */
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications", "list"],
    queryFn: async () => (await api.get("/api/notifications")).data,
  });
}

/** Count of unread notifications — drives the sidebar bell badge. */
export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => (await api.get("/api/notifications/unread-count")).data.count,
  });
}

/** Mark every notification read (clears the badge everywhere). */
export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => api.post("/api/notifications/read-all"),
    // Invalidating the ["notifications"] prefix refreshes both the list and the
    // unread count, so the badge disappears without a page refresh.
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

/** Accept a project invitation from its notification row (the Accept button). */
export function useAcceptInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.post(`/api/notifications/${id}/accept`)).data,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["notifications"] }); // row becomes "added you to…"
      qc.invalidateQueries({ queryKey: ["projects"] });       // project appears in the sidebar
      if (data?.projectId) qc.invalidateQueries({ queryKey: ["members", data.projectId] });
    },
  });
}

/** Toggle one notification's read state. Optimistic so the row + count flip instantly. */
export function useSetNotificationRead() {
  const qc = useQueryClient();
  const listKey = ["notifications", "list"];
  const countKey = ["notifications", "unread-count"];
  return useMutation({
    mutationFn: async ({ id, read }) => api.patch(`/api/notifications/${id}`, { read }),
    onMutate: async ({ id, read }) => {
      await qc.cancelQueries({ queryKey: ["notifications"] });
      const prevList = qc.getQueryData(listKey);
      const prevCount = qc.getQueryData(countKey);
      const target = prevList?.find((n) => n.id === id);
      if (prevList) {
        qc.setQueryData(listKey, prevList.map((n) => (n.id === id ? { ...n, read } : n)));
      }
      if (typeof prevCount === "number" && target && target.read !== read) {
        qc.setQueryData(countKey, Math.max(0, prevCount + (read ? -1 : 1)));
      }
      return { prevList, prevCount };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prevList) qc.setQueryData(listKey, ctx.prevList);
      if (ctx?.prevCount !== undefined) qc.setQueryData(countKey, ctx.prevCount);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
