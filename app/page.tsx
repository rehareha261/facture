import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { getStatutEffectif } from "@/lib/facture-statut";
import { formatMontant } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase-utils";
import type { Facture } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const { data: facturesMois, error } = await supabase
    .from("factures")
    .select("*")
    .gte("date_emission", debutMois)
    .lte("date_emission", finMois);

  const { data: toutesFactures, error: errorAll } = await supabase
    .from("factures")
    .select("*");

  if (error || errorAll) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Tableau de bord</h1>
        <Alert variant="error">
          Impossible de charger les statistiques :{" "}
          {getSupabaseErrorMessage(error ?? errorAll)}
        </Alert>
      </div>
    );
  }

  const factures = (facturesMois ?? []) as Facture[];
  const all = (toutesFactures ?? []) as Facture[];

  const nbFacturesMois = factures.length;
  const montantFactureMois = factures.reduce((s, f) => s + f.total_ttc, 0);

  // Factures envoyées non payées (montant en attente)
  const enAttente = all.filter(
    (f) => f.statut === "envoyee" || getStatutEffectif(f) === "en_retard"
  );
  const montantEnAttente = enAttente.reduce((s, f) => s + f.total_ttc, 0);

  // Factures en retard (calcul à l'affichage)
  const nbEnRetard = all.filter((f) => getStatutEffectif(f) === "en_retard").length;

  const stats = [
    {
      label: "Factures ce mois-ci",
      value: String(nbFacturesMois),
    },
    {
      label: "Montant facturé ce mois",
      value: formatMontant(montantFactureMois),
    },
    {
      label: "En attente de paiement",
      value: formatMontant(montantEnAttente),
      sub: `${enAttente.length} facture(s)`,
    },
    {
      label: "Factures en retard",
      value: String(nbEnRetard),
      highlight: nbEnRetard > 0,
    },
  ];

  const quickLinks = [
    { href: "/factures/nouvelle", label: "Nouvelle facture", primary: true },
    { href: "/clients", label: "Clients" },
    { href: "/produits", label: "Produits" },
    { href: "/factures", label: "Toutes les factures" },
    { href: "/entreprise", label: "Mon entreprise" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900">Tableau de bord</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Vue d&apos;ensemble —{" "}
        {now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
      </p>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border bg-white p-5 ${
              stat.highlight ? "border-red-200 bg-red-50" : "border-zinc-200"
            }`}
          >
            <p className="text-sm text-zinc-500">{stat.label}</p>
            <p
              className={`mt-1 text-2xl font-bold ${
                stat.highlight ? "text-red-700" : "text-zinc-900"
              }`}
            >
              {stat.value}
            </p>
            {stat.sub && <p className="mt-1 text-xs text-zinc-400">{stat.sub}</p>}
          </div>
        ))}
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
