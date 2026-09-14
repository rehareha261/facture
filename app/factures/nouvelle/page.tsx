import Link from "next/link";
import { NouvelleFactureForm } from "@/components/factures/NouvelleFactureForm";
import { Alert } from "@/components/ui/Alert";
import { getEntreprises } from "@/lib/actions/entreprise";
import { genererNumeroFacture } from "@/lib/actions/factures";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase-utils";
import type { Entreprise, Produit } from "@/lib/types";

export const metadata = { title: "Nouvelle facture — Facturation" };
export const dynamic = "force-dynamic";

export default async function NouvelleFacturePage() {
  const supabase = await createClient();
  const [produitsRes, numeroRes, entreprisesRes] = await Promise.all([
    supabase.from("produits").select("*").is("deleted_at", null).order("designation"),
    genererNumeroFacture(),
    getEntreprises(),
  ]);

  if (produitsRes.error) {
    return (
      <PageShell>
        <Alert variant="error">
          Impossible de charger les produits : {getSupabaseErrorMessage(produitsRes.error)}
        </Alert>
      </PageShell>
    );
  }

  if (entreprisesRes.error) {
    return (
      <PageShell>
        <Alert variant="error">
          Impossible de charger les entreprises : {entreprisesRes.error}
        </Alert>
      </PageShell>
    );
  }

  const produits = (produitsRes.data ?? []) as Produit[];
  const entreprises = entreprisesRes.data as Entreprise[];

  if (entreprises.length === 0) {
    return (
      <PageShell>
        <Alert variant="info">
          Créez d&apos;abord une entreprise dans{" "}
          <Link href="/entreprise" className="font-medium text-blue-600 hover:underline">
            Mes entreprises
          </Link>
          .
        </Alert>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <NouvelleFactureForm
        produits={produits}
        entreprises={entreprises}
        defaultNumero={numeroRes.numero ?? ""}
        numeroError={numeroRes.error}
      />
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Nouvelle facture</h1>
      {children}
    </div>
  );
}
