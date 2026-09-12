import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { Client, Entreprise, Facture, LigneFacture } from "@/lib/types";
import { DEVISE_SYMBOLE } from "@/lib/constants";
import { arrondirMontant, calculerLigne } from "@/lib/facture-calculs";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  logo: { width: 80, height: 80, objectFit: "contain" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 4 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", marginBottom: 6, color: "#374151" },
  row: { flexDirection: "row", marginBottom: 2 },
  label: { width: 80, color: "#6b7280" },
  table: { marginTop: 8 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: 6,
    fontWeight: "bold",
  },
  tableRow: { flexDirection: "row", padding: 6, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  colDesignation: { flex: 3 },
  colQty: { flex: 0.6, textAlign: "right" },
  colPrix: { flex: 1, textAlign: "right" },
  colTva: { flex: 0.6, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },
  totals: { marginTop: 16, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", width: 200, justifyContent: "space-between", marginBottom: 4 },
  totalTtc: { fontWeight: "bold", fontSize: 12, marginTop: 4 },
  notes: { marginTop: 24, padding: 10, backgroundColor: "#f9fafb" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", color: "#9ca3af", fontSize: 8 },
});

function fmt(n: number): string {
  return `${n.toLocaleString("fr-MG")} ${DEVISE_SYMBOLE}`;
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR");
}

export interface InvoicePdfProps {
  entreprise: Entreprise;
  client: Client;
  facture: Facture;
  lignes: LigneFacture[];
}

export function InvoicePdfDocument({ entreprise, client, facture, lignes }: InvoicePdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            {entreprise.logo_url ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image
              <Image src={entreprise.logo_url} style={styles.logo} />
            ) : null}
            <Text style={{ fontWeight: "bold", fontSize: 14 }}>{entreprise.nom}</Text>
            {entreprise.adresse ? <Text>{entreprise.adresse}</Text> : null}
            {entreprise.telephone ? <Text>Tél : {entreprise.telephone}</Text> : null}
            {entreprise.email ? <Text>{entreprise.email}</Text> : null}
            {/* NIF et STAT entreprise : toujours affichés s'ils existent */}
            {entreprise.nif ? <Text>NIF : {entreprise.nif}</Text> : null}
            {entreprise.stat ? <Text>STAT : {entreprise.stat}</Text> : null}
            {entreprise.numero_rcs ? <Text>RCS : {entreprise.numero_rcs}</Text> : null}
            {entreprise.numero_tva ? <Text>N° TVA : {entreprise.numero_tva}</Text> : null}
            {entreprise.iban ? <Text>IBAN : {entreprise.iban}</Text> : null}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.title}>FACTURE</Text>
            <Text>N° {facture.numero}</Text>
            <Text>Date : {fmtDate(facture.date_emission)}</Text>
            {facture.date_echeance ? (
              <Text>Échéance : {fmtDate(facture.date_echeance)}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client</Text>
          <Text style={{ fontWeight: "bold" }}>{client.nom}</Text>
          {client.adresse ? <Text>{client.adresse}</Text> : null}
          {client.email ? <Text>{client.email}</Text> : null}
          {client.telephone ? <Text>{client.telephone}</Text> : null}
          {/* NIF/STAT client : uniquement si renseignés (client pro) */}
          {client.nif ? <Text>NIF : {client.nif}</Text> : null}
          {client.stat ? <Text>STAT : {client.stat}</Text> : null}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesignation}>Désignation</Text>
            <Text style={styles.colQty}>Qté</Text>
            <Text style={styles.colPrix}>Prix HT</Text>
            <Text style={styles.colTva}>TVA</Text>
            <Text style={styles.colTotal}>Total TTC</Text>
          </View>
          {lignes
            .sort((a, b) => a.ordre - b.ordre)
            .map((ligne) => {
              const { ttc } = calculerLigne(
                ligne.quantite,
                ligne.prix_unitaire_ht,
                ligne.taux_tva
              );
              return (
                <View key={ligne.id} style={styles.tableRow}>
                  <Text style={styles.colDesignation}>{ligne.designation}</Text>
                  <Text style={styles.colQty}>{ligne.quantite}</Text>
                  <Text style={styles.colPrix}>{fmt(ligne.prix_unitaire_ht)}</Text>
                  <Text style={styles.colTva}>{ligne.taux_tva} %</Text>
                  <Text style={styles.colTotal}>{fmt(arrondirMontant(ttc))}</Text>
                </View>
              );
            })}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Total HT</Text>
            <Text>{fmt(facture.total_ht)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Total TVA</Text>
            <Text>{fmt(facture.total_tva)}</Text>
          </View>
          <View style={[styles.totalRow, styles.totalTtc]}>
            <Text>Total TTC</Text>
            <Text>{fmt(facture.total_ttc)}</Text>
          </View>
        </View>

        {facture.notes ? (
          <View style={styles.notes}>
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>Notes</Text>
            <Text>{facture.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>{entreprise.nom} — Facture {facture.numero}</Text>
      </Page>
    </Document>
  );
}
