import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processBom, CatalogEntry, BomInputRow } from "@/lib/pricingEngine";
import * as XLSX from "xlsx";

// ─── Shared types ──────────────────────────────────────────────────────────────

/** A non-component row that carries a section/panel title from the Excel file. */
export interface TitleRow {
  id: string;
  isTitleRow: true;
  titleText: string;
}

// ─── Column alias table ────────────────────────────────────────────────────────
//
// Each entry maps an internal field name → every known header variant.
// Strings are compared after:  .trim().toLowerCase().replace(/\s+/g, " ")
// This means "ITEM  DESCRIPITON" → "item descripiton" → matches the typo alias.
//
const COL_ALIASES: Record<string, string[]> = {
  srNo: [
    "sr. no.", "sr.no.", "sr no", "srno",
    "s.no.", "s.no", "sno", "#", "sl no", "sl.no.", "sl. no.",
    "serial no", "serial no.", "serial number",
  ],
  description: [
    "item descripiton",           // ← intentional typo alias (real-world file)
    "item description",
    "description",
    "desc",
    "item desc",
    "component",
    "component description",
    "name",
    "particulars",
    "material description",
    "product description",
  ],
  qty: [
    "qty", "qty.", "quantity", "nos", "nos.", "no.", "count",
    "number", "numbers", "pcs", "pieces",
  ],
  unit: ["unit", "uom", "units", "unit of measure"],
  make: [
    "make", "brand", "manufacturer", "mfr", "vendor",
    "make / brand", "make/brand",
  ],
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

// ─── Header-row detection ──────────────────────────────────────────────────────
//
// We score every row in the first 15 by counting how many HEADER_TRIGGERS appear
// as substrings across all cells. The highest-scoring row is the header.
// This handles typos ("descripiton" still contains "desc") and sheets where
// a company banner row accidentally contains one trigger word.
//
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
    if (score > bestScore) {
      bestScore = score;
      bestRow = i;
    }
  }

  return bestRow;
}

// ─── Header → column-index mapping ────────────────────────────────────────────
//
// Pass 1 – exact alias match against COL_ALIASES.
// Pass 2 – substring fallback for still-unmapped fields.
//
function mapHeaders(headerRow: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};

  // Pass 1 — exact alias match
  headerRow.forEach((h, idx) => {
    const norm = normalizeKey(h);
    for (const [field, aliases] of Object.entries(COL_ALIASES)) {
      if (!(field in mapping) && aliases.includes(norm)) {
        mapping[field] = idx;
      }
    }
  });

  // Pass 2 — substring fallback
  const SUBSTR_FALLBACKS: Record<string, string[]> = {
    description: ["desc", "item", "particular", "component"],
    make:        ["make", "brand", "mfr", "manufacturer"],
    qty:         ["qty", "quantity"],
    unit:        ["unit", "uom"],
    catalogNumber: ["type", "cat", "catalogue", "catalog", "part", "model", "code"],
    srNo:        ["sr", "sl", "serial", "s.no"],
  };

  headerRow.forEach((h, idx) => {
    const norm = normalizeKey(h);
    for (const [field, substrings] of Object.entries(SUBSTR_FALLBACKS)) {
      if (!(field in mapping) && substrings.some((s) => norm.includes(s))) {
        mapping[field] = idx;
      }
    }
  });

  return mapping;
}

// ─── Title-row detection ───────────────────────────────────────────────────────
//
// A row is treated as a section/panel title if:
//   • It has at most 3 non-empty cells (sparse), AND
//   • None of its cells look like a numeric serial number alone, AND
//   • The first non-empty cell has meaningful text (> 4 chars).
//
// This captures rows like "BOM FOR MAIN PCC PANEL, QTY-1" that appear
// as separators between panels in the same sheet.
//
function isTitleLikeRow(row: unknown[]): boolean {
  const nonEmpty = row.filter((c) => {
    const s = String(c ?? "").trim();
    return s !== "" && s !== "0";
  });
  if (nonEmpty.length === 0 || nonEmpty.length > 3) return false;
  const firstText = String(nonEmpty[0]).trim();
  // Must have meaningful length and contain at least one letter
  return firstText.length > 4 && /[a-zA-Z]/.test(firstText);
}

