import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api, GOOGLE_LOGIN_URL } from "../lib/api";

// Todoist wordmark logo (red stacked-bars icon + "todoist").
function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#dc4c3e]">
        <span className="flex flex-col gap-[2px]">
          <span className="block h-[3px] w-3.5 rounded-full bg-white/95" />
          <span className="block h-[3px] w-3 rounded-full bg-white/80" />
          <span className="block h-[3px] w-2.5 rounded-full bg-white/65" />
        </span>
      </span>
      <span className="text-xl font-bold tracking-tight text-[#202020]">todoist</span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

/**
 * Shared two-column auth layout for both Login and Sign-up.
 * Auth methods: Continue with Google + a working email/password form.
 * (Facebook/Apple are intentionally omitted.)
 */
export default function AuthShell({
  mode, // "login" | "signup"
  heading,
  hint,
  primaryLabel,
  footerPrompt,
  footerLinkText,
  footerLinkTo,
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const path = mode === "signup" ? "/api/auth/register" : "/api/auth/login";
      await api.post(path, { email, password });
      // Refresh the cached user, then enter the app.
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate("/", { replace: true });
    } catch (err) {
      setError(messageFor(err, mode));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left column: the form */}
      <div className="flex w-full flex-col px-8 py-10 md:w-[44%] md:px-16 lg:px-24">
        <Logo />

        <div className="mt-14 flex flex-1 flex-col">
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-[#202020]">
            {heading}
          </h1>
          {hint && <p className="mt-2 text-sm text-gray-500">{hint}</p>}

          <a
            href={GOOGLE_LOGIN_URL}
            className="mt-7 flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-3 text-[15px] font-medium text-[#202020] transition hover:bg-gray-50"
          >
            <GoogleIcon />
            Continue with Google
          </a>

          <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
            <span className="h-px flex-1 bg-gray-200" />
            or
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email..."
                className="rounded-md border border-gray-300 px-3 py-2.5 text-[15px] outline-none focus:border-gray-500"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">Password</span>
              <div className="flex items-center rounded-md border border-gray-300 focus-within:border-gray-500">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password..."
                  className="flex-1 rounded-md px-3 py-2.5 text-[15px] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="px-3 text-xs text-gray-500 hover:text-gray-800"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {error && <p className="text-sm text-[#dc4c3e]">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 w-full rounded-md bg-[#dc4c3e] px-4 py-3 text-[15px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Please wait…" : primaryLabel}
            </button>
          </form>

          {mode === "login" && (
            <button
              type="button"
              className="mt-4 self-start text-sm text-[#dc4c3e] hover:underline"
              onClick={() => setError("Password reset isn't available yet.")}
            >
              Forgot your password?
            </button>
          )}

          <p className="mt-6 text-xs leading-relaxed text-gray-400">
            By continuing, you agree to Todoist&rsquo;s{" "}
            <span className="underline">Terms of Service</span> and{" "}
            <span className="underline">Privacy Policy</span>.
          </p>

          <hr className="my-6 border-gray-200" />

          <p className="text-sm text-gray-500">
            {footerPrompt}{" "}
            <Link to={footerLinkTo} className="font-medium text-[#dc4c3e] hover:underline">
              {footerLinkText}
            </Link>
          </p>
        </div>
      </div>

      {/* Right column: cream marketing panel (art placeholder for now) */}
      <div className="hidden items-center justify-center bg-[#fdf6ec] md:flex md:w-[56%]">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-40 w-40 items-center justify-center rounded-3xl bg-white/70 shadow-sm">
            <span className="text-6xl">✅</span>
          </div>
          <p className="mt-6 max-w-xs text-sm text-gray-500">
            Organize your work and life, finally.
          </p>
        </div>
      </div>
    </div>
  );
}

function messageFor(err, mode) {
  const status = err?.response?.status;
  if (status === 401) return "Invalid email or password.";
  if (status === 409) return "That email is already registered. Try logging in.";
  if (status === 400) return "Please enter a valid email and a password of at least 8 characters.";
  return "Something went wrong. Please try again.";
}
