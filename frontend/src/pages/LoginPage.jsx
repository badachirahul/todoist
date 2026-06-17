import AuthShell from "../auth/AuthShell";

export default function LoginPage() {
  return (
    <AuthShell
      mode="login"
      heading="Welcome back!"
      hint="Log in with Google or your email."
      primaryLabel="Log in"
      footerPrompt="Don't have an account?"
      footerLinkText="Sign up"
      footerLinkTo="/signup"
    />
  );
}
