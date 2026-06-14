"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Input,
} from "@upshot/ui";
import { authClient } from "@/lib/auth-client";
import { issueBackupCodes } from "@/server-actions/recovery";

type Phase = "form" | "codes";

/**
 * Generate a high-entropy throwaway password. It satisfies the email+password
 * signup that bootstraps the single user + a session, then is discarded — never
 * shown to the user, never stored anywhere. (The passkey plugin has no
 * passkey-native signup; addPasskey requires an existing session.)
 */
function throwawayPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes));
}

export function PasskeyRegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [codes, setCodes] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setBusy(true);
    try {
      // 1) Bootstrap the single user + a session via email+password (throwaway pw).
      const signUp = await authClient.signUp.email({
        email,
        password: throwawayPassword(),
        name: email,
      });
      if (signUp.error) {
        throw new Error(signUp.error.message ?? "Sign-up failed");
      }

      // 2) Register the platform passkey against the new session.
      const pk = await authClient.passkey.addPasskey();
      if (pk?.error) {
        throw new Error(pk.error.message ?? "Passkey registration failed");
      }

      // 3) Server generates + persists hashed codes and returns plaintext ONCE.
      const issued = await issueBackupCodes();
      setCodes(issued);
      setPhase("codes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  if (phase === "codes") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Save your recovery codes</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <Alert tone="warning">
            These 10 codes are shown only once. Store them somewhere safe — each
            lets you sign in and register a new passkey if you lose this device.
          </Alert>
          <ul className="grid grid-cols-2 gap-2 font-mono text-[13px]">
            {codes.map((c) => (
              <li
                key={c}
                className="rounded-[var(--radius-data)] border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-center tracking-wider"
              >
                {c}
              </li>
            ))}
          </ul>
          <label className="flex items-center gap-2 text-[13px] text-text-2">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            I have saved these recovery codes.
          </label>
          <Button
            disabled={!confirmed}
            leadingIcon="check"
            onClick={() => router.push("/today")}
          >
            Continue
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Set up Upshot</CardTitle>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          {error && <Alert tone="critical">{error}</Alert>}
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Button type="submit" loading={busy} leadingIcon="shield">
            Create account with passkey
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
