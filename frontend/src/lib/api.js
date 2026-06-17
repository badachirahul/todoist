import axios from "axios";

// Talks to the Spring backend. `withCredentials` makes the browser send/receive
// the auth cookie cross-origin (:5173 -> :8080) once Phase 2 auth lands.
export const api = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true,
});
