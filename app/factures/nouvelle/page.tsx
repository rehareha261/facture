import { NouvelleFactureForm } from "@/components/factures/NouvelleFactureForm";
import { Alert } from "@/components/ui/Alert";
import { genererNumeroFacture } from "@/lib/actions/factures";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase-utils";
import type { Client, Produit } from "@/lib/types";
import Link from "next/link";

export const metadata = { title: "Nouvelle facture — Facturation" };
export const dynamic = "force-dynamic";

export default async function NouvelleFacturePage() {
  const supabase = await createClient();
  const [clientsRes, produitsRes, numeroRes] = await Promise.all([
    supabase.from("clients").select("*").order("nom"),
    supabase.from("produits").select("*").order("designation"),
    genererNumeroFacture(),
  ]);

  if (clientsRes.error) {
    return (
      <PageShell>
        <Alert variant="error">
          Impossible de charger les clients : {getSupabaseErrorMessage(clientsRes.error)}
        </Alert>
      </PageShell>
    );
  }

  const clients = (clientsRes.data ?? []) as Client[];
  const produits = (produitsRes.data ?? []) as Produit[];

  return (
    <PageShell>
      {clients.length === 0 ? (
        <Alert variant="warning">
          Aucun client enregistré.{" "}
          <Link href="/clients" className="font-medium underline">
            Créez un client
          </Link>{" "}
          avant de facturer.
        </Alert>
      ) : (
        <NouvelleFactureForm
          clients={clients}
          produits={produits}
          defaultNumero={numeroRes.numero ?? ""}
          numeroError={numeroRes.error}
        />
      )}
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900">Nouvelle facture</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Statut initial : brouillon. Les prix des lignes sont figés à l&apos;enregistrement.
      </p>
      {children}
    </div>
  );
}
