import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

/** All projects the user is a member of (Inbox first). */
export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await api.get("/api/projects")).data,
  });
}

/** Convenience: the user's Inbox project (or undefined while loading). */
export function useInbox() {
  const query = useProjects();
  const inbox = query.data?.find((p) => p.inbox);
  return { ...query, inbox };
}
