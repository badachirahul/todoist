import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

/**
 * Fetches the currently-authenticated user from /api/me.
 * A 401 (not logged in) is an expected state, not a retryable error.
 */
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/api/me")).data,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
