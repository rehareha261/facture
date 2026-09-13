"use client";

import { Modal } from "@/components/ui/Modal";
import { EntrepriseForm } from "@/components/entreprise/EntrepriseForm";
import type { Entreprise } from "@/lib/types";

interface EntrepriseFormModalProps {
  open: boolean;
  onClose: () => void;
  entreprise: Entreprise | null;
}

export function EntrepriseFormModal({ open, onClose, entreprise }: EntrepriseFormModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={entreprise ? "Modifier l'entreprise" : "Nouvelle entreprise"}
      wide
    >
      <EntrepriseForm
        key={entreprise?.id ?? "new"}
        entreprise={entreprise}
        onSaved={onClose}
      />
    </Modal>
  );
}
