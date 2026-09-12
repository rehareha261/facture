import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Connexion — Facturation" };

export default function LoginPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Facturation</h1>
        <p className="mt-1 text-sm text-zinc-500">Connectez-vous pour accéder à l&apos;application</p>
      </div>
      <Suspense fallback={<p className="text-zinc-500">Chargement…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
