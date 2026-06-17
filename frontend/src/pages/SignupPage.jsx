import AuthShell from "../auth/AuthShell";

export default function SignupPage() {
  return (
    <AuthShell
      mode="signup"
      heading="Sign up"
      primaryLabel="Sign up with Email"
      footerPrompt="Already signed up?"
      footerLinkText="Go to login"
      footerLinkTo="/login"
    />
  );
}
