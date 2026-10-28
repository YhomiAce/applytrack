import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signUpAction } from "@/lib/actions/auth-actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>Track every application from wishlist to offer.</CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm mode="sign-up" action={signUpAction} />
      </CardContent>
    </Card>
  );
}
