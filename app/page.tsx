import Link from "next/link";
import { Suspense } from "react";
import { DashboardVentesSection } from "@/components/dashboard/DashboardVentesSection";
import { Alert } from "@/components/ui/Alert";
import { formatMontant } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase-utils";
import type { Facture } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const now = new Date();
  const anneeCourante = now.getFullYear();

  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
  const debutAnnee = `${anneeCourante}-01-01`;
  const finAnnee = `${anneeCourante}-12-31`;

  const cols = "date_emission, total_ht";
  const [facturesMoisRes, facturesAnneeRes, facturesHistoriqueRes, countRes] =
    await Promise.all([
      supabase
        .from("factures")
        .select(cols)
        .gte("date_emission", debutMois)
        .lte("date_emission", finMois),
      supabase
        .from("factures")
        .select(cols)
        .gte("date_emission", debutAnnee)
        .lte("date_emission", finAnnee),
      supabase.from("factures").select(cols).gte("date_emission", "2023-01-01"),
      supabase.from("factures").select("*", { count: "exact", head: true }),
    ]);

  const error =
    facturesMoisRes.error ??
    facturesAnneeRes.error ??
    facturesHistoriqueRes.error ??
    countRes.error;

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

  const factures = (facturesMoisRes.data ?? []) as Facture[];
  const facturesAnnee = (facturesAnneeRes.data ?? []) as Facture[];
  const facturesHistorique = (facturesHistoriqueRes.data ?? []) as Facture[];
  const totalFactures = countRes.count ?? 0;

  const nbFacturesMois = factures.length;
  const montantFactureMois = factures.reduce((s, f) => s + f.total_ht, 0);
  const montantAnnee = facturesAnnee.reduce((s, f) => s + f.total_ht, 0);

  const stats = [
    { label: "Factures ce mois-ci", value: String(nbFacturesMois) },
    { label: "Montant HT ce mois", value: formatMontant(montantFactureMois) },
    { label: `Montant HT ${anneeCourante}`, value: formatMontant(montantAnnee) },
    { label: "Total factures", value: String(totalFactures) },
  ];

  const quickLinks = [
    { href: "/factures/nouvelle", label: "Nouvelle facture", primary: true },
    { href: "/produits", label: "Produits" },
    { href: "/factures", label: "Toutes les factures" },
    { href: "/entreprise", label: "Mon entreprise" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-zinc-900">Tableau de bord</h1>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-10">
        <Suspense fallback={<p className="text-zinc-500">Chargement du graphique…</p>}>
          <DashboardVentesSection
            factures={facturesHistorique}
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
