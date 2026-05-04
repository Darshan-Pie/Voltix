import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AggregatedRow {
  srNo: number;
  description: string;
  make: string;
  catalogNumber: string;
  totalQty: number;
  unit: string;
  sourceCount: number; // how many raw rows were merged into this one
}

// ─── Column aliases (mirrors route.ts — kept in sync manually) ─────────────────

const COL_ALIASES: Record<string, string[]> = {
  srNo: [
    "sr. no.", "sr.no.", "sr no", "srno", "s.no.", "s.no", "sno",
    "#", "sl no", "sl.no.", "sl. no.", "serial no", "serial no.", "serial number",
  ],
  description: [
    "item descripiton", "item description", "description", "desc",
    "item desc", "component", "component description", "name",
    "particulars", "material description", "product description",
  ],
  qty: [
    "qty", "qty.", "quantity", "nos", "nos.", "no.", "count",
    "number", "numbers", "pcs", "pieces",
  ],
  unit: ["unit", "uom", "units", "unit of measure"],
  make: ["make", "brand", "manufacturer", "mfr", "vendor", "make / brand", "make/brand"],
  catalogNumber: [
    "type",
    "catalogue no.", "catalogue no", "catalog no.", "catalog no",
    "cat no", "cat. no.", "cat.no.",
    "catalogue number", "catalog number",
    "part no", "part no.", "part number",
    "model no", "model no.", "model number",
    "item code", "item no", "item no.", "item number",
    "product code", "product no",
  ],
};

const HEADER_TRIGGERS = [
  "desc", "item", "make", "type", "catalogue", "catalog",
  "qty", "quantity", "particulars", "component", "brand",
];

function normalizeKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function findHeaderRowIdx(rawRows: unknown[][]): number {
  let bestRow = 0;
  let bestScore = 0;
  for (let i = 0; i < Math.min(15, rawRows.length); i++) {
    const cells = rawRows[i].map((c) => normalizeKey(String(c ?? "")));
    const score = cells.reduce((acc, cell) => {
      if (!cell) return acc;
      return acc + HEADER_TRIGGERS.filter((t) => cell.includes(t)).length;
    }, 0);
    if (score > bestScore) { bestScore = score; bestRow = i; }
  }
  return bestRow;
}

function mapHeaders(headerRow: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};

  // Pass 1 — exact alias
  headerRow.forEach((h, idx) => {
    const norm = normalizeKey(h);
    for (const [field, aliases] of Object.entries(COL_ALIASES)) {
      if (!(field in mapping) && aliases.includes(norm)) mapping[field] = idx;
    }
  });

  // Pass 2 — substring fallback
  const SUBSTR: Record<string, string[]> = {
    description: ["desc", "item", "particular", "component"],
    make:        ["make", "brand", "mfr", "manufacturer"],
    qty:         ["qty", "quantity"],
    unit:        ["unit", "uom"],
    catalogNumber: ["type", "cat", "catalogue", "catalog", "part", "model", "code"],
    srNo:        ["sr", "sl", "serial", "s.no"],
  };
  headerRow.forEach((h, idx) => {
    const norm = normalizeKey(h);
    for (const [field, subs] of Object.entries(SUBSTR)) {
      if (!(field in mapping) && subs.some((s) => norm.includes(s))) mapping[field] = idx;
    }
  });

  return mapping;
}

function isTitleLikeRow(row: unknown[]): boolean {
  const nonEmpty = row.filter((c) => {
    const s = String(c ?? "").trim();
    return s !== "" && s !== "0";
  });
  if (nonEmpty.length === 0 || nonEmpty.length > 3) return false;
  const firstText = String(nonEmpty[0]).trim();
  return firstText.length > 4 && /[a-zA-Z]/.test(firstText);
}

// ─── POST /api/bom/aggregate ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload .xlsx, .xls, or .csv" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rawRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1, defval: null, blankrows: false,
    });

    if (rawRows.length < 1) {
      return NextResponse.json({ error: "File appears to be empty." }, { status: 400 });
    }

    const headerRowIdx = findHeaderRowIdx(rawRows);
    const headerRow = rawRows[headerRowIdx].map((c) => String(c ?? ""));
    const colMap = mapHeaders(headerRow);

    if (!("description" in colMap)) {
      const detected = headerRow.filter((h) => h.trim()).map((h) => `"${h}"`).join(", ");
      return NextResponse.json(
        {
          error: `Could not find a Description column. Detected headers: ${detected || "(none)"}.`,
        },
        { status: 400 }
      );
    }

    // ── Parse all data rows ──────────────────────────────────────────────────
    interface RawBomRow {
      description: string;
      make: string;
      catalogNumber: string;
      qty: number;
      unit: string;
    }

    const bomRows: RawBomRow[] = [];

    for (let i = headerRowIdx + 1; i < rawRows.length; i++) {
      const raw = rawRows[i];
      const description = String(raw[colMap.description] ?? "").trim();
      if (!description) {
        if (isTitleLikeRow(raw)) continue; // section title — skip silently
        continue;
      }
      const make          = colMap.make !== undefined ? String(raw[colMap.make] ?? "").trim() : "";
      const catalogNumber = colMap.catalogNumber !== undefined
        ? String(raw[colMap.catalogNumber] ?? "").trim()
        : "";
      const qty  = parseFloat(String(raw[colMap.qty] ?? "1")) || 1;
      const unit = colMap.unit !== undefined ? String(raw[colMap.unit] ?? "").trim() : "";

      bomRows.push({ description, make, catalogNumber, qty, unit });
    }

    if (bomRows.length === 0) {
      return NextResponse.json(
        { error: "No valid component rows found (all description cells are blank)." },
        { status: 400 }
      );
    }

    // ── Aggregate: strict key = Description + Make + CatalogNumber ───────────
    //
    // Strictness is intentional — "3P" and "4P" variants have different catalog
    // numbers and must NOT be merged even if the description base text matches.
    //
    const groupMap = new Map<string, AggregatedRow & { _keyParts: RawBomRow }>();

    bomRows.forEach((row) => {
      // Key is case-insensitive but we preserve original casing of the first seen row
      const key = [
        row.description.toLowerCase(),
        row.make.toLowerCase(),
        row.catalogNumber.toLowerCase(),
      ].join("|||");

      const existing = groupMap.get(key);
      if (existing) {
        existing.totalQty += row.qty;
        existing.sourceCount += 1;
      } else {
        groupMap.set(key, {
          srNo: 0, // assigned below
          description:   row.description,
          make:          row.make,
          catalogNumber: row.catalogNumber,
          totalQty:      row.qty,
          unit:          row.unit,
          sourceCount:   1,
          _keyParts:     row,
        });
      }
    });

    const aggregated: AggregatedRow[] = Array.from(groupMap.values()).map((r, i) => ({
      srNo:          i + 1,
      description:   r.description,
      make:          r.make,
      catalogNumber: r.catalogNumber,
      totalQty:      parseFloat(r.totalQty.toFixed(4)),
      unit:          r.unit,
      sourceCount:   r.sourceCount,
    }));

    return NextResponse.json({
      rows: aggregated,
      summary: {
        aggregatedRows: aggregated.length,
        originalRows:   bomRows.length,
        reduction:      bomRows.length - aggregated.length,
      },
    });
  } catch (err) {
    console.error("[POST /api/bom/aggregate]", err);
    return NextResponse.json(
      { error: "Failed to aggregate BOM file. Check server logs for details." },
      { status: 500 }
    );
  }
}
