import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePdfDocument } from "@/lib/pdf-template";
import type { Entreprise, Facture, LigneFacture } from "@/lib/types";

/** Génère le buffer PDF (hors try/catch de la route API) */
export async function generatePdfBuffer(
  facture: Facture,
  lignes: LigneFacture[],
  entreprise: Entreprise
) {
  return renderToBuffer(
    <InvoicePdfDocument facture={facture} lignes={lignes} entreprise={entreprise} />
  );
}
