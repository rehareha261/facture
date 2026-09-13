import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Facture, LigneFacture } from "@/lib/types";
import { arrondirMontant, calculerLigne } from "@/lib/facture-calculs";
import { montantEnLettres } from "@/lib/nombre-en-lettres";
import { formatNombrePdf, formatQuantitePdf } from "@/lib/format";
import { entrepriseNifStat } from "@/lib/entreprise-utils";
import { MODELE_FACTURE } from "@/lib/facture-modele";
import type { Entreprise } from "@/lib/types";

const BORDER = "#000000";
const MIN_LIGNES = 10;

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#000",
  },
  topRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  companyBlock: { flex: 1, paddingRight: 12 },
  companyName: { fontSize: 11, fontWeight: "bold", marginBottom: 2 },
  companyLine: { fontSize: 9, marginBottom: 1 },
  metaBlock: { width: 200 },
  metaBox: {
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    marginBottom: 0,
  },
  metaLabel: {
    width: 70,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    padding: 4,
    fontWeight: "bold",
    fontSize: 8,
  },
  metaValue: { flex: 1, padding: 4, fontSize: 9 },
  doitBlock: {
    borderWidth: 1,
    borderColor: BORDER,
    borderTopWidth: 0,
    padding: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  doitLabel: { fontWeight: "bold", marginRight: 4 },
  cell: {
    borderWidth: 1,
    borderColor: BORDER,
    padding: 4,
    fontSize: 9,
  },
  tableRow: { flexDirection: "row" },
  headerCell: {
    borderWidth: 1,
    borderColor: BORDER,
    padding: 4,
    fontSize: 9,
    fontWeight: "bold",
    backgroundColor: "#e8e8e8",
    textAlign: "center",
  },
  colQte: { width: "12%" },
  colLibelle: { width: "48%" },
  colPu: { width: "18%" },
  colMontant: { width: "22%", textAlign: "right" },
  totalLabel: {
    borderWidth: 1,
    borderColor: BORDER,
    padding: 4,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "right",
  },
  footerLine: { marginTop: 10, fontSize: 9 },
  signatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 36,
    paddingHorizontal: 40,
  },
  signatureLabel: { fontSize: 9, fontWeight: "bold" },
});

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR");
}

function tauxTvaLabel(lignes: LigneFacture[]): string {
  const taux = [...new Set(lignes.map((l) => l.taux_tva))];
  if (taux.length === 1) return `TVA ${taux[0]} %`;
  return "TVA";
}

export interface InvoicePdfProps {
  facture: Facture;
  lignes: LigneFacture[];
  entreprise: Entreprise;
}

export function InvoicePdfDocument({ facture, lignes, entreprise }: InvoicePdfProps) {
  const sorted = [...lignes].sort((a, b) => a.ordre - b.ordre);
  const padded: (LigneFacture | null)[] = [...sorted];
  while (padded.length < MIN_LIGNES) padded.push(null);

  const modePaiement = facture.mode_paiement ?? MODELE_FACTURE.modePaiementDefaut;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topRow}>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{entreprise.nom}</Text>
            {entreprise.adresse ? (
              <Text style={styles.companyLine}>{entreprise.adresse}</Text>
            ) : null}
            {entrepriseNifStat(entreprise) ? (
              <Text style={styles.companyLine}>{entrepriseNifStat(entreprise)}</Text>
            ) : null}
            {entreprise.activite ? (
              <Text style={styles.companyLine}>{entreprise.activite}</Text>
            ) : null}
          </View>

          <View style={styles.metaBlock}>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Date :</Text>
              <Text style={styles.metaValue}>{fmtDate(facture.date_emission)}</Text>
            </View>
            <View style={[styles.metaBox, { borderTopWidth: 0 }]}>
              <Text style={styles.metaLabel}>NUM FACT :</Text>
              <Text style={styles.metaValue}>{facture.numero}</Text>
            </View>
            <View style={styles.doitBlock}>
              <Text style={styles.doitLabel}>Doit :</Text>
              <Text>{MODELE_FACTURE.doit}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 6 }}>
          <View style={styles.tableRow}>
            <Text style={[styles.headerCell, styles.colQte]}>Qte</Text>
            <Text style={[styles.headerCell, styles.colLibelle]}>Libelle</Text>
            <Text style={[styles.headerCell, styles.colPu]}>PU</Text>
            <Text style={[styles.headerCell, styles.colMontant]}>Montant</Text>
          </View>

          {padded.map((ligne, i) => {
            if (!ligne) {
              return (
                <View key={`empty-${i}`} style={styles.tableRow}>
                  <Text style={[styles.cell, styles.colQte]}> </Text>
                  <Text style={[styles.cell, styles.colLibelle]}> </Text>
                  <Text style={[styles.cell, styles.colPu]}> </Text>
                  <Text style={[styles.cell, styles.colMontant]}> </Text>
                </View>
              );
            }
            const { ht } = calculerLigne(
              ligne.quantite,
              ligne.prix_unitaire_ht,
              ligne.taux_tva
            );
            return (
              <View key={ligne.id} style={styles.tableRow}>
                <Text style={[styles.cell, styles.colQte, { textAlign: "center" }]}>
                  {formatQuantitePdf(ligne.quantite)}
                </Text>
                <Text style={[styles.cell, styles.colLibelle]}>{ligne.designation}</Text>
                <Text style={[styles.cell, styles.colPu, { textAlign: "right" }]}>
                  {formatNombrePdf(ligne.prix_unitaire_ht)}
                </Text>
                <Text style={[styles.cell, styles.colMontant]}>
                  {formatNombrePdf(arrondirMontant(ht))}
                </Text>
              </View>
            );
          })}

          <View style={styles.tableRow}>
            <Text style={[styles.cell, styles.colQte]}> </Text>
            <Text style={[styles.totalLabel, styles.colLibelle]}>TOTAL HT</Text>
            <Text style={[styles.cell, styles.colPu]}> </Text>
            <Text style={[styles.cell, styles.colMontant, { fontWeight: "bold" }]}>
              {formatNombrePdf(facture.total_ht)}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.cell, styles.colQte]}> </Text>
            <Text style={[styles.totalLabel, styles.colLibelle]}>{tauxTvaLabel(sorted)}</Text>
            <Text style={[styles.cell, styles.colPu]}> </Text>
            <Text style={[styles.cell, styles.colMontant, { fontWeight: "bold" }]}>
              {formatNombrePdf(facture.total_tva)}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.cell, styles.colQte]}> </Text>
            <Text style={[styles.totalLabel, styles.colLibelle]}>TOTAL TTC</Text>
            <Text style={[styles.cell, styles.colPu]}> </Text>
            <Text style={[styles.cell, styles.colMontant, { fontWeight: "bold" }]}>
              {formatNombrePdf(facture.total_ttc)}
            </Text>
          </View>
        </View>

        <Text style={styles.footerLine}>
          Arrêté à la somme de : {montantEnLettres(facture.total_ttc)}
        </Text>
        <Text style={styles.footerLine}>Mode paiement : {modePaiement}</Text>

        {facture.notes ? (
          <Text style={[styles.footerLine, { marginTop: 6 }]}>{facture.notes}</Text>
        ) : null}

        <View style={styles.signatures}>
          <Text style={styles.signatureLabel}>Client</Text>
          <Text style={styles.signatureLabel}>Fournisseur</Text>
        </View>
      </Page>
    </Document>
  );
}
