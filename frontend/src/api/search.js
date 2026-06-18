import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

/** Debounce a fast-changing value (e.g. a search box). */
export function useDebounced(value, ms = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export function useSearch(query) {
  const q = query.trim();
  return useQuery({
    queryKey: ["search", q],
    queryFn: async () => (await api.get(`/api/search?q=${encodeURIComponent(q)}`)).data,
    enabled: q.length > 0,
    placeholderData: (prev) => prev,
  });
}
