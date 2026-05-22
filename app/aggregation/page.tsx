"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { PageTransition } from "@/components/PageTransition";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AggregatedRow {
  srNo: number;
  description: string;
  make: string;
  catalogNumber: string;
  totalQty: number;
  unit: string;
  sourceCount: number;
}

interface Summary {
  aggregatedRows: number;
  originalRows: number;
  reduction: number;
}

type SortCol  = keyof AggregatedRow | null;
type SortDir  = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 4, flexShrink: 0, verticalAlign: "middle" }}>
      <path d="M5 1L2 4h6L5 1z" fill={active && dir === "asc"  ? "var(--cyan)" : "var(--border-2)"} />
      <path d="M5 9L2 6h6L5 9z" fill={active && dir === "desc" ? "var(--cyan)" : "var(--border-2)"} />
    </svg>
  );
}

const AGG_COLS: Array<{ key: keyof AggregatedRow; label: string; cls: string; align?: "center" | "right"; width: number; truncate?: boolean }> = [
  { key: "description",   label: "Description",   cls: "agg-col-desc", width: 300, truncate: true },
  { key: "make",          label: "Make",           cls: "agg-col-make", width: 150, truncate: true },
  { key: "catalogNumber", label: "Catalogue No.",  cls: "agg-col-catno", width: 150, truncate: true },
  { key: "totalQty",      label: "Total Qty",      cls: "agg-col-qty", align: "center", width: 100 },
  { key: "unit",          label: "Unit",           cls: "agg-col-unit", align: "center", width: 100 },
  { key: "sourceCount",   label: "Merged",         cls: "agg-col-src", align: "right", width: 120 },
];

