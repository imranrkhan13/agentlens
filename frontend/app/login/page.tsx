import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return <AuthShell eyebrow="Welcome back" title="Log in to AgentLens" description="Your account manages projects and activity. Private project keys stay with your app."><LoginForm /></AuthShell>;
}
