import Link from "next/link";
import { Suspense } from "react";
import { FacturesList } from "@/components/factures/FacturesList";
import { Alert } from "@/components/ui/Alert";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase-utils";
import type { Client, FactureAvecClient } from "@/lib/types";

export const metadata = { title: "Factures — Facturation" };
export const dynamic = "force-dynamic";

export default async function FacturesPage() {
  const supabase = await createClient();
  const [facturesRes, clientsRes] = await Promise.all([
    supabase
      .from("factures")
      .select("*, clients(nom)")
      .order("date_emission", { ascending: false }),
    supabase.from("clients").select("id, nom").order("nom"),
  ]);

  if (facturesRes.error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Factures</h1>
        <Alert variant="error">
          Impossible de charger les factures : {getSupabaseErrorMessage(facturesRes.error)}
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Factures</h1>
          <p className="text-sm text-zinc-500">Triées par date d&apos;émission (plus récentes en premier)</p>
        </div>
        <Link
          href="/factures/nouvelle"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Nouvelle facture
        </Link>
      </div>

      <Suspense fallback={<p className="text-zinc-500">Chargement…</p>}>
        <FacturesList
          factures={(facturesRes.data ?? []) as FactureAvecClient[]}
          clients={(clientsRes.data ?? []) as Pick<Client, "id" | "nom">[]}
        />
      </Suspense>
    </div>
  );
}
