import axios from "axios";

// Base URL of the Spring backend.
export const API_BASE_URL = "http://localhost:8080";

// Full-page navigate here to start the Google OAuth flow (NOT an XHR call).
export const GOOGLE_LOGIN_URL = `${API_BASE_URL}/oauth2/authorization/google`;

// Talks to the backend. `withCredentials` makes the browser send/receive the
// auth cookie (same-site localhost, so the SameSite=Lax cookie is included).
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});
