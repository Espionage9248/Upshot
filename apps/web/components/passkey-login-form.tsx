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
import { redeemBackupCode } from "@/server-actions/recovery";

type Mode = "passkey" | "backup";

export function PasskeyLoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("passkey");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handlePasskeySignIn() {
    setError(undefined);
    setBusy(true);
    try {
      const res = await authClient.signIn.passkey();
      if (res?.error) {
        throw new Error(res.error.message ?? "Passkey sign-in failed");
      }
      router.push("/today");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleBackupCode(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setBusy(true);
    try {
      // Server verifies + consumes the code and establishes a fresh session.
      const res = await redeemBackupCode(code);
      if (!res.ok) {
        throw new Error("Invalid or already-used recovery code");
      }
      // Authorised by the session: register a fresh passkey for this device.
      const pk = await authClient.passkey.addPasskey();
      if (pk?.error) {
        throw new Error(pk.error.message ?? "Passkey registration failed");
      }
      router.push("/today");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recovery failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in to Upshot</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        {error && <Alert tone="critical">{error}</Alert>}

        {mode === "passkey" ? (
          <>
            <Button
              loading={busy}
              leadingIcon="shield"
              onClick={handlePasskeySignIn}
            >
              Sign in with passkey
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setError(undefined);
                setMode("backup");
              }}
            >
              Use a backup code
            </Button>
          </>
        ) : (
          <form onSubmit={handleBackupCode} className="flex flex-col gap-4">
            <Input
              label="Recovery code"
              mono
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="XXXXXXXXXX"
            />
            <Button type="submit" loading={busy} leadingIcon="shield">
              Recover and add a passkey
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setError(undefined);
                setMode("passkey");
              }}
            >
              Back to passkey sign-in
            </Button>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
