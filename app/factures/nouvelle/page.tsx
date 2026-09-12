import { NouvelleFactureForm } from "@/components/factures/NouvelleFactureForm";
import { Alert } from "@/components/ui/Alert";
import { getEntreprise } from "@/lib/actions/entreprise";
import { genererNumeroFacture } from "@/lib/actions/factures";
import { TAUX_TVA_DEFAUT } from "@/lib/taux-tva";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase-utils";
import type { Produit } from "@/lib/types";

export const metadata = { title: "Nouvelle facture — Facturation" };
export const dynamic = "force-dynamic";

export default async function NouvelleFacturePage() {
  const supabase = await createClient();
  const [produitsRes, numeroRes, entrepriseRes] = await Promise.all([
    supabase.from("produits").select("*").order("designation"),
    genererNumeroFacture(),
    getEntreprise(),
  ]);
  const tauxTva = entrepriseRes.data?.taux_tva ?? TAUX_TVA_DEFAUT;

  if (produitsRes.error) {
    return (
      <PageShell>
        <Alert variant="error">
          Impossible de charger les produits : {getSupabaseErrorMessage(produitsRes.error)}
        </Alert>
      </PageShell>
    );
  }

  const produits = (produitsRes.data ?? []) as Produit[];

  return (
    <PageShell>
      <NouvelleFactureForm
        produits={produits}
        defaultNumero={numeroRes.numero ?? ""}
        numeroError={numeroRes.error}
        tauxTva={tauxTva}
      />
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900">Nouvelle facture</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Modèle fixe — Doit : Clients divers.
      </p>
      {children}
    </div>
  );
}
