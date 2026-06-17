import { useQueryClient } from "@tanstack/react-query";
import { useMe } from "../auth/useMe";
import { api } from "../lib/api";

// Placeholder authenticated page — replaced by the real app shell in Phase 3.
export default function HomePage() {
  const { data: user } = useMe();
  const queryClient = useQueryClient();

  async function logout() {
    await api.post("/api/auth/logout");
    queryClient.clear();
    window.location.href = "/login";
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-gray-500">Logged in as</p>
        <h1 className="mt-1 text-xl font-bold text-gray-900">{user?.name}</h1>
        <p className="text-sm text-gray-500">{user?.email}</p>
        {user?.avatarUrl && (
          <img
            src={user.avatarUrl}
            alt=""
            className="mx-auto mt-4 h-14 w-14 rounded-full"
            referrerPolicy="no-referrer"
          />
        )}
        <button
          type="button"
          onClick={logout}
          className="mt-6 rounded-md bg-[#dc4c3e] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Log out
        </button>
      </div>
      <p className="text-xs text-gray-400">Phase 2 — auth works. App shell comes next.</p>
    </div>
  );
}
