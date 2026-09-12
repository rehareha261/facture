import * as XLSX from "xlsx";
import type { VentesMensuellesChartData } from "@/lib/dashboard-ventes";
import { MOIS_LABELS_EXCEL } from "@/lib/dashboard-ventes";

/** Montant Excel : espace = milliers, virgule = décimales (ex. 23 315 200,00) */
export function formatMontantExcel(montant: number): string {
  const arrondi = Math.round(montant * 100) / 100;
  const [partieEntiere, partieDecimale] = arrondi.toFixed(2).split(".");
  const avecEspaces = partieEntiere.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${avecEspaces},${partieDecimale}`;
}

/** Exporte le tableau ventes mensuelles HT au format Excel (modèle Odette) */
export function exportVentesExcel(data: VentesMensuellesChartData) {
  const [anN, anN1, anN2] = data.annees;

  const rows: string[][] = [
    ["VENTE DE BOISSON ALCOOLIQUE PAR MOIS HORS TAXE"],
    [],
    ["", String(anN2), String(anN1), String(anN)],
  ];

  for (let m = 0; m < 12; m++) {
    rows.push([
      MOIS_LABELS_EXCEL[m],
      formatMontantExcel(data.series[2].montants[m]),
      formatMontantExcel(data.series[1].montants[m]),
      formatMontantExcel(data.series[0].montants[m]),
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws["!cols"] = [{ wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ventes HT");

  const fileName = `ventes-boissons-${anN2}-${anN}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
