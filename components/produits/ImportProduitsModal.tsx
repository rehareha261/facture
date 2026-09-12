"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { importProduitsCsv } from "@/lib/actions/import-produits";

interface ImportProduitsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ImportProduitsModal({ open, onClose }: ImportProduitsModalProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = () => {
    setError(null);
    setWarnings([]);
    setSuccess(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Sélectionnez un fichier CSV.");
      return;
    }

    setLoading(true);
    setError(null);
    setWarnings([]);
    setSuccess(null);

    const content = await file.text();
    const result = await importProduitsCsv(content);

    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Import échoué.");
      setWarnings(result.errors);
      return;
    }

    setSuccess(`${result.imported} produit(s) importé(s) avec succès.`);
    if (result.errors.length > 0) setWarnings(result.errors);
    router.refresh();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Importer des produits">
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        {warnings.length > 0 && (
          <Alert variant="warning">
            <p className="font-medium">Avertissements :</p>
            <ul className="mt-1 list-inside list-disc">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </Alert>
        )}

        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt,text/csv"
          className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {success ? "Fermer" : "Annuler"}
          </button>
          {!success && (
            <button
              type="button"
              onClick={handleImport}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Import…" : "Importer"}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