// ─── POST /api/bom/process ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // ── Auth: require a valid session ────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload .xlsx, .xls, or .csv" },
        { status: 400 }
      );
    }

    // ── Step 1: Read full sheet as array-of-arrays (nulls for empty cells) ──
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rawRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,       // null for empty cells so we can distinguish them
      blankrows: false,
    });

    if (rawRows.length < 1) {
      return NextResponse.json({ error: "File appears to be empty." }, { status: 400 });
    }

    // ── Step 2: Locate header row ──
    const headerRowIdx = findHeaderRowIdx(rawRows);
    const headerRow = rawRows[headerRowIdx].map((c) => String(c ?? ""));
    const colMap = mapHeaders(headerRow);

    // ── Step 3: Validate — only description is required ──
    if (!("description" in colMap)) {
      const detected = headerRow
        .filter((h) => h.trim())
        .map((h) => `"${h}"`)
        .join(", ");
      return NextResponse.json(
        {
          error:
            `Could not find a Description column. ` +
            `Detected headers (row ${headerRowIdx + 1}): ${detected || "(none)"}. ` +
            `Accepted names include: description, item description, item descripiton, desc, particulars, component.`,
        },
        { status: 400 }
      );
    }

    // ── Step 4: Build a unified entry list ───────────────────────────────────
    //
    // We iterate ALL raw rows (not just after the header) to preserve titles.
    //
    // Rows BEFORE the header   → emit as TitleRow if they have content
    // The header row itself    → skip (used only for colMap)
    // Rows AFTER the header    → if sparse & text-like → TitleRow
    //                         → otherwise parse as BomInputRow
    //
    type TitleEntry     = { kind: "title"; row: TitleRow };
    type ComponentEntry = { kind: "component"; bomRow: BomInputRow };
    type Entry          = TitleEntry | ComponentEntry;

    const entries: Entry[] = [];
    let titleCounter = 0;
    let componentCounter = 0;

    for (let i = 0; i < rawRows.length; i++) {
      const raw = rawRows[i];

      // ── Before-header rows ──
      if (i < headerRowIdx) {
        const nonEmpty = raw.filter((c) => c !== null && String(c).trim() !== "");
        if (nonEmpty.length > 0) {
          const text = String(nonEmpty[0]).trim();
          if (text.length > 2) {
            entries.push({
              kind: "title",
              row: { id: `title-${titleCounter++}`, isTitleRow: true, titleText: text },
            });
          }
        }
        continue;
      }

      // ── Header row — skip ──
      if (i === headerRowIdx) continue;

      // ── Data rows ──
      const description = String(raw[colMap.description] ?? "").trim();

      if (!description) {
        // No description — check if this is a section title divider
        if (isTitleLikeRow(raw)) {
          const nonEmpty = raw.filter((c) => c !== null && String(c).trim() !== "");
          const text = String(nonEmpty[0]).trim();
          entries.push({
            kind: "title",
            row: { id: `title-${titleCounter++}`, isTitleRow: true, titleText: text },
          });
        }
        // else: truly blank / totals row — skip silently
        continue;
      }

      // Valid component row
      const make =
        colMap.make !== undefined ? String(raw[colMap.make] ?? "").trim() : "";
      const qty  = parseFloat(String(raw[colMap.qty] ?? "1")) || 1;
      const srNoRaw = colMap.srNo !== undefined ? raw[colMap.srNo] : ++componentCounter;
      const srNo = String(srNoRaw ?? "").trim() || String(++componentCounter);
      const unit =
        colMap.unit !== undefined ? String(raw[colMap.unit] ?? "").trim() : "";
      const catalogNumber =
        colMap.catalogNumber !== undefined
          ? String(raw[colMap.catalogNumber] ?? "").trim() || null
          : null;

      entries.push({ kind: "component", bomRow: { srNo, description, qty, unit, make, catalogNumber } });
    }

    // ── Step 5: Price all component rows in one pass ──
    const bomRowsToPrice = entries
      .filter((e): e is ComponentEntry => e.kind === "component")
      .map((e) => e.bomRow);

    if (bomRowsToPrice.length === 0) {
      return NextResponse.json(
        { error: "No valid component rows found in the file (all description cells are blank)." },
        { status: 400 }
      );
    }

    // ── Step 5a: Build scoped catalog based on user permissions ──────────────
    //
    // Look up the logged-in user's profile so we can check canAccessAdminCatalog.
    // If false  → only their own private catalog items.
    // If true   → their items first (priority), then ADMIN-owned items appended.
    //             The ordering alone implements conflict resolution:
    //             matchRow() stops on first hit, so user-private always wins.
    //
    const userProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { canAccessAdminCatalog: true },
    });

    let catalog: CatalogEntry[];

    if (!userProfile?.canAccessAdminCatalog) {
      // Isolated mode: only the user's own catalog
      catalog = (await prisma.componentPrice.findMany({
        where: { userId: session.user.id },
      })) as CatalogEntry[];
    } else {
      // Shared mode: user's private items first (they win on conflict),
      // then ADMIN-owned items that the user doesn't already own.
      const [userItems, adminItems] = await Promise.all([
        prisma.componentPrice.findMany({
          where: { userId: session.user.id },
        }),
        prisma.componentPrice.findMany({
          where: {
            user: { role: "ADMIN" },
            NOT: { userId: session.user.id },
          },
        }),
      ]);
      // User-private first → they shadow any matching admin entry
      catalog = [...userItems, ...adminItems] as CatalogEntry[];
    }

    const priced  = processBom(bomRowsToPrice, catalog);

    // ── Step 6: Reconstruct interleaved final array ──
    let pricedIdx = 0;
    const finalRows: Array<ReturnType<typeof processBom>[number] | TitleRow> = [];

    for (const entry of entries) {
      if (entry.kind === "title") {
        finalRows.push(entry.row);
      } else {
        finalRows.push(priced[pricedIdx++]);
      }
    }

    const matchedCount = priced.filter((r) => r.matchStatus !== "not_found").length;

    return NextResponse.json({
      rows: finalRows,
      summary: {
        total: priced.length,        // component rows only
        matched: matchedCount,
        unmatched: priced.length - matchedCount,
      },
    });
  } catch (error) {
    console.error("[POST /api/bom/process]", error);
    return NextResponse.json(
      { error: "Failed to process BOM file. Check the server logs for details." },
      { status: 500 }
    );
  }
}
