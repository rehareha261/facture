import { Badge } from "@/components/ui/Badge";
import {
  STATUT_BADGE_VARIANT,
  STATUT_LABELS,
  getStatutEffectif,
} from "@/lib/facture-statut";
import type { Facture } from "@/lib/types";

interface StatutBadgeProps {
  facture: Pick<Facture, "statut" | "date_echeance">;
}

export function StatutBadge({ facture }: StatutBadgeProps) {
  const statut = getStatutEffectif(facture);
  return (
    <Badge variant={STATUT_BADGE_VARIANT[statut]}>{STATUT_LABELS[statut]}</Badge>
  );
}
