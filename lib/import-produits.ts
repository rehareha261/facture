/** Parse un fichier CSV/TSV de produits (Libelle, PU) */

export interface ProduitImportRow {
  designation: string;
  prix_unitaire_ht: number;
  lineNumber: number;
}

export interface ParseResult {
  rows: ProduitImportRow[];
  errors: string[];
  skipped: number;
}

const HEADER_ALIASES: Record<string, string> = {
  libelle: "designation",
  designation: "designation",
  désignation: "designation",
  produit: "designation",
  nom: "designation",
  pu: "prix",
  prix: "prix",
  prix_unitaire: "prix",
  prix_unitaire_ht: "prix",
  prixht: "prix",
};

function detectSeparator(line: string): string {
  if (line.includes(";")) return ";";
  if (line.includes("\t")) return "\t";
  return ",";
}

function parseNumber(raw: string): number | null {
  const cleaned = raw.trim().replace(/\s/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function parseProduitsCsv(content: string): ParseResult {
  const errors: string[] = [];
  const rows: ProduitImportRow[] = [];
  let skipped = 0;

  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { rows: [], errors: ["Fichier vide."], skipped: 0 };
  }

  const sep = detectSeparator(lines[0]);
  const firstCells = lines[0].split(sep).map((c) => c.trim().toLowerCase());

  let colDesignation = 0;
  let colPrix = 1;
  let startIndex = 0;

  const mapped = firstCells.map((c) => HEADER_ALIASES[c.replace(/"/g, "")] ?? null);
  if (mapped.some(Boolean)) {
    startIndex = 1;
    colDesignation = mapped.findIndex((m) => m === "designation");
    colPrix = mapped.findIndex((m) => m === "prix");
    if (colDesignation < 0 || colPrix < 0) {
      return {
        rows: [],
        errors: ["En-tête non reconnu. Colonnes attendues : Libelle, PU."],
        skipped: 0,
      };
    }
  }

  for (let i = startIndex; i < lines.length; i++) {
    const lineNumber = i + 1;
    const cells = lines[i].split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));

    if (cells.every((c) => !c)) {
      skipped++;
      continue;
    }

    const designation = cells[colDesignation]?.trim();
    const prixRaw = cells[colPrix];
    const prix = parseNumber(prixRaw ?? "");

    if (!designation) {
      errors.push(`Ligne ${lineNumber} : libellé manquant.`);
      continue;
    }
    if (prix === null || prix < 0) {
      errors.push(`Ligne ${lineNumber} : prix invalide (« ${prixRaw} »).`);
      continue;
    }

    rows.push({ designation, prix_unitaire_ht: prix, lineNumber });
  }

  return { rows, errors, skipped };
}
