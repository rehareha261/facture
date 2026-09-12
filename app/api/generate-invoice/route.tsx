import { NextRequest, NextResponse } from "next/server";
import { generatePdfBuffer } from "@/lib/generate-pdf-buffer";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase-utils";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
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
    const storagePath = `${factureId}/${fileName}`;

    const admin = createSupabaseAdmin();
    const storageClient = admin ?? supabase;

    const { error: uploadError } = await storageClient.storage
      .from("factures")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Échec de l'upload PDF : ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = storageClient.storage
      .from("factures")
      .getPublicUrl(storagePath);

    const pdfUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabase
      .from("factures")
      .update({ pdf_url: pdfUrl })
      .eq("id", factureId);

    if (updateError) {
      return NextResponse.json(
        { error: getSupabaseErrorMessage(updateError) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pdfUrl,
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
