import { Navigate, useLocation } from "react-router-dom";
import { useMe } from "./useMe";

/**
 * Route guard: shows nothing while checking, redirects to /login if the user
 * isn't authenticated (carrying the attempted path so we can return there after
 * login — e.g. an invite accept link), otherwise renders the protected content.
 */
export default function RequireAuth({ children }) {
  const { data: user, isLoading, isError } = useMe();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        Loading…
      </div>
    );
  }

  if (isError || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return children;
}
