import { NextRequest, NextResponse } from "next/server";
import { generatePdfBuffer } from "@/lib/generate-pdf-buffer";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase-utils";
import type { Facture, LigneFacture } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { factureId } = (await request.json()) as { factureId?: string };

    if (!factureId) {
      return NextResponse.json({ error: "ID de facture manquant." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { data: facture, error: factureError } = await supabase
      .from("factures")
      .select("*, lignes_facture(*)")
      .eq("id", factureId)
      .single();

    if (factureError || !facture) {
      return NextResponse.json(
        { error: getSupabaseErrorMessage(factureError) ?? "Facture introuvable." },
        { status: 404 }
      );
    }

    const lignes = (facture.lignes_facture as LigneFacture[]).sort(
      (a, b) => a.ordre - b.ordre
    );

    const pdfBuffer = await generatePdfBuffer(facture as Facture, lignes);
    const fileName = `${(facture.numero as string).replace(/\//g, "-")}.pdf`;

    return NextResponse.json({
      fileName,
      pdfBase64: Buffer.from(pdfBuffer).toString("base64"),
    });
  } catch (err) {
    console.error("[generate-invoice]", err);
    return NextResponse.json(
      { error: "Erreur interne lors de la génération du PDF." },
      { status: 500 }
    );
  }
}
