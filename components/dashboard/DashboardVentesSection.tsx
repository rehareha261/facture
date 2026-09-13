"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardStatGrid } from "@/components/dashboard/DashboardStatGrid";
import { QuantitesProduitsChart } from "@/components/dashboard/QuantitesProduitsChart";
import { VentesMensuellesChart } from "@/components/dashboard/VentesMensuellesChart";
import {
  aggregerQuantitesMensuelles,
  produitPlusVendu,
  produitsDisponibles,
  type LigneVenteDashboard,
} from "@/lib/dashboard-produits";
import {
  aggregerVentesMensuelles,
  anneesDisponibles,
} from "@/lib/dashboard-ventes";
import { exportVentesExcel } from "@/lib/export-ventes-excel";
import { formatMontant } from "@/lib/format";
import type { Facture } from "@/lib/types";

interface DashboardVentesSectionProps {
  factures: Facture[];
  lignes: LigneVenteDashboard[];
  anneeDefaut: number;
}

function formatTopProduit(lignes: LigneVenteDashboard[], annee: number) {
  const top = produitPlusVendu(lignes, annee);
  if (!top) return { value: "—", sub: undefined };
  return {
    value: top.designation,
    sub: `${top.quantite.toLocaleString("fr-FR")} unités`,
  };
}

export function DashboardVentesSection({
  factures,
  lignes,
  anneeDefaut,
}: DashboardVentesSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const annees = useMemo(() => anneesDisponibles(factures), [factures]);
  const produits = useMemo(() => produitsDisponibles(lignes), [lignes]);

  const anneeCourante = new Date().getFullYear();

  const anneeInitiale = (() => {
    const p = searchParams.get("annee");
    if (p) {
      const n = parseInt(p, 10);
      if (!Number.isNaN(n) && annees.includes(n)) return n;
    }
    return annees.includes(anneeDefaut) ? anneeDefaut : annees[0]!;
  })();

  const produitInit = searchParams.get("produit") ?? "";

  const [anneeRef, setAnneeRef] = useState(anneeInitiale);
  const [produitRef, setProduitRef] = useState(produitInit);

  const statsAnneeCourante = useMemo(() => {
    const now = new Date();
    const moisCourant = now.getMonth();

    const facturesMois = factures.filter((f) => {
      const d = new Date(f.date_emission);
      return d.getFullYear() === anneeCourante && d.getMonth() === moisCourant;
    });

    const facturesAnnee = factures.filter((f) => {
      const d = new Date(f.date_emission);
      return d.getFullYear() === anneeCourante;
    });

    const montantMois = facturesMois.reduce((s, f) => s + Number(f.total_ht), 0);
    const montantAnnee = facturesAnnee.reduce((s, f) => s + Number(f.total_ht), 0);
    const topProduit = formatTopProduit(lignes, anneeCourante);

    return [
      { label: "Factures ce mois-ci", value: String(facturesMois.length) },
      { label: "Montant HT ce mois", value: formatMontant(montantMois) },
      { label: "Montant HT", value: formatMontant(montantAnnee) },
      {
        label: "Produit le plus vendu",
        value: topProduit.value,
        sub: topProduit.sub,
      },
    ];
  }, [factures, lignes, anneeCourante]);

  const statsAnneeSelectionnee = useMemo(() => {
    const facturesAnnee = factures.filter((f) => {
      const d = new Date(f.date_emission);
      return d.getFullYear() === anneeRef;
    });

    const montantAnnee = facturesAnnee.reduce((s, f) => s + Number(f.total_ht), 0);
    const topProduit = formatTopProduit(lignes, anneeRef);

    return [
      { label: `Montant HT total ${anneeRef}`, value: formatMontant(montantAnnee) },
      {
        label: `Produit le plus vendu (${anneeRef})`,
        value: topProduit.value,
        sub: topProduit.sub,
      },
    ];
  }, [factures, lignes, anneeRef]);

  const chartData = useMemo(
    () => aggregerVentesMensuelles(factures, anneeRef),
    [factures, anneeRef]
  );

  const quantitesData = useMemo(
    () => aggregerQuantitesMensuelles(lignes, anneeRef, produitRef || undefined),
    [lignes, anneeRef, produitRef]
  );

  const changerAnnee = (annee: number) => {
    setAnneeRef(annee);
    const params = new URLSearchParams(searchParams.toString());
    params.set("annee", String(annee));
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const changerProduit = (produit: string) => {
    setProduitRef(produit);
    const params = new URLSearchParams(searchParams.toString());
    if (produit) params.set("produit", produit);
    else params.delete("produit");
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Année en cours</h2>
        <DashboardStatGrid stats={statsAnneeCourante} />
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-900">
            Statistiques {anneeRef}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="annee-ref" className="text-sm font-medium text-zinc-700">
                Année :
              </label>
              <select
                id="annee-ref"
                value={anneeRef}
                onChange={(e) => changerAnnee(parseInt(e.target.value, 10))}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                {annees.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => exportVentesExcel(chartData)}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Exporter Excel
            </button>
          </div>
        </div>

        <DashboardStatGrid stats={statsAnneeSelectionnee} columns={2} />

        <VentesMensuellesChart data={chartData} />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label htmlFor="produit-ref" className="text-sm font-medium text-zinc-700">
              Produit :
            </label>
            <select
              id="produit-ref"
              value={produitRef}
              onChange={(e) => changerProduit(e.target.value)}
              className="max-w-sm rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="">Tous les produits</option>
              {produits.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.designation}
                </option>
              ))}
            </select>
          </div>
          <QuantitesProduitsChart data={quantitesData} />
        </div>
      </section>
    </div>
  );
}
