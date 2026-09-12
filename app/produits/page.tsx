import { ProduitsManager } from "@/components/produits/ProduitsManager";
import { Alert } from "@/components/ui/Alert";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase-utils";
import type { Produit } from "@/lib/types";

export const metadata = { title: "Produits — Facturation" };
export const dynamic = "force-dynamic";

export default async function ProduitsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("produits")
    .select("*")
    .order("designation", { ascending: true });

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900">Catalogue produits</h1>
        <Alert variant="error">
          Impossible de charger les produits : {getSupabaseErrorMessage(error)}
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900">Catalogue produits</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Modèles pré-remplis pour vos lignes de facturation. Les prix figés sur les factures ne
        changent jamais rétroactivement.
      </p>
      <ProduitsManager produits={(data ?? []) as Produit[]} />
    </div>
  );
}
