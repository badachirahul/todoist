import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "../lib/api";

/**
 * Live updates for one open project via Server-Sent Events.
 *
 * Opens a single EventSource to the project's /stream endpoint (authenticated by
 * the JWT cookie). When the backend pushes a "change" event after any mutation
 * in this project, we invalidate just that project's cached queries so the open
 * tab refetches the affected data — no polling, no full reload. Scoped to the
 * given project, so other views are untouched.
 */
export function useProjectStream(projectId) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!projectId) return;

    const source = new EventSource(
      `${API_BASE_URL}/api/projects/${projectId}/stream`,
      { withCredentials: true }
    );

    source.addEventListener("change", () => {
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      qc.invalidateQueries({ queryKey: ["sections", projectId] });
      qc.invalidateQueries({ queryKey: ["members", projectId] });
      qc.invalidateQueries({ queryKey: ["invitations", projectId] });
      qc.invalidateQueries({ queryKey: ["comments"] }); // live comments in open task modals
      qc.invalidateQueries({ queryKey: ["projects"] }); // sidebar counts / names
    });

    return () => source.close();
  }, [projectId, qc]);
}

/**
 * Live personal notifications via a single per-user EventSource. Mounted once in
 * the app shell. On each pushed "notification" event, refetch the notifications
 * list + unread count so the sidebar badge and Notifications page update without
 * a refresh. Reuses the same SSE mechanism as project streams.
 */
export function useNotificationStream() {
  const qc = useQueryClient();

  useEffect(() => {
    const source = new EventSource(
      `${API_BASE_URL}/api/notifications/stream`,
      { withCredentials: true }
    );
    source.addEventListener("notification", () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    });
    return () => source.close();
  }, [qc]);
}