// Columns that use a <select> combo-box filter (exact match)
const AGG_SELECT_COLS = new Set<keyof AggregatedRow>(["make", "catalogNumber", "unit"]);

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AggregationPage() {
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [rows,      setRows]      = useState<AggregatedRow[] | null>(null);
  const [summary,   setSummary]   = useState<Summary | null>(null);
  const [fileName,  setFileName]  = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Sort & filter state ───────────────────────────────────────────────────
  const [sortCol,    setSortCol]    = useState<SortCol>(null);
  const [sortDir,    setSortDir]    = useState<SortDir>("asc");
  const [colFilters, setColFilters] = useState<Partial<Record<keyof AggregatedRow, string>>>({});

  const handleSort = (col: keyof AggregatedRow) => {
    if (sortCol === col) { setSortDir((d) => (d === "asc" ? "desc" : "asc")); }
    else { setSortCol(col); setSortDir("asc"); }
  };
  const setColFilter = (col: keyof AggregatedRow, val: string) =>
    setColFilters((prev) => ({ ...prev, [col]: val }));
  const hasActivity = Object.values(colFilters).some(Boolean) || sortCol !== null;
  const clearFilters = () => { setColFilters({}); setSortCol(null); };

  // ── Unique option lists — derived from raw (unfiltered) rows ──
  const uniqueMakes    = useMemo(() => Array.from(new Set((rows ?? []).map(r => r.make).filter(Boolean))).sort(), [rows]);
  const uniqueCatNos   = useMemo(() => Array.from(new Set((rows ?? []).map(r => r.catalogNumber).filter(Boolean))).sort(), [rows]);
  const uniqueUnits    = useMemo(() => Array.from(new Set((rows ?? []).map(r => r.unit).filter(Boolean))).sort(), [rows]);

  const aggColOptions: Partial<Record<keyof AggregatedRow, string[]>> = {
    make:          uniqueMakes,
    catalogNumber: uniqueCatNos,
    unit:          uniqueUnits,
  };

  // ── Derived view: filter → sort ───────────────────────────────────────────
  const displayed = useMemo(() => {
    if (!rows) return [];
    let result = rows.filter((row) =>
      Object.entries(colFilters).every(([col, term]) => {
        if (!term) return true;
        const key = col as keyof AggregatedRow;
        const val = String(row[key] ?? "");
        if (AGG_SELECT_COLS.has(key)) return val === term;          // exact
        return val.toLowerCase().includes(term.toLowerCase());      // substring
      })
    );
    if (sortCol) {
      result = [...result].sort((a, b) => {
        const av = a[sortCol] ?? "";
        const bv = b[sortCol] ?? "";
        let cmp = 0;
        if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
        else cmp = String(av).toLowerCase().localeCompare(String(bv).toLowerCase());
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [rows, colFilters, sortCol, sortDir]);

  // ── Upload handler ────────────────────────────────────────────────────────

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setRows(null);
    setSummary(null);
    setFileName(file.name);
    setUploading(true);
    setColFilters({});
    setSortCol(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/bom/aggregate", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Unknown error"); return; }
      setRows(json.rows);
      setSummary(json.summary);
    } catch {
      setError("Network error — could not reach the server.");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault(); setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile]
  );

  // ── Export (uses current filtered+sorted view) ────────────────────────────

  const handleExport = useCallback(() => {
    if (!displayed.length) return;
    const exportData = displayed.map((r) => ({
      "Sr. No.":       r.srNo,
      "Description":   r.description,
      "Make":          r.make,
      "Catalogue No.": r.catalogNumber,
      "Total Qty":     r.totalQty,
      "Unit":          r.unit,
      "Source Rows":   r.sourceCount,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws["!cols"] = [ {wch:8},{wch:48},{wch:20},{wch:22},{wch:10},{wch:8},{wch:12} ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Consolidated BOM");
    XLSX.writeFile(wb, fileName.replace(/\.[^.]+$/, "") + "_consolidated.xlsx");
  }, [displayed, fileName]);

  const reset = () => {
    setRows(null); setSummary(null); setError(null);
    setFileName(""); setColFilters({}); setSortCol(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <PageTransition>
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>

      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 8 }}>
          <span className="gradient-text">BOM Aggregation</span>
        </h1>
        <p style={{ color: "var(--text-dim)", maxWidth: 620, lineHeight: 1.7 }}>
          Upload a multi-panel BOM file. Identical materials (matched by Description,
          Make, and Catalogue No.) are consolidated into a single procurement line with
          summed quantities.
        </p>
      </div>

      {/* Drop zone */}
      {!rows && (
        <div
          id="agg-dropzone"
          className={`agg-dropzone${dragging ? " agg-dropzone--active" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv"
            style={{ display: "none" }} onChange={handleFileInput} />

          {uploading ? (
            <>
              <span className="animate-spin agg-icon">⟳</span>
              <p className="agg-drop-title">Processing…</p>
              <p className="agg-drop-sub">Parsing and aggregating BOM rows</p>
            </>
          ) : (
            <>
              <svg className="agg-icon-svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="10" fill="rgba(0,212,255,0.06)" stroke="rgba(0,212,255,0.2)" strokeWidth="1.5"/>
                <path d="M20 26V14M14 20l6-6 6 6" stroke="var(--cyan)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13 28h14" stroke="var(--cyan)" strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>
              </svg>
              <p className="agg-drop-title">Drop BOM Excel file here</p>
              <p className="agg-drop-sub">.xlsx · .xls · .csv — multi-panel files supported</p>
              <div className="agg-col-hint">
                Required columns: <strong>Description</strong> · <strong>Make</strong>
                <span style={{ color: "var(--text-muted)" }}> · Optional: Catalogue No., Qty, Unit</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="agg-error">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{flexShrink:0}}>
            <circle cx="7" cy="7" r="6" stroke="var(--error)" strokeWidth="1.4"/>
            <path d="M7 4v3.5M7 9.5v.5" stroke="var(--error)" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          {error}
          <button className="btn btn-sm btn-ghost" style={{marginLeft:"auto"}} onClick={reset}>
            Try Again
          </button>
        </div>
      )}

      {/* Results */}
      {rows && summary && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Stat bar */}
          <div className="agg-stat-bar">
            <div className="stat-card">
              <div className="stat-label">Consolidated Lines</div>
              <div className="stat-value">{summary.aggregatedRows}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Original Rows</div>
              <div className="stat-value" style={{color:"var(--text-dim)"}}>{summary.originalRows}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Rows Merged</div>
              <div className="stat-value" style={{color: summary.reduction > 0 ? "var(--success)" : "var(--text-muted)"}}>
                {summary.reduction}
              </div>
              <div className="stat-sub">
                {summary.originalRows > 0
                  ? `${Math.round((summary.reduction / summary.originalRows) * 100)}% reduction`
                  : ""}
              </div>
            </div>
            <div className="stat-card" style={{flexGrow:1}}>
              <div className="stat-label">Source File</div>
              <div style={{
                fontFamily:"var(--font-mono)", fontSize:12, color:"var(--cyan)",
                marginTop:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"
              }}>
                {fileName}
              </div>
            </div>

            {/* Controls */}
            <div style={{display:"flex", gap:8, alignItems:"center", marginLeft:"auto"}}>
              {hasActivity && (
                <button className="btn btn-ghost btn-sm" onClick={clearFilters} title="Clear filters and sort">
                  ✕ Clear
                </button>
              )}
              <span style={{fontSize:12, color:"var(--text-muted)", whiteSpace:"nowrap"}}>
                {displayed.length} / {rows.length} rows
              </span>
              <button id="btn-export-consolidated" className="btn btn-primary" onClick={handleExport}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 11h10M7 2v7M4.5 6.5L7 9l2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Export Consolidated BOM
              </button>
              <button id="btn-agg-reset" className="btn btn-ghost" onClick={reset}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7a5 5 0 105-5H4M4 2L2 4l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                New File
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="table-wrap">
            <table id="agg-result-table" className="table-fixed w-full border-collapse" style={{ width: "100%", minWidth: 970, tableLayout: "fixed", borderCollapse: "collapse" }}>
              <colgroup>
                <col style={{ width: 50 }} />
                <col style={{ width: 300 }} />
                <col style={{ width: 150 }} />
                <col style={{ width: 150 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 120 }} />
              </colgroup>
              <thead>
                {/* Sort header row */}
                <tr>
                  <th style={{ width: 50, minWidth: 50, maxWidth: 50, textAlign: "center" }}>#</th>
                  {AGG_COLS.map(({ key, label, cls, align, width, truncate }) => (
                    <th
                      key={key}
                      className={`${cls} agg-th-sort`}
                      style={{
                        textAlign: align,
                        width, minWidth: width, maxWidth: width,
                        ...(truncate ? { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } : {})
                      }}
                      onClick={() => handleSort(key)}
                      title={`Sort by ${label}`}
                    >
                      <span className="agg-th-inner">
                        {label}
                        <SortIcon active={sortCol === key} dir={sortDir} />
                      </span>
                    </th>
                  ))}
                </tr>

                {/* Column filter row */}
                <tr className="agg-filter-row">
                  <td style={{ width: 50, minWidth: 50, maxWidth: 50 }}>&nbsp;</td>
                  {AGG_COLS.map(({ key, width }) => (
                    <td key={key} style={{ width, minWidth: width, maxWidth: width }}>
                      {AGG_SELECT_COLS.has(key) ? (
                        <select
                          className="agg-filter-select"
                          value={colFilters[key] ?? ""}
                          onChange={(e) => setColFilter(key, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">All</option>
                          {(aggColOptions[key] ?? []).map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="agg-filter-input"
                          type="text"
                          placeholder="…"
                          value={colFilters[key] ?? ""}
                          onChange={(e) => setColFilter(key, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{textAlign:"center", padding:"32px", color:"var(--text-muted)"}}>
                      No rows match the current filters.
                    </td>
                  </tr>
                )}
                {displayed.map((row) => (
                  <tr key={row.srNo} className={row.sourceCount > 1 ? "agg-row-merged" : ""}>
                    <td className="td-muted" style={{textAlign:"center", fontSize:11}}>{row.srNo}</td>
                    <td className="agg-col-desc" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.description}>{row.description}</td>
                    <td className="agg-col-make" style={{color:"var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}} title={row.make}>{row.make || "—"}</td>
                    <td className="agg-col-catno" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <span style={{fontFamily:"var(--font-mono)", fontSize:12, color:"var(--cyan)"}} title={row.catalogNumber || ""}>
                        {row.catalogNumber || "—"}
                      </span>
                    </td>
                    <td className="agg-col-qty">
                      <span style={{
                        fontFamily:"var(--font-mono)", fontWeight:700, fontSize:13,
                        color: row.sourceCount > 1 ? "var(--success)" : "var(--text)"
                      }}>
                        {row.totalQty % 1 === 0 ? row.totalQty : row.totalQty.toFixed(2)}
                      </span>
                    </td>
                    <td className="agg-col-unit" style={{color:"var(--text-dim)", fontSize:12}}>{row.unit || "—"}</td>
                    <td className="agg-col-src" style={{textAlign:"center"}}>
                      {row.sourceCount > 1
                        ? <span className="badge badge-cyan">{row.sourceCount} rows</span>
                        : <span className="badge badge-muted">1 row</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scoped styles */}
      <style>{`
        .agg-dropzone {
          border: 2px dashed var(--border-2); border-radius: var(--radius-xl);
          background: var(--surface); padding: 64px 40px;
          display: flex; flex-direction: column; align-items: center; gap: 14px;
          cursor: pointer; transition: border-color 0.2s, background 0.2s;
          text-align: center; user-select: none;
        }
        .agg-dropzone:hover, .agg-dropzone--active {
          border-color: var(--cyan); background: rgba(0,212,255,0.03);
        }
        .agg-icon { font-size: 32px; color: var(--cyan); }
        .agg-icon-svg { flex-shrink: 0; }
        .agg-drop-title { font-size: 1.1rem; font-weight: 700; color: var(--text); }
        .agg-drop-sub   { font-size: 13px; color: var(--text-muted); }
        .agg-col-hint {
          margin-top: 6px; background: var(--surface-2); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 7px 16px; font-size: 12px; color: var(--text-dim);
        }
        .agg-error {
          display: flex; align-items: center; gap: 10px;
          background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.25);
          border-radius: var(--radius); padding: 12px 16px; font-size: 13px; color: var(--error);
        }
        .agg-stat-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

        /* Column widths handled by layout fixed and inline styles */

        /* Sortable headers */
        .agg-th-sort { cursor: pointer; user-select: none; }
        .agg-th-sort:hover { color: var(--cyan); }
        .agg-th-inner { display: inline-flex; align-items: center; gap: 2px; }

        /* Filter row */
        .agg-filter-row td {
          padding: 3px 4px;
          background: var(--surface-3);
          border-bottom: 1px solid var(--border);
        }
        /* shared base */
        .agg-filter-input,
        .agg-filter-select {
          width: 100%; background: transparent;
          border: 1px solid transparent; border-radius: 4px;
          color: var(--text); font-family: var(--font-sans);
          font-size: 11px; padding: 2px 5px; outline: none;
          transition: border-color 0.15s, background 0.15s;
          box-sizing: border-box;
        }
        .agg-filter-input:focus,
        .agg-filter-select:focus {
          border-color: var(--cyan); background: var(--surface-2);
          box-shadow: 0 0 0 2px rgba(0,212,255,0.08);
        }
        .agg-filter-input::placeholder { color: var(--border-2); }
        /* select-specific */
        .agg-filter-select {
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 5px center;
          padding-right: 20px;
        }
        .agg-filter-select option {
          background: var(--surface);
          color: var(--text);
        }

        /* Merged row highlight */
        .agg-row-merged td:first-child { border-left: 3px solid var(--cyan); }
      `}</style>
    </div>
    </PageTransition>
  );
}
