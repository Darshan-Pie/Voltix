export interface CatalogEntry {
  id: string;
  catalogNumber: string | null;
  description: string;
  make: string;
  category: string;
  listPrice: number;
  discountPercent: number;
  netPrice: number;
  entryType: string;
}

export interface BomInputRow {
  srNo: number | string;
  description: string;
  qty: number;
  unit: string;
  make: string;
  catalogNumber?: string | null;
}

export type MatchStatus = "matched_catalog" | "matched_description" | "not_found";

export interface PricedBomRow extends BomInputRow {
  matchedCatalogNumber: string | null;
  listPrice: number | null;
  discountPercent: number | null;
  discountedRate: number | null;
  netAmount: number | null;
  category: string | null;
  matchStatus: MatchStatus;
  dbEntryId: string | null;
}

/**
 * Derive netPrice from listPrice and discountPercent.
 */
export function computeNetPrice(listPrice: number, discountPercent: number): number {
  return parseFloat((listPrice * (1 - discountPercent / 100)).toFixed(4));
}

/**
 * Price a single BOM row against the loaded catalog.
 * Priority:
 *  1. Exact catalogue number match (case-insensitive trim)
 *  2. Description + Make match (case-insensitive trim)
 */
export function matchRow(row: BomInputRow, catalog: CatalogEntry[]): PricedBomRow {
  let matched: CatalogEntry | undefined;
  let matchStatus: MatchStatus = "not_found";

  // Check 1 — Catalogue Number
  const catNo = row.catalogNumber?.trim().toLowerCase();
  if (catNo) {
    matched = catalog.find(
      (c) => c.catalogNumber?.trim().toLowerCase() === catNo
    );
    if (matched) matchStatus = "matched_catalog";
  }

  // Check 2 — Description + Make
  if (!matched) {
    const desc = row.description.trim().toLowerCase();
    const make = row.make.trim().toLowerCase();
    matched = catalog.find(
      (c) =>
        c.description.trim().toLowerCase() === desc &&
        c.make.trim().toLowerCase() === make
    );
    if (matched) matchStatus = "matched_description";
  }

  if (!matched) {
    // Failsafe: preserve whatever catalog number came from the uploaded file.
    // Do NOT overwrite it with null just because the DB lookup found nothing.
    const inputCatNo = row.catalogNumber ?? null;
    return {
      ...row,
      catalogNumber:        inputCatNo,   // keep input value
      matchedCatalogNumber: inputCatNo,   // display the same upstream value
      listPrice:       null,
      discountPercent: null,
      discountedRate:  null,
      netAmount:       null,
      category:        null,
      matchStatus:     "not_found",
      dbEntryId:       null,
    };
  }

  const discountedRate = computeNetPrice(matched.listPrice, matched.discountPercent);
  const netAmount = parseFloat((discountedRate * row.qty).toFixed(4));

  return {
    ...row,
    // Auto-enrich: inject catalog number if missing from input
    catalogNumber: row.catalogNumber || matched.catalogNumber,
    matchedCatalogNumber: matched.catalogNumber,
    listPrice: matched.listPrice,
    discountPercent: matched.discountPercent,
    discountedRate,
    netAmount,
    category: matched.category,
    matchStatus,
    dbEntryId: matched.id,
  };
}

/**
 * Process all BOM rows against the catalog.
 */
export function processBom(rows: BomInputRow[], catalog: CatalogEntry[]): PricedBomRow[] {
  return rows.map((row) => matchRow(row, catalog));
}
