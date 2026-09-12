/** Convertit un montant entier en lettres (français) — pour « Arrêté à la somme de » */

const UNITE = [
  "",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "dix-sept",
  "dix-huit",
  "dix-neuf",
];

function sousCent(n: number): string {
  if (n < 20) return UNITE[n];
  if (n < 70) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    return u === 0 ? `${["", "", "vingt", "trente", "quarante", "cinquante", "soixante"][d]}`.trim()
      : u === 1 && d < 6 ? `${["", "", "vingt", "trente", "quarante", "cinquante"][d]} et un`
      : `${["", "", "vingt", "trente", "quarante", "cinquante", "soixante"][d]}-${UNITE[u]}`;
  }
  if (n < 80) return uReste(n, "soixante");
  if (n < 100) return uReste(n, "quatre-vingt");
  return "";
}

function uReste(n: number, base: string): string {
  const r = n % 10;
  if (r === 0) return base + (base === "quatre-vingt" ? "s" : "");
  if (r === 1 && base !== "quatre-vingt") return `${base} et un`;
  return `${base}-${UNITE[r]}`;
}

function sousMille(n: number): string {
  if (n === 0) return "";
  if (n < 100) return sousCent(n);
  const c = Math.floor(n / 100);
  const reste = n % 100;
  const cent =
    c === 1 ? "cent" : c > 1 ? `${UNITE[c]} cent${reste === 0 && c > 1 ? "s" : ""}` : "";
  return reste === 0 ? cent : `${cent} ${sousCent(reste)}`.trim();
}

function chunk(n: number, label: string, plural: string): string {
  if (n === 0) return "";
  if (n === 1) return `${label} `;
  return `${sousMille(n).trim()} ${plural} `;
}

/** Montant TTC en toutes lettres (Ariary, sans centimes si entier) */
export function montantEnLettres(montant: number): string {
  const entier = Math.round(montant);
  if (entier === 0) return "zéro ariary";

  let n = entier;
  const milliards = Math.floor(n / 1_000_000_000);
  n %= 1_000_000_000;
  const millions = Math.floor(n / 1_000_000);
  n %= 1_000_000;
  const mille = Math.floor(n / 1000);
  const reste = n % 1000;

  let texte =
    chunk(milliards, "un milliard", "milliards") +
    chunk(millions, "un million", "millions") +
    (mille === 1 ? "mille " : mille > 1 ? `${sousMille(mille)} mille ` : "") +
    sousMille(reste);

  texte = texte.trim().replace(/\s+/g, " ");
  return `${texte} ariary`;
}
