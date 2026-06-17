import { Navigate } from "react-router-dom";
import { useMe } from "./useMe";

/**
 * Route guard: shows nothing while checking, redirects to /login if the user
 * isn't authenticated, otherwise renders the protected content.
 */
export default function RequireAuth({ children }) {
  const { data: user, isLoading, isError } = useMe();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        Loading…
      </div>
    );
  }

  if (isError || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
