export async function fetchAndDownloadFacturePdf(
  factureId: string
): Promise<{ ok: true; fileName: string } | { ok: false; error: string }> {
  const res = await fetch("/api/generate-invoice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ factureId }),
  });
  const data = (await res.json()) as { error?: string; pdfBase64?: string; fileName?: string };

  if (!res.ok) {
    return { ok: false, error: data.error ?? "Échec de la génération." };
  }
  if (!data.pdfBase64 || !data.fileName) {
    return { ok: false, error: "Réponse invalide du serveur." };
  }

  const bytes = Uint8Array.from(atob(data.pdfBase64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = data.fileName;
  a.click();
  URL.revokeObjectURL(url);

  return { ok: true, fileName: data.fileName };
}
