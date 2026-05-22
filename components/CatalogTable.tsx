"use client";

import { useState, useCallback, useMemo } from "react";

interface ComponentPrice {
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

interface EditState {
  id: string;
  field: keyof ComponentPrice;
  value: string;
}

interface AddFormState {
  catalogNumber: string;
  description: string;
  make: string;
  category: string;
  listPrice: string;
  discountPercent: string;
  entryType: string;
}

const ENTRY_TYPES = ["Supply", "Labor", "Service", "Other"];

const ENTRY_COLORS: Record<string, string> = {
  Supply:  "badge-cyan",
  Labor:   "badge-violet",
  Service: "badge-warning",
  Other:   "badge-muted",
};

interface Props {
  items: ComponentPrice[];
  onRefresh: () => void;
}

// ── Sort types ───────────────────────────────────────────────────────────────

type SortCol = keyof ComponentPrice | null;
type SortDir = "asc" | "desc";

// Which column keys use a <select> combo box vs a free-text <input>
const SELECT_COLS = new Set<keyof ComponentPrice>(["make", "category", "entryType"]);

const SORTABLE_COLS: Array<{ key: keyof ComponentPrice; label: string; align?: "right" | "center"; width: number; truncate?: boolean }> = [
  { key: "catalogNumber", label: "Cat. No.", width: 150, truncate: true },
  { key: "description",   label: "Description", width: 300, truncate: true },
  { key: "make",          label: "Make", width: 150, truncate: true },
  { key: "category",      label: "Category", width: 150, truncate: true },
  { key: "listPrice",     label: "List Price",  align: "right", width: 120 },
  { key: "discountPercent", label: "Disc %",    align: "right", width: 100 },
  { key: "netPrice",      label: "Net Price",   align: "right", width: 120 },
  { key: "entryType",     label: "Type", align: "center", width: 100 },
];

// ── SortIcon ─────────────────────────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  const color = active ? "var(--cyan)" : "var(--border-2)";
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 4, flexShrink: 0 }}>
      <path d="M5 1L2 4h6L5 1z" fill={active && dir === "asc" ? color : "var(--border-2)"} />
      <path d="M5 9L2 6h6L5 9z" fill={active && dir === "desc" ? color : "var(--border-2)"} />
    </svg>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function CatalogTable({ items, onRefresh }: Props) {
  const [editing,   setEditing]  = useState<EditState | null>(null);
  const [saving,    setSaving]   = useState<string | null>(null);
  const [deleting,  setDeleting] = useState<string | null>(null);
  const [showAdd,   setShowAdd]  = useState(false);
  const [addForm,   setAddForm]  = useState<AddFormState>({
    catalogNumber: "", description: "", make: "",
    category: "", listPrice: "", discountPercent: "0", entryType: "Supply",
  });
  const [addError,  setAddError]  = useState("");
  const [addSaving, setAddSaving] = useState(false);

  // ── Sort & column-filter state ───────────────────────────────────────────
  const [sortCol,  setSortCol]  = useState<SortCol>(null);
  const [sortDir,  setSortDir]  = useState<SortDir>("asc");
  const [colFilters, setColFilters] = useState<Partial<Record<keyof ComponentPrice, string>>>({});

  // Global search still lives in the toolbar
  const [search,     setSearch]     = useState("");
  const [filterMake, setFilterMake] = useState("");
  const [filterCat,  setFilterCat]  = useState("");

  const makes       = useMemo(() => Array.from(new Set(items.map((i) => i.make))).filter(Boolean).sort(), [items]);
  const categories  = useMemo(() => Array.from(new Set(items.map((i) => i.category))).filter(Boolean).sort(), [items]);
  const entryTypes  = useMemo(() => Array.from(new Set(items.map((i) => i.entryType))).filter(Boolean).sort(), [items]);

  // Map each column key → its unique option list (for SELECT_COLS)
  const colOptions: Partial<Record<keyof ComponentPrice, string[]>> = {
    make:      makes,
    category:  categories,
    entryType: entryTypes,
  };

  // ── Derived: filter → sort ───────────────────────────────────────────────
  const displayed = useMemo(() => {
    // 1) Global toolbar filters
    let result = items.filter((it) => {
      const q = search.toLowerCase();
      const matchQ =
        !q ||
        it.description.toLowerCase().includes(q) ||
        (it.catalogNumber?.toLowerCase().includes(q) ?? false) ||
        it.make.toLowerCase().includes(q);
      const matchMake = !filterMake || it.make === filterMake;
      const matchCat  = !filterCat  || it.category === filterCat;
      return matchQ && matchMake && matchCat;
    });

    // 2) Per-column header filters (AND logic)
    // SELECT cols → exact match; text cols → substring match
    result = result.filter((it) =>
      Object.entries(colFilters).every(([col, term]) => {
        if (!term) return true;
        const key = col as keyof ComponentPrice;
        const val = String(it[key] ?? "");
        if (SELECT_COLS.has(key)) return val === term;          // exact
        return val.toLowerCase().includes(term.toLowerCase());  // substring
      })
    );

    // 3) Sort
    if (sortCol) {
      result = [...result].sort((a, b) => {
        const av = a[sortCol] ?? "";
        const bv = b[sortCol] ?? "";
        let cmp = 0;
        if (typeof av === "number" && typeof bv === "number") {
          cmp = av - bv;
        } else {
          cmp = String(av).toLowerCase().localeCompare(String(bv).toLowerCase());
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [items, search, filterMake, filterCat, colFilters, sortCol, sortDir]);

  const handleSort = (col: keyof ComponentPrice) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const setColFilter = (col: keyof ComponentPrice, value: string) => {
    setColFilters((prev) => ({ ...prev, [col]: value }));
  };

  const clearAllFilters = () => {
    setSearch(""); setFilterMake(""); setFilterCat("");
    setColFilters({}); setSortCol(null);
  };
  const hasActiveFilters = search || filterMake || filterCat ||
    Object.values(colFilters).some(Boolean) || sortCol;

  // ── Inline edit ──────────────────────────────────────────────────────────
  const startEdit = (id: string, field: keyof ComponentPrice, currentVal: unknown) => {
    setEditing({ id, field, value: String(currentVal ?? "") });
  };

  const commitEdit = useCallback(async () => {
    if (!editing) return;
    const { id, field, value } = editing;
    const original = items.find((i) => i.id === id);
    if (!original || String(original[field] ?? "") === value) { setEditing(null); return; }
    setSaving(id);
    setEditing(null);
    await fetch(`/api/catalog/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setSaving(null);
    onRefresh();
  }, [editing, items, onRefresh]);

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this component permanently?")) return;
    setDeleting(id);
    await fetch(`/api/catalog/${id}`, { method: "DELETE" });
    setDeleting(null);
    onRefresh();
  };

  // ── Add new ──────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    setAddError("");
    if (!addForm.description || !addForm.make || !addForm.category || !addForm.listPrice || !addForm.entryType) {
      setAddError("All fields except Catalogue No. are required.");
      return;
    }
    setAddSaving(true);
    const res = await fetch("/api/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        catalogNumber:   addForm.catalogNumber || null,
        description:     addForm.description,
        make:            addForm.make,
        category:        addForm.category,
        listPrice:       parseFloat(addForm.listPrice),
        discountPercent: parseFloat(addForm.discountPercent) || 0,
        entryType:       addForm.entryType,
      }),
    });
    setAddSaving(false);
    if (!res.ok) { const j = await res.json(); setAddError(j.error || "Failed to add."); return; }
    setShowAdd(false);
    setAddForm({ catalogNumber:"", description:"", make:"", category:"", listPrice:"", discountPercent:"0", entryType:"Supply" });
    onRefresh();
  };

  const fmtPrice = (v: number | null) =>
    v == null ? "—" : `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Toolbar ── */}
      <div className="ct-toolbar">
        <input
          id="catalog-search"
          className="input"
          placeholder="Search description, make, cat. no…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <select id="catalog-filter-make" className="select" value={filterMake} onChange={(e) => setFilterMake(e.target.value)}>
          <option value="">All Makes</option>
          {makes.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select id="catalog-filter-cat" className="select" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ flexGrow: 1 }} />
        {hasActiveFilters && (
          <button className="btn btn-ghost btn-sm" onClick={clearAllFilters} title="Clear all sorts and filters">
            ✕ Clear
          </button>
        )}
        <span className="ct-count">{displayed.length} of {items.length} rows</span>
        <button id="btn-add-component" className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add Component
        </button>
      </div>

      {/* ── Table ── */}
      <div className="table-wrap ct-table-wrap">
        <table id="catalog-table" className="table-fixed w-full border-collapse" style={{ width: "100%", minWidth: 1290, tableLayout: "fixed", borderCollapse: "collapse" }}>
          <colgroup>
            <col style={{ width: 150 }} />
            <col style={{ width: 300 }} />
            <col style={{ width: 150 }} />
            <col style={{ width: 150 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 100 }} />
          </colgroup>
          <thead>
            {/* ── Sort header row ── */}
            <tr>
              {SORTABLE_COLS.map(({ key, label, align, width, truncate }) => (
                <th
                  key={key}
                  className="ct-th-sortable"
                  style={{
                    textAlign: align,
                    width, minWidth: width, maxWidth: width,
                    ...(truncate ? { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } : {})
                  }}
                  onClick={() => handleSort(key)}
                  title={`Sort by ${label}`}
                >
                  <span className="ct-th-inner">
                    {label}
                    <SortIcon active={sortCol === key} dir={sortDir} />
                  </span>
                </th>
              ))}
              <th style={{ width: 100, minWidth: 100, maxWidth: 100, textAlign: "center" }}>Actions</th>
            </tr>

            {/* ── Column filter row ── */}
            <tr className="ct-filter-row">
              {SORTABLE_COLS.map(({ key, align, width }) => (
                <td key={key} style={{ width, minWidth: width, maxWidth: width }}>
                  {SELECT_COLS.has(key) ? (
                    <select
                      className="ct-filter-select"
                      value={colFilters[key] ?? ""}
                      onChange={(e) => setColFilter(key, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">All</option>
                      {(colOptions[key] ?? []).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="ct-filter-input"
                      type="text"
                      placeholder="Filter…"
                      value={colFilters[key] ?? ""}
                      onChange={(e) => setColFilter(key, e.target.value)}
                      style={{ textAlign: align }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </td>
              ))}
              <td style={{ width: 100, minWidth: 100, maxWidth: 100 }}>&nbsp;</td> {/* actions column */}
            </tr>
          </thead>

          <tbody>
            {displayed.length === 0 && (
              <tr>
                <td colSpan={9} style={{textAlign:"center", padding:"40px", color:"var(--text-muted)"}}>
                  No components found. {items.length === 0 ? "Add your first component →" : "Try clearing filters."}
                </td>
              </tr>
            )}
            {displayed.map((row) => {
              const isSaving   = saving   === row.id;
              const isDeleting = deleting === row.id;
              return (
                <tr key={row.id} style={{ opacity: isDeleting ? 0.4 : 1, transition: "opacity 0.2s" }}>
                  <td className="td-mono">
                    <EditableCell id={row.id} field="catalogNumber" value={row.catalogNumber || ""} editing={editing} onStart={startEdit} onChange={(v) => setEditing(e => e ? {...e, value: v} : e)} onCommit={commitEdit} placeholder="—" mono truncate />
                  </td>
                  <td>
                    <EditableCell id={row.id} field="description" value={row.description} editing={editing} onStart={startEdit} onChange={(v) => setEditing(e => e ? {...e, value: v} : e)} onCommit={commitEdit} truncate />
                  </td>
                  <td>
                    <EditableCell id={row.id} field="make" value={row.make} editing={editing} onStart={startEdit} onChange={(v) => setEditing(e => e ? {...e, value: v} : e)} onCommit={commitEdit} truncate />
                  </td>
                  <td>
                    <EditableCell id={row.id} field="category" value={row.category} editing={editing} onStart={startEdit} onChange={(v) => setEditing(e => e ? {...e, value: v} : e)} onCommit={commitEdit} truncate />
                  </td>
                  <td style={{textAlign:"right"}}>
                    <EditableCell id={row.id} field="listPrice" value={String(row.listPrice)} editing={editing} onStart={startEdit} onChange={(v) => setEditing(e => e ? {...e, value: v} : e)} onCommit={commitEdit} mono align="right" prefix="₹" />
                  </td>
                  <td style={{textAlign:"right"}}>
                    <EditableCell id={row.id} field="discountPercent" value={String(row.discountPercent)} editing={editing} onStart={startEdit} onChange={(v) => setEditing(e => e ? {...e, value: v} : e)} onCommit={commitEdit} mono align="right" suffix="%" />
                  </td>
                  <td style={{textAlign:"right", fontFamily:"var(--font-mono)", fontSize:12, color:"var(--success)"}}>
                    {isSaving ? <span className="animate-pulse" style={{color:"var(--text-muted)"}}>…</span> : fmtPrice(row.netPrice)}
                  </td>
                  <td style={{textAlign:"center"}}>
                    <span className={`badge ${ENTRY_COLORS[row.entryType] || "badge-muted"}`}>{row.entryType}</span>
                  </td>
                  <td className="td-actions" style={{textAlign:"center"}}>
                    <button
                      id={`btn-delete-${row.id}`}
                      className="btn btn-danger btn-sm btn-icon"
                      onClick={() => handleDelete(row.id)}
                      disabled={isDeleting}
                      title="Delete component"
                    >
                      {isDeleting ? (
                        <span className="animate-spin" style={{fontSize:12}}>⟳</span>
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M2 3h9M5 3V2h3v1M4 3v7.5a.5.5 0 00.5.5h4a.5.5 0 00.5-.5V3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Add Modal ── */}
      {showAdd && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="modal" id="modal-add-component">
            <h3 className="modal-title">Add Component to Catalog</h3>
            <p className="modal-desc">Fields marked * are required. Net price auto-computes.</p>
            <div className="add-form-grid">
              {[
                { label:"Catalogue No.", key:"catalogNumber", placeholder:"e.g. ABB-OT16F3" },
                { label:"Description *", key:"description",   placeholder:"e.g. Circuit Breaker 16A 3P" },
                { label:"Make *",        key:"make",          placeholder:"e.g. ABB" },
                { label:"Category *",    key:"category",      placeholder:"e.g. MCB" },
                { label:"List Price (₹) *", key:"listPrice",  placeholder:"e.g. 1850.00", type:"number" },
                { label:"Discount %",    key:"discountPercent", placeholder:"e.g. 30",    type:"number" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key} className="form-field">
                  <label className="field-label">{label}</label>
                  <input
                    id={`add-${key}`}
                    className="input"
                    type={type || "text"}
                    placeholder={placeholder}
                    value={addForm[key as keyof AddFormState]}
                    onChange={(e) => setAddForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="form-field">
                <label className="field-label">Entry Type *</label>
                <select id="add-entryType" className="select" value={addForm.entryType} onChange={(e) => setAddForm(f => ({...f, entryType: e.target.value}))}>
                  {ENTRY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            {addError && <p className="add-error">{addError}</p>}
            <div className="modal-actions">
              <button id="btn-add-cancel" className="btn btn-ghost" onClick={() => { setShowAdd(false); setAddError(""); }}>Cancel</button>
              <button id="btn-add-save" className="btn btn-primary" onClick={handleAdd} disabled={addSaving}>
                {addSaving ? "Saving…" : "Add Component"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ct-toolbar {
          display: flex; align-items: center; gap: 10px;
          flex-wrap: wrap; margin-bottom: 16px;
        }
        .ct-count { font-size: 12px; color: var(--text-muted); }
        .ct-table-wrap { max-height: calc(100vh - 240px); }
        .add-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        .form-field { display: flex; flex-direction: column; gap: 4px; }
        .field-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
        .add-error { color: var(--error); font-size: 12px; margin-bottom: 8px; }
        .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }

        /* ── Sortable header ── */
        .ct-th-sortable {
          cursor: pointer;
          user-select: none;
        }
        .ct-th-sortable:hover { color: var(--cyan); }
        .ct-th-inner {
          display: inline-flex; align-items: center; gap: 2px;
        }

        /* ── Column filter row ── */
        .ct-filter-row td {
          padding: 4px 6px;
          background: var(--surface-3);
          border-bottom: 1px solid var(--border);
        }
        /* shared base for both filter controls */
        .ct-filter-input,
        .ct-filter-select {
          width: 100%;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text);
          font-family: var(--font-sans);
          font-size: 12px;
          padding: 3px 6px;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
          box-sizing: border-box;
        }
        .ct-filter-input:focus,
        .ct-filter-select:focus {
          border-color: var(--cyan);
          background: var(--surface);
          box-shadow: 0 0 0 2px rgba(0,212,255,0.10);
        }
        .ct-filter-input::placeholder { color: var(--text-muted); }
        /* dropdown-specific */
        .ct-filter-select {
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 6px center;
          padding-right: 22px;
        }
        .ct-filter-select option {
          background: var(--surface);
          color: var(--text);
        }
      `}</style>
    </>
  );
}

// ── Editable Cell ─────────────────────────────────────────────────────────────
interface ECProps {
  id: string;
  field: keyof ComponentPrice;
  value: string;
  editing: EditState | null;
  onStart: (id: string, field: keyof ComponentPrice, val: string) => void;
  onChange: (v: string) => void;
  onCommit: () => void;
  placeholder?: string;
  mono?: boolean;
  align?: "left" | "right" | "center";
  prefix?: string;
  suffix?: string;
  truncate?: boolean;
}

function EditableCell({ id, field, value, editing, onStart, onChange, onCommit, placeholder, mono, align, prefix, suffix, truncate }: ECProps) {
  const isEditing = editing?.id === id && editing?.field === field;
  if (isEditing) {
    return (
      <input
        autoFocus
        className="input-inline"
        value={editing.value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => {
          if (e.key === "Enter") onCommit();
          if (e.key === "Escape") onChange(value);
        }}
        style={{ textAlign: align || "left" }}
      />
    );
  }
  return (
    <span
      className="editable-cell"
      title="Click to edit"
      onClick={() => onStart(id, field, value)}
      style={{
        fontFamily: mono ? "var(--font-mono)" : undefined,
        fontSize:   mono ? 12 : undefined,
        color:      mono ? "var(--cyan)" : undefined,
        textAlign:  align || "left",
        display: "block",
        ...(truncate ? { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } : {})
      }}
    >
      {prefix && <span style={{color:"var(--text-muted)"}}>{prefix}</span>}
      {value || <span style={{color:"var(--text-muted)"}}>{placeholder}</span>}
      {suffix && !value ? null : suffix && <span style={{color:"var(--text-muted)"}}>{suffix}</span>}
      <span className="edit-hint">✎</span>
    </span>
  );
}
