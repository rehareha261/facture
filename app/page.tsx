import Link from "next/link";
import { Suspense } from "react";
import { DashboardVentesSection } from "@/components/dashboard/DashboardVentesSection";
import { Alert } from "@/components/ui/Alert";
import type { LigneVenteDashboard } from "@/lib/dashboard-produits";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase-utils";
import type { Facture } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const anneeCourante = new Date().getFullYear();

  const [facturesHistoriqueRes, lignesRes] = await Promise.all([
    supabase.from("factures").select("date_emission, total_ht").gte("date_emission", "2023-01-01"),
    supabase
      .from("lignes_facture")
      .select("quantite, produit_id, designation, factures!inner(date_emission)")
      .gte("factures.date_emission", "2023-01-01"),
  ]);

  const error = facturesHistoriqueRes.error ?? lignesRes.error;

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Tableau de bord</h1>
        <Alert variant="error">
          Impossible de charger les statistiques : {getSupabaseErrorMessage(error)}
        </Alert>
      </div>
    );
  }

  const facturesHistorique = (facturesHistoriqueRes.data ?? []) as Facture[];

  const lignes: LigneVenteDashboard[] = (lignesRes.data ?? []).map((row) => {
    const facture = row.factures as { date_emission: string } | { date_emission: string }[];
    const date_emission = Array.isArray(facture) ? facture[0]!.date_emission : facture.date_emission;
    return {
      quantite: Number(row.quantite),
      produit_id: row.produit_id,
      designation: row.designation,
      date_emission,
    };
  });

  const quickLinks = [
    { href: "/factures/nouvelle", label: "Nouvelle facture", primary: true },
    { href: "/produits", label: "Produits" },
    { href: "/factures", label: "Toutes les factures" },
    { href: "/entreprise", label: "Mes entreprises" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-zinc-900">Tableau de bord</h1>

      <div className="mb-10">
        <Suspense fallback={<p className="text-zinc-500">Chargement…</p>}>
          <DashboardVentesSection
            factures={facturesHistorique}
            lignes={lignes}
            anneeDefaut={anneeCourante}
          />
        </Suspense>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-zinc-900">Accès rapide</h2>
      <div className="flex flex-wrap gap-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              link.primary
                ? "rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                : "rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            }
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
