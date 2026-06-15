import type { ReactNode } from "react";
import { PasskeyLoginForm } from "@/components/passkey-login-form";

// Always reachable pre-auth.
export default function LoginPage(): ReactNode {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <PasskeyLoginForm />
    </main>
  );
}
