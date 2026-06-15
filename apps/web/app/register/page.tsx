import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { tables } from "@upshot/db";
import { getDb } from "@/lib/db";
import { PasskeyRegisterForm } from "@/components/passkey-register-form";

// Queries the encrypted DB at request time for the first-run gate, so it must
// not be statically prerendered at build (no DB key is present then).
export const dynamic = "force-dynamic";

// First-run only: if the single user already exists, /register is closed.
export default async function RegisterPage(): Promise<ReactNode> {
  const existing = await getDb().db.select().from(tables.user).limit(1);
  if (existing.length > 0) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <PasskeyRegisterForm />
    </main>
  );
}
