import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signInAction } from "@/lib/actions/auth-actions";
import { isDemoMode } from "@/lib/env";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Sign in" };

/** Demo credentials, read from DEMO_MODE at request time (not at build). */
async function DemoCredentials() {
  await connection();
  if (!isDemoMode()) return null;
  return (
    <div className="mb-4 rounded-md border border-primary/30 bg-accent px-3 py-2 text-sm text-accent-foreground">
      <p className="font-medium">Demo account</p>
      <p>
        Email: <code className="font-mono">{DEMO_EMAIL}</code>
      </p>
      <p>
        Password: <code className="font-mono">{DEMO_PASSWORD}</code>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Welcome back. Pick up where you left off.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={null}>
          <DemoCredentials />
        </Suspense>
        <AuthForm mode="sign-in" action={signInAction} />
      </CardContent>
    </Card>
  );
}
