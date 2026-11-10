/** Nombre à la française (espaces des milliers, virgule), arrondi à `digits` décimales. */
export const fmt = (n: number, digits = 0) => n.toLocaleString('fr-FR', { maximumFractionDigits: digits });
