"use client";

import { useState, useCallback, useEffect } from "react";

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

export function CatalogTable({ items, onRefresh }: Props) {
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<AddFormState>({
    catalogNumber: "", description: "", make: "",
    category: "", listPrice: "", discountPercent: "0", entryType: "Supply",
  });
  const [addError, setAddError] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterMake, setFilterMake] = useState("");
  const [filterCat, setFilterCat] = useState("");

  // Derived filtered list
  const filtered = items.filter((it) => {
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

  const makes       = Array.from(new Set(items.map((i) => i.make))).sort();
  const categories  = Array.from(new Set(items.map((i) => i.category))).sort();

  // ── Inline edit ──────────────────────────────────────────────────
  const startEdit = (id: string, field: keyof ComponentPrice, currentVal: unknown) => {
    setEditing({ id, field, value: String(currentVal ?? "") });
  };

  const commitEdit = useCallback(async () => {
    if (!editing) return;
    const { id, field, value } = editing;

    const original = items.find((i) => i.id === id);
    if (!original || String(original[field] ?? "") === value) {
      setEditing(null);
      return;
    }

    setSaving(id);
    setEditing(null);

    const body: Record<string, unknown> = { [field]: value };
    await fetch(`/api/catalog/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(null);
    onRefresh();
  }, [editing, items, onRefresh]);

  // ── Delete ───────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this component permanently?")) return;
    setDeleting(id);
    await fetch(`/api/catalog/${id}`, { method: "DELETE" });
    setDeleting(null);
    onRefresh();
  };

  // ── Add new ──────────────────────────────────────────────────────
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
        catalogNumber: addForm.catalogNumber || null,
        description: addForm.description,
        make: addForm.make,
        category: addForm.category,
        listPrice: parseFloat(addForm.listPrice),
        discountPercent: parseFloat(addForm.discountPercent) || 0,
        entryType: addForm.entryType,
      }),
    });
    setAddSaving(false);

    if (!res.ok) {
      const j = await res.json();
      setAddError(j.error || "Failed to add component.");
      return;
    }
    setShowAdd(false);
    setAddForm({ catalogNumber:"", description:"", make:"", category:"", listPrice:"", discountPercent:"0", entryType:"Supply" });
    onRefresh();
  };

  const fmtPrice = (v: number | null) =>
    v == null ? "—" : `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
        <span className="ct-count">{filtered.length} of {items.length} rows</span>
        <button id="btn-add-component" className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add Component
        </button>
      </div>

      {/* ── Table ── */}
      <div className="table-wrap ct-table-wrap">
        <table id="catalog-table">
          <thead>
            <tr>
              <th>Cat. No.</th>
              <th style={{minWidth:220}}>Description</th>
              <th>Make</th>
              <th>Category</th>
              <th style={{textAlign:"right"}}>List Price</th>
              <th style={{textAlign:"right"}}>Disc %</th>
              <th style={{textAlign:"right"}}>Net Price</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{textAlign:"center", padding:"40px", color:"var(--text-muted)"}}>
                  No components found. {items.length === 0 ? "Add your first component →" : "Try clearing filters."}
                </td>
              </tr>
            )}
            {filtered.map((row) => {
              const isSaving = saving === row.id;
              const isDeleting = deleting === row.id;
              return (
                <tr key={row.id} style={{ opacity: isDeleting ? 0.4 : 1, transition: "opacity 0.2s" }}>
                  {/* Cat No */}
                  <td className="td-mono">
                    <EditableCell id={row.id} field="catalogNumber" value={row.catalogNumber || ""} editing={editing} onStart={startEdit} onChange={(v) => setEditing(e => e ? {...e, value: v} : e)} onCommit={commitEdit} placeholder="—" mono />
                  </td>
                  {/* Description */}
                  <td>
                    <EditableCell id={row.id} field="description" value={row.description} editing={editing} onStart={startEdit} onChange={(v) => setEditing(e => e ? {...e, value: v} : e)} onCommit={commitEdit} />
                  </td>
                  {/* Make */}
                  <td>
                    <EditableCell id={row.id} field="make" value={row.make} editing={editing} onStart={startEdit} onChange={(v) => setEditing(e => e ? {...e, value: v} : e)} onCommit={commitEdit} />
                  </td>
                  {/* Category */}
                  <td>
                    <EditableCell id={row.id} field="category" value={row.category} editing={editing} onStart={startEdit} onChange={(v) => setEditing(e => e ? {...e, value: v} : e)} onCommit={commitEdit} />
                  </td>
                  {/* List Price */}
                  <td style={{textAlign:"right"}}>
                    <EditableCell id={row.id} field="listPrice" value={String(row.listPrice)} editing={editing} onStart={startEdit} onChange={(v) => setEditing(e => e ? {...e, value: v} : e)} onCommit={commitEdit} mono align="right" prefix="₹" />
                  </td>
                  {/* Discount % */}
                  <td style={{textAlign:"right"}}>
                    <EditableCell id={row.id} field="discountPercent" value={String(row.discountPercent)} editing={editing} onStart={startEdit} onChange={(v) => setEditing(e => e ? {...e, value: v} : e)} onCommit={commitEdit} mono align="right" suffix="%" />
                  </td>
                  {/* Net Price */}
                  <td style={{textAlign:"right", fontFamily:"var(--font-mono)", fontSize:12, color:"var(--success)"}}>
                    {isSaving ? <span className="animate-pulse" style={{color:"var(--text-muted)"}}>…</span> : fmtPrice(row.netPrice)}
                  </td>
                  {/* Entry Type */}
                  <td>
                    <span className={`badge ${ENTRY_COLORS[row.entryType] || "badge-muted"}`}>{row.entryType}</span>
                  </td>
                  {/* Actions */}
                  <td className="td-actions">
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
                { label:"Description *", key:"description", placeholder:"e.g. Circuit Breaker 16A 3P" },
                { label:"Make *", key:"make", placeholder:"e.g. ABB" },
                { label:"Category *", key:"category", placeholder:"e.g. MCB" },
                { label:"List Price (₹) *", key:"listPrice", placeholder:"e.g. 1850.00", type:"number" },
                { label:"Discount % ", key:"discountPercent", placeholder:"e.g. 30", type:"number" },
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
        .ct-table-wrap { max-height: calc(100vh - 280px); }
        .add-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        .form-field { display: flex; flex-direction: column; gap: 4px; }
        .field-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
        .add-error { color: var(--error); font-size: 12px; margin-bottom: 8px; }
        .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
      `}</style>
    </>
  );
}

// ── Editable Cell ────────────────────────────────────────────────────
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
}

function EditableCell({ id, field, value, editing, onStart, onChange, onCommit, placeholder, mono, align, prefix, suffix }: ECProps) {
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
          if (e.key === "Escape") onChange(value); // revert
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
        fontSize: mono ? 12 : undefined,
        color: mono ? "var(--cyan)" : undefined,
        textAlign: align || "left",
        display: "block",
        cursor: "text",
      }}
    >
      {prefix && <span style={{color:"var(--text-muted)"}}>{prefix}</span>}
      {value || <span style={{color:"var(--text-muted)"}}>{placeholder}</span>}
      {suffix && !value ? null : suffix && <span style={{color:"var(--text-muted)"}}>{suffix}</span>}
      <span className="edit-hint">✎</span>
    </span>
  );
}
