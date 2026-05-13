"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";

// ─── Types ───────────────────────────────────────────────────────────────────

export type MatchStatus = "matched_catalog" | "matched_description" | "not_found";

export interface PricedBomRow {
  srNo: string | number;
  description: string;
  qty: number;
  unit: string;
  make: string;
  catalogNumber?: string | null;
  matchedCatalogNumber: string | null;
  listPrice: number | null;
  discountPercent: number | null;
  discountedRate: number | null;
  netAmount: number | null;
  category: string | null;
  matchStatus: MatchStatus;
  dbEntryId: string | null;
}

/** A section/panel title row captured from the original Excel file. */
export interface TitleRow {
  id: string;
  isTitleRow: true;
  titleText: string;
}

export type BomResultRow = PricedBomRow | TitleRow;

function isTitle(r: BomResultRow): r is TitleRow {
  return (r as TitleRow).isTitleRow === true;
}

interface Summary {
  total: number;
  matched: number;
  unmatched: number;
}

interface Props {
  rows: BomResultRow[];
  summary: Summary;
  fileName: string;
  onReset: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<MatchStatus, { label: string; cls: string }> = {
  matched_catalog:     { label: "Cat. Match",  cls: "badge-success" },
  matched_description: { label: "Desc. Match", cls: "badge-cyan"    },
  not_found:           { label: "Not Found",   cls: "badge-error"   },
};

/** Fields that directly affect math — recalc immediately on every keystroke */
const MATH_FIELDS = new Set<keyof PricedBomRow>(["qty", "listPrice", "discountPercent"]);

// Columns that get a <select> combo-box filter (exact-match); all others get a text <input>
const BRT_SELECT_COLS = new Set<keyof PricedBomRow>(["unit", "make", "category"]);




// ─── Helpers ──────────────────────────────────────────────────────────────────

function recalcRow(row: PricedBomRow): PricedBomRow {
  if (row.listPrice == null || row.discountPercent == null) return row;
  const discountedRate = parseFloat(
    (row.listPrice * (1 - row.discountPercent / 100)).toFixed(4)
  );
  const netAmount = parseFloat((discountedRate * row.qty).toFixed(4));
  return { ...row, discountedRate, netAmount };
}

function fmtINR(v: number | null) {
  if (v == null) return "—";
  return `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function deriveStats(data: BomResultRow[]) {
  const components = data.filter((r): r is PricedBomRow => !isTitle(r));
  const matched = components.filter((r) => r.matchStatus !== "not_found").length;
  return { total: components.length, matched, unmatched: components.length - matched };
}

// ── Sort helpers ─────────────────────────────────────────────────────────────

type BrtSortCol = keyof PricedBomRow | null;
type BrtSortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: BrtSortDir }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 4, flexShrink: 0, verticalAlign: "middle" }}>
      <path d="M5 1L2 4h6L5 1z" fill={active && dir === "asc"  ? "var(--cyan)" : "var(--border-2)"} />
      <path d="M5 9L2 6h6L5 9z" fill={active && dir === "desc" ? "var(--cyan)" : "var(--border-2)"} />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BomResultTable({ rows, summary: initialSummary, fileName, onReset }: Props) {
  // ── Master state: all edits live here ──
  const [bomData, setBomData] = useState<BomResultRow[]>(() => rows);
  const [filter, setFilter] = useState<"all" | MatchStatus>("all");
  const [lookingUp, setLookingUp] = useState<Set<number>>(new Set());
  const [flashingRows, setFlashingRows] = useState<Set<number>>(new Set());

  // ── Sort & column-filter state ──
  const [sortCol,     setSortCol]     = useState<BrtSortCol>(null);
  const [sortDir,     setSortDir]     = useState<BrtSortDir>("asc");
  const [colFilters,  setColFilters]  = useState<Partial<Record<keyof PricedBomRow, string>>>({});

  // Keep bomData in sync if parent re-sends rows (new upload)
  useEffect(() => { setBomData(rows); }, [rows]);

  // ── Derived stats from live state ──
  const stats = deriveStats(bomData);
  const totalNetAmount = bomData.reduce(
    (s, r) => s + (isTitle(r) ? 0 : (r.netAmount ?? 0)),
    0
  );

  // ── Sort / filter helpers ──
  const handleBrtSort = (col: keyof PricedBomRow) => {
    if (sortCol === col) { setSortDir((d) => (d === "asc" ? "desc" : "asc")); }
    else { setSortCol(col); setSortDir("asc"); }
  };
  const setColFilter = (col: keyof PricedBomRow, val: string) =>
    setColFilters((prev) => ({ ...prev, [col]: val }));

  const hasColActivity = Object.values(colFilters).some(Boolean) || sortCol !== null;
  const clearBrtFilters = () => { setColFilters({}); setSortCol(null); };

  // ── Unique option lists — derived from raw (unfiltered) component rows ──
  const rawComponents = useMemo(
    () => bomData.filter((r): r is PricedBomRow => !isTitle(r)),
    [bomData]
  );
  const uniqueUnits      = useMemo(() => Array.from(new Set(rawComponents.map(r => r.unit).filter(Boolean))).sort(), [rawComponents]);
  const uniqueMakes      = useMemo(() => Array.from(new Set(rawComponents.map(r => r.make).filter(Boolean))).sort(), [rawComponents]);
  const uniqueCategories = useMemo(() => Array.from(new Set(rawComponents.map(r => r.category ?? "").filter(Boolean))).sort(), [rawComponents]);

  const brtColOptions: Partial<Record<keyof PricedBomRow, string[]>> = {
    unit:     uniqueUnits,
    make:     uniqueMakes,
    category: uniqueCategories,
  };

  // ── Derived view: status filter → column filters → sort ──
  //
  // When a column filter or sort is active, title rows are omitted
  // (their meaning as section dividers is lost when order changes).
  // updateRow always works on bomData by originalIdx, so editing is unaffected.
  //
  const indexedRows = useMemo(
    () => bomData.map((row, i) => ({ row, originalIdx: i })),
    [bomData]
  );

  const filtered = useMemo(() => {
    // 1) Status dropdown filter
    let base =
      filter === "all"
        ? indexedRows
        : indexedRows.filter(({ row }) => isTitle(row) || row.matchStatus === filter);

    // 2) Column filters — strip title rows when any filter is active
    // SELECT cols → exact match; text cols → case-insensitive substring
    const anyColFilter = Object.values(colFilters).some(Boolean);
    if (anyColFilter) {
      base = base.filter(({ row }) => {
        if (isTitle(row)) return false; // hide section dividers during filtering
        const comp = row as PricedBomRow;
        return Object.entries(colFilters).every(([col, term]) => {
          if (!term) return true;
          const key = col as keyof PricedBomRow;
          const val = String(comp[key] ?? "");
          if (BRT_SELECT_COLS.has(key)) return val === term;          // exact
          return val.toLowerCase().includes(term.toLowerCase());      // substring
        });
      });
    }

    // 3) Sort — also strip title rows to avoid interleaving confusion
    if (sortCol) {
      const compRows  = base.filter(({ row }) => !isTitle(row));
      const titleRows = base.filter(({ row }) =>  isTitle(row));
      compRows.sort((a, b) => {
        const av = (a.row as PricedBomRow)[sortCol] ?? "";
        const bv = (b.row as PricedBomRow)[sortCol] ?? "";
        let cmp = 0;
        if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
        else cmp = String(av).toLowerCase().localeCompare(String(bv).toLowerCase());
        return sortDir === "asc" ? cmp : -cmp;
      });
      // When sorted, title rows are irrelevant — return only sorted component rows
      void titleRows; // suppress unused-var lint
      return compRows;
    }

    return base;
  }, [indexedRows, filter, colFilters, sortCol, sortDir]);

  // ─────────────────────────────────────────────────────────────────────────
  // updateRow — central cell-update handler
  //
  // Propagation hierarchy for listPrice / discountPercent:
  //   STEP 1 — Isolated-item guard (Panel Design/Ade, Busbars): no propagation.
  //   STEP 2 — If the edited row has a catalogNumber, match ALL rows by
  //             catalogNumber (case-insensitive). This is the precise match:
  //             same part, same price, regardless of description wording.
  //   STEP 3 — Fallback: match by description + make (case-insensitive).
  //             Used when no catalog number is present.
  //
  // qty edits remain single-row — quantities legitimately differ per line.
  // ─────────────────────────────────────────────────────────────────────────
  const updateRow = useCallback(
    (idx: number, field: keyof PricedBomRow, rawValue: string) => {
      setBomData((prev) => {
        const next = [...prev];

        if (MATH_FIELDS.has(field)) {
          const num = parseFloat(rawValue);

          if (field === "qty") {
            // ── Qty: single-row, no propagation ──────────────────────────
            if (isTitle(next[idx])) return next;
            const row = { ...(next[idx] as PricedBomRow) };
            row.qty = isNaN(num) ? row.qty : num;
            next[idx] = recalcRow(row);
            return next;
          }

          // ── listPrice / discountPercent ───────────────────────────────
          if (isTitle(next[idx])) return next;
          const edited = next[idx] as PricedBomRow;
          const editedDesc    = edited.description.trim().toLowerCase();
          const editedMake    = edited.make.trim().toLowerCase();
          const editedCatNo   = (edited.matchedCatalogNumber ?? edited.catalogNumber ?? "").trim().toLowerCase();

          // STEP 1 — Isolated-item guard
          //
          // These rows carry per-panel fabrication costs that are intentionally
          // unique. They must NEVER trigger global price propagation regardless
          // of how many rows share a similar description wording.
          //
          // Condition A — Busbar work (always isolated)
          //   descLower contains "busbar"
          //
          // Condition B — ADE fabrication line items (make contains "ade" AND
          //   the description is any known variant of a panel-design entry):
          //   • "panel design"        — standard wording
          //   • "detail perticulars"  — alternate wording (typo preserved)
          //   • "a.d. enterprises"    — company name used as description
          //
          const isIsolated =
            editedDesc.includes("busbar") ||
            (editedMake.includes("ade") && (
              editedDesc.includes("panel design")       ||
              editedDesc.includes("detail perticulars") ||
              editedDesc.includes("a.d. enterprises")
            ));

          if (isIsolated) {
            const row = { ...edited };
            if (field === "listPrice") {
              row.listPrice = isNaN(num) ? null : num;
            } else {
              row.discountPercent = isNaN(num) ? null : Math.min(100, Math.max(0, num));
            }
            next[idx] = recalcRow(row);
            return next;
          }

          // STEP 2 & 3 — determine match strategy
          const useCatNoMatch = editedCatNo.length > 0;

          const updatedIndices: number[] = [];

          for (let i = 0; i < next.length; i++) {
            if (isTitle(next[i])) continue;
            const comp = next[i] as PricedBomRow;

            const compCatNo = (comp.matchedCatalogNumber ?? comp.catalogNumber ?? "").trim().toLowerCase();

            const isMatch = useCatNoMatch
              ? compCatNo === editedCatNo                                    // STEP 2: Cat No match
              : comp.description.trim().toLowerCase() === editedDesc         // STEP 3: Desc match
                && comp.make.trim().toLowerCase() === editedMake;            //         + Make match

            if (i === idx || isMatch) {
              const row = { ...comp };
              if (field === "listPrice") {
                row.listPrice = isNaN(num) ? null : num;
              } else {
                row.discountPercent = isNaN(num) ? null : Math.min(100, Math.max(0, num));
              }
              next[i] = recalcRow(row);
              updatedIndices.push(i);
            }
          }

          // Flash highlight when more than one row was updated
          if (updatedIndices.length > 1) {
            setFlashingRows(new Set(updatedIndices));
            setTimeout(() => setFlashingRows(new Set()), 700);
          }

        } else {
          // ── String fields: single-row update; DB lookup fires onBlur ──
          if (isTitle(next[idx])) return next;
          const row = { ...(next[idx] as PricedBomRow) };
          if (field === "catalogNumber") {
            row.catalogNumber        = rawValue || null;
            row.matchedCatalogNumber = rawValue || null;
          }
          if (field === "description") row.description = rawValue;
          if (field === "make")        row.make        = rawValue;
          if (field === "unit")        row.unit        = rawValue;
          next[idx] = row;
        }

        return next;
      });
    },
    []
  );

  // ─────────────────────────────────────────────────────────────────────────
  // triggerLookup — called onBlur for identity fields (description, make, catalogNumber)
  // Sends the current row to /api/bom/process as a single-row payload, then
  // merges the returned pricing data back into state.
  // ─────────────────────────────────────────────────────────────────────────
  const triggerLookup = useCallback(async (idx: number) => {
    const row = bomData[idx];

    // Skip title rows and rows missing both identity fields
    if (isTitle(row) || (!row.description && !row.catalogNumber)) return;

    setLookingUp((s) => new Set(s).add(idx));

    try {
      // Re-use the existing process endpoint by sending a tiny single-row workbook
      // Instead, call a lighter approach: build a synthetic FormData with a minimal XLSX
      const wb = XLSX.utils.book_new();
      const wsData = [
        ["Sr. No.", "Description", "Qty", "Unit", "Make", "Catalogue No."],
        [
          row.srNo,
          row.description,
          row.qty,
          row.unit,
          row.make,
          row.catalogNumber ?? "",
        ],
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

      const fd = new FormData();
      fd.append("file", blob, "row.xlsx");

      const res = await fetch("/api/bom/process", { method: "POST", body: fd });
      if (!res.ok) return;

      const json: { rows: PricedBomRow[] } = await res.json();
      const priced = json.rows?.[0];
      if (!priced) return;

      // Merge DB-sourced price data back, preserve user-edited qty/unit/description/make
      setBomData((prev) => {
        const next = [...prev];
        next[idx] = {
          ...priced,
          // Preserve user-provided identity & quantity edits
          srNo:        row.srNo,
          description: row.description,
          make:        row.make,
          qty:         row.qty,
          unit:        row.unit,
          catalogNumber: row.catalogNumber,
        };
        // Recalc amounts with the user's current qty
        next[idx] = recalcRow(next[idx]);
        return next;
      });
    } catch {
      // Silent fail — row just stays as-is
    } finally {
      setLookingUp((s) => {
        const n = new Set(s);
        n.delete(idx);
        return n;
      });
    }
  }, [bomData]);

  // ─────────────────────────────────────────────────────────────────────────
  // Export — exports the CURRENT filtered+sorted view (what the user sees)
  // ─────────────────────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const exportRows = filtered.map(({ row }) => {
      // Title rows → single-cell row so panel headings survive the round-trip
      if (isTitle(row)) {
        return {
          "Sr. No.":        row.titleText,
          "Description":    "",
          "Qty":            "",
          "Unit":           "",
          "Make":           "",
          "Catalogue No.":  "",
          "Category":       "",
          "List Price (₹)": "",
          "Discount (%)":   "",
          "Disc. Rate (₹)": "",
          "Net Amount (₹)": "",
          "Match Status":   "",
        };
      }
      return {
        "Sr. No.":        row.srNo,
        "Description":    row.description,
        "Qty":            row.qty,
        "Unit":           row.unit,
        "Make":           row.make,
        "Catalogue No.":  row.matchedCatalogNumber ?? row.catalogNumber ?? "",
        "Category":       row.category ?? "",
        "List Price (₹)": row.listPrice ?? "",
        "Discount (%)":   row.discountPercent ?? "",
        "Disc. Rate (₹)": row.discountedRate ?? "",
        "Net Amount (₹)": row.netAmount ?? "",
        "Match Status":   row.matchStatus,
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    ws["!cols"] = [
      {wch:8},{wch:44},{wch:6},{wch:8},{wch:18},{wch:20},{wch:16},
      {wch:14},{wch:12},{wch:14},{wch:14},{wch:16},
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Priced BOM");
    XLSX.writeFile(wb, fileName.replace(/\.[^.]+$/, "") + "_priced.xlsx");
  }, [filtered, fileName]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="brt-wrapper">

      {/* ── Summary Stats ─────────────────────────────────────────────── */}
      <div className="brt-summary">
        <div className="stat-card">
          <div className="stat-label">Total Rows</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Matched</div>
          <div className="stat-value" style={{ color: "var(--success)" }}>{stats.matched}</div>
          <div className="stat-sub">
            {stats.total ? Math.round((stats.matched / stats.total) * 100) : 0}% hit rate
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Not Found</div>
          <div className="stat-value" style={{ color: stats.unmatched > 0 ? "var(--error)" : "var(--text-muted)" }}>
            {stats.unmatched}
          </div>
        </div>
        <div className="stat-card" style={{ flexGrow: 1 }}>
          <div className="stat-label">Total Net Amount</div>
          <div className="stat-value" style={{ fontSize: "1.4rem", color: "var(--cyan)" }}>
            {fmtINR(totalNetAmount)}
          </div>
        </div>

        {/* Controls */}
        <div className="brt-controls">
          <select
            id="brt-filter"
            className="select"
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
          >
            <option value="all">All Rows ({stats.total})</option>
            <option value="matched_catalog">
              Cat. Match ({bomData.filter((r): r is PricedBomRow => !isTitle(r) && r.matchStatus === "matched_catalog").length})
            </option>
            <option value="matched_description">
              Desc. Match ({bomData.filter((r): r is PricedBomRow => !isTitle(r) && r.matchStatus === "matched_description").length})
            </option>
            <option value="not_found">
              Not Found ({bomData.filter((r): r is PricedBomRow => !isTitle(r) && r.matchStatus === "not_found").length})
            </option>
          </select>
          <button id="btn-export-excel" className="btn btn-primary" onClick={handleExport}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 11h10M7 2v7M4.5 6.5L7 9l2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Export Excel
          </button>
          <button id="btn-reset-bom" className="btn btn-ghost" onClick={onReset}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7a5 5 0 105-5H4M4 2L2 4l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            New BOM
          </button>
          {hasColActivity && (
            <button className="btn btn-ghost btn-sm" onClick={clearBrtFilters} title="Clear column sorts and filters">
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Edit hint banner ─────────────────────────────────────────── */}
      <div className="brt-edit-hint">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{flexShrink:0}}>
          <path d="M9 2l2 2-6 6H3V8l6-6z" stroke="var(--cyan)" strokeWidth="1.3" strokeLinejoin="round"/>
        </svg>
        All cells are editable. Editing <strong>Qty, List Price, Disc%</strong> recalculates instantly.
        Editing <strong>Description, Make, or Cat. No.</strong> re-looks up the catalog on blur.
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="table-wrap brt-table-wrap">
        <table id="bom-result-table">
          <thead>
            {/* ── Sort header row ── */}
            <tr>
              <th style={{width:36}}>#</th>
              {([
                ["description",   "Description",  "col-desc"],
                ["qty",           "Qty",           "col-num" ],
                ["unit",          "Unit",          "col-unit"],
                ["make",          "Make",          "col-make"],
                ["matchedCatalogNumber", "Cat. No.", "col-catno"],
                ["category",      "Category",     "col-cat" ],
                ["listPrice",     "List Price",    "col-num" ],
                ["discountPercent","Disc %",       "col-num" ],
                ["discountedRate", "Disc. Rate",   "col-num" ],
                ["netAmount",     "Net Amount",    "col-num" ],
              ] as [keyof PricedBomRow, string, string][]).map(([col, label, cls]) => (
                <th
                  key={col}
                  className={`${cls} brt-th-sort`}
                  onClick={() => handleBrtSort(col)}
                  title={`Sort by ${label}`}
                >
                  <span className="brt-th-inner">
                    {label}
                    <SortIcon active={sortCol === col} dir={sortDir} />
                  </span>
                </th>
              ))}
              <th>Status</th>
            </tr>

            {/* ── Column filter row ── */}
            <tr className="brt-filter-row">
              <td />{/* # */}
              {([
                "description", "qty", "unit", "make",
                "matchedCatalogNumber", "category",
                "listPrice", "discountPercent", "discountedRate", "netAmount",
              ] as (keyof PricedBomRow)[]).map((col) => (
                <td key={col}>
                  {BRT_SELECT_COLS.has(col) ? (
                    <select
                      className="brt-filter-select"
                      value={colFilters[col] ?? ""}
                      onChange={(e) => setColFilter(col, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">All</option>
                      {(brtColOptions[col] ?? []).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="brt-filter-input"
                      type="text"
                      placeholder="…"
                      value={colFilters[col] ?? ""}
                      onChange={(e) => setColFilter(col, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </td>
              ))}
              <td />{/* Status */}
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ row, originalIdx }) => {
              // ── Panel title / section divider ────────────────────────────
              if (isTitle(row)) {
                return (
                  <tr
                    key={row.id}
                    className="brt-row-title row-cascade"
                    style={{ animationDelay: `${Math.min(filtered.indexOf({ row, originalIdx }), 0) * 30}ms` }}
                  >
                    <td colSpan={12} className="brt-title-cell">
                      <span className="brt-title-icon">▸</span>
                      {row.titleText}
                    </td>
                  </tr>
                );
              }

              // ── Normal component row ─────────────────────────────────────
              const isUnmatched = row.matchStatus === "not_found";
              const isLooking   = lookingUp.has(originalIdx);
              return (
                <tr
                  key={originalIdx}
                  className={[
                    "row-cascade",
                    isUnmatched ? "brt-row-unmatched" : "",
                    flashingRows.has(originalIdx) ? "brt-row-flash" : "",
                  ].join(" ").trim()}
                  style={{
                    position: "relative",
                    animationDelay: `${Math.min(originalIdx * 28, 800)}ms`,
                  }}
                >
                  {/* Sr. No — read-only */}
                  <td className="td-muted brt-td-srno">{row.srNo}</td>

                  {/* Description — text, lookup on blur */}
                  <td className="col-desc">
                    <BrtInput
                      id={`cell-${originalIdx}-desc`}
                      type="text"
                      value={row.description}
                      onChange={(v) => updateRow(originalIdx, "description", v)}
                      onBlur={() => triggerLookup(originalIdx)}
                      loading={isLooking}
                    />
                  </td>

                  {/* Qty — number, math on change */}
                  <td className="col-num">
                    <BrtInput
                      id={`cell-${originalIdx}-qty`}
                      type="number"
                      value={String(row.qty)}
                      onChange={(v) => updateRow(originalIdx, "qty", v)}
                      align="right"
                      mono
                    />
                  </td>

                  {/* Unit — text, no lookup */}
                  <td className="col-unit">
                    <BrtInput
                      id={`cell-${originalIdx}-unit`}
                      type="text"
                      value={row.unit}
                      onChange={(v) => updateRow(originalIdx, "unit", v)}
                      placeholder="—"
                    />
                  </td>

                  {/* Make — text, lookup on blur */}
                  <td className="col-make">
                    <BrtInput
                      id={`cell-${originalIdx}-make`}
                      type="text"
                      value={row.make}
                      onChange={(v) => updateRow(originalIdx, "make", v)}
                      onBlur={() => triggerLookup(originalIdx)}
                      loading={isLooking}
                    />
                  </td>

                  {/* Cat. No. — text, lookup on blur */}
                  <td className="col-catno">
                    <BrtInput
                      id={`cell-${originalIdx}-catno`}
                      type="text"
                      value={row.matchedCatalogNumber ?? row.catalogNumber ?? ""}
                      onChange={(v) => updateRow(originalIdx, "catalogNumber", v)}
                      onBlur={() => triggerLookup(originalIdx)}
                      loading={isLooking}
                      mono
                      placeholder="—"
                    />
                  </td>

                  {/* Category — read-only (set by DB lookup) */}
                  <td className="col-cat td-muted">{row.category || "—"}</td>

                  {/* List Price — number, math on change */}
                  <td className="col-num">
                    <BrtInput
                      id={`cell-${originalIdx}-listprice`}
                      type="number"
                      value={row.listPrice != null ? String(row.listPrice) : ""}
                      onChange={(v) => updateRow(originalIdx, "listPrice", v)}
                      placeholder="—"
                      align="right"
                      mono
                      prefix="₹"
                    />
                  </td>

                  {/* Discount % — number, math on change */}
                  <td className="col-num">
                    <BrtInput
                      id={`cell-${originalIdx}-disc`}
                      type="number"
                      value={row.discountPercent != null ? String(row.discountPercent) : ""}
                      onChange={(v) => updateRow(originalIdx, "discountPercent", v)}
                      placeholder="—"
                      align="right"
                      mono
                      suffix="%"
                      style={{ color: "var(--warning)" }}
                    />
                  </td>

                  {/* Discounted Rate — computed, read-only */}
                  <td className="col-num" style={{ fontFamily: "var(--font-mono)", fontSize: 12, textAlign: "right" }}>
                    {isLooking
                      ? <span className="animate-pulse" style={{color:"var(--text-muted)"}}>…</span>
                      : fmtINR(row.discountedRate)}
                  </td>

                  {/* Net Amount — computed, read-only */}
                  <td
                    className="col-num"
                    style={{
                      fontFamily: "var(--font-mono)", fontSize: 12, textAlign: "right",
                      color: isUnmatched ? "var(--text-muted)" : "var(--success)",
                      fontWeight: isUnmatched ? undefined : 600,
                    }}
                  >
                    {isLooking
                      ? <span className="animate-pulse" style={{color:"var(--text-muted)"}}>…</span>
                      : fmtINR(row.netAmount)}
                  </td>

                  {/* Status badge */}
                  <td>
                    {isLooking ? (
                      <span className="badge badge-muted">
                        <span className="animate-spin" style={{fontSize:10}}>⟳</span> Looking…
                      </span>
                    ) : (
                      <span className={`badge ${STATUS_LABELS[row.matchStatus].cls}`}>
                        {STATUS_LABELS[row.matchStatus].label}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        /* ── Wrapper & summary ── */
        .brt-wrapper { display: flex; flex-direction: column; gap: 16px; }
        .brt-summary { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .brt-controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-left: auto; }

        /* ── Edit hint ── */
        .brt-edit-hint {
          display: flex; align-items: center; gap: 8px;
          background: rgba(0,212,255,0.04); border: 1px solid rgba(0,212,255,0.12);
          border-radius: var(--radius); padding: 8px 14px;
          font-size: 12px; color: var(--text-dim);
        }
        .brt-edit-hint strong { color: var(--text); }

        /* ── Table ── */
        .brt-table-wrap { max-height: calc(100vh - 400px); }
        .brt-row-unmatched { background: rgba(239,68,68,0.035); }

        /* ── Sortable headers ── */
        .brt-th-sort { cursor: pointer; user-select: none; }
        .brt-th-sort:hover { color: var(--cyan); }
        .brt-th-inner { display: inline-flex; align-items: center; gap: 2px; }

        /* ── Column filter row ── */
        .brt-filter-row td {
          padding: 3px 4px;
          background: var(--surface-3);
          border-bottom: 1px solid var(--border);
        }
        /* shared base */
        .brt-filter-input,
        .brt-filter-select {
          width: 100%;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 4px;
          color: var(--text);
          font-family: var(--font-sans);
          font-size: 11px;
          padding: 2px 5px;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
          box-sizing: border-box;
        }
        .brt-filter-input:focus,
        .brt-filter-select:focus {
          border-color: var(--cyan);
          background: var(--surface-2);
          box-shadow: 0 0 0 2px rgba(0,212,255,0.08);
        }
        .brt-filter-input::placeholder { color: var(--border-2); }
        /* select-specific */
        .brt-filter-select {
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 5px center;
          padding-right: 20px;
        }
        .brt-filter-select option {
          background: var(--surface);
          color: var(--text);
        }

        /* ── Panel / section title rows ── */
        .brt-row-title {
          background: linear-gradient(90deg, rgba(0,212,255,0.08) 0%, rgba(124,58,237,0.06) 100%);
          border-top: 1px solid rgba(0,212,255,0.25);
          border-bottom: 1px solid rgba(0,212,255,0.10);
        }
        .brt-title-cell {
          padding: 9px 14px !important;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cyan);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .brt-title-icon {
          margin-right: 7px;
          opacity: 0.7;
          font-size: 10px;
        }

        /* ── Propagation flash highlight ── */
        @keyframes brt-flash-pulse {
          0%   { background-color: transparent; }
          25%  { background-color: rgba(0,212,255,0.18); }
          60%  { background-color: rgba(0,212,255,0.10); }
          100% { background-color: transparent; }
        }
        .brt-row-flash {
          animation: brt-flash-pulse 0.7s ease-out forwards;
        }

        /* ── Column widths ── */
        .col-desc  { min-width: 220px; }
        .col-num   { min-width: 100px; }
        .col-unit  { min-width: 64px;  }
        .col-make  { min-width: 120px; }
        .col-catno { min-width: 130px; }
        .col-cat   { min-width: 100px; }

        .brt-td-srno { width: 36px; text-align: center; font-size: 11px; }

        /* ── Cell input ── */
        .brt-cell-wrap { position: relative; }

        .brt-input {
          background: transparent;
          border: 1px solid transparent;
          border-radius: 4px;
          color: var(--text);
          font-family: var(--font-sans);
          font-size: 13px;
          padding: 3px 6px;
          outline: none;
          width: 100%;
          transition: border-color 0.15s, background 0.15s;
          -moz-appearance: textfield;
        }
        .brt-input::-webkit-inner-spin-button,
        .brt-input::-webkit-outer-spin-button { -webkit-appearance: none; }
        .brt-input:hover  { border-color: var(--border-2); }
        .brt-input:focus  {
          border-color: var(--cyan);
          background: rgba(0,212,255,0.05);
          box-shadow: 0 0 0 2px rgba(0,212,255,0.08);
        }
        .brt-input.mono   { font-family: var(--font-mono); font-size: 12px; }
        .brt-input.right  { text-align: right; }
        .brt-input.loading { opacity: 0.4; pointer-events: none; }

        .brt-prefix, .brt-suffix {
          position: absolute; top: 50%; transform: translateY(-50%);
          font-size: 11px; color: var(--text-muted); pointer-events: none;
          font-family: var(--font-mono);
        }
        .brt-prefix { left: 7px; }
        .brt-suffix { right: 7px; }
        .brt-has-prefix .brt-input { padding-left: 16px; }
        .brt-has-suffix .brt-input { padding-right: 20px; }
      `}</style>
    </div>
  );
}

// ─── BrtInput — minimal styled cell input ────────────────────────────────────

interface BrtInputProps {
  id: string;
  type: "text" | "number";
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  align?: "left" | "right";
  mono?: boolean;
  prefix?: string;
  suffix?: string;
  loading?: boolean;
  style?: React.CSSProperties;
}

function BrtInput({
  id, type, value, onChange, onBlur, placeholder,
  align, mono, prefix, suffix, loading, style,
}: BrtInputProps) {
  const hasPrefix = !!prefix;
  const hasSuffix = !!suffix;

  return (
    <div
      className={`brt-cell-wrap ${hasPrefix ? "brt-has-prefix" : ""} ${hasSuffix ? "brt-has-suffix" : ""}`}
    >
      {prefix && <span className="brt-prefix">{prefix}</span>}
      <input
        id={id}
        type={type}
        className={[
          "brt-input",
          mono   ? "mono"    : "",
          align === "right" ? "right" : "",
          loading ? "loading" : "",
        ].join(" ")}
        value={value}
        placeholder={placeholder}
        style={style}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        // Prevent scroll from changing number values
        onWheel={(e) => (e.target as HTMLElement).blur()}
      />
      {suffix && <span className="brt-suffix">{suffix}</span>}
    </div>
  );
}
