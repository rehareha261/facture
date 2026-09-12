import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePdfDocument } from "@/lib/pdf-template";
import type { Client, Entreprise, Facture, LigneFacture } from "@/lib/types";

/** Génère le buffer PDF (hors try/catch de la route API) */
export async function generatePdfBuffer(
  entreprise: Entreprise,
  client: Client,
  facture: Facture,
  lignes: LigneFacture[]
) {
  return renderToBuffer(
    <InvoicePdfDocument
      entreprise={entreprise}
      client={client}
      facture={facture}
      lignes={lignes}
    />
  );
}
