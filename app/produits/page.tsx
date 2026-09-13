import Link from "next/link";
import { ProduitsManager } from "@/components/produits/ProduitsManager";
import { Alert } from "@/components/ui/Alert";
import { getEntreprises } from "@/lib/actions/entreprise";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase-utils";
import type { Produit } from "@/lib/types";

export const metadata = { title: "Produits — Facturation" };
export const dynamic = "force-dynamic";

export default async function ProduitsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const entrepriseParam = typeof sp.entreprise === "string" ? sp.entreprise : undefined;

  const supabase = await createClient();
  const [entreprisesRes, produitsRes] = await Promise.all([
    getEntreprises(),
    supabase.from("produits").select("*").order("designation", { ascending: true }),
  ]);

  if (entreprisesRes.error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900">Produits</h1>
        <Alert variant="error">
          Impossible de charger les entreprises : {entreprisesRes.error}
        </Alert>
      </div>
    );
  }

  const entreprises = entreprisesRes.data;

  if (entreprises.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900">Produits</h1>
        <Alert variant="warning">
          Créez d&apos;abord une entreprise dans{" "}
          <Link href="/entreprise" className="font-medium text-blue-600 hover:underline">
            Mes entreprises
          </Link>
          .
        </Alert>
      </div>
    );
  }

  if (produitsRes.error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900">Produits</h1>
        <Alert variant="error">
          Impossible de charger les produits : {getSupabaseErrorMessage(produitsRes.error)}
        </Alert>
      </div>
    );
  }

  const defaultEntrepriseId =
    entreprises.find((e) => e.id === entrepriseParam)?.id ?? entreprises[0]!.id;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Produits</h1>
      <ProduitsManager
        entreprises={entreprises}
        produits={(produitsRes.data ?? []) as Produit[]}
        defaultEntrepriseId={defaultEntrepriseId}
      />
    </div>
  );
}
