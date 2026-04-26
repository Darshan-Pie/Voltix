"use client";

import { useState, useEffect } from "react";

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

interface Props {
  items: ComponentPrice[];
  onDone: () => void;
}

export function BulkDiscountModal({ items, onDone }: Props) {
  const [filterMake, setFilterMake] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [discount, setDiscount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const makes      = Array.from(new Set(items.map((i) => i.make))).sort();
  const categories = Array.from(new Set(items.map((i) => i.category))).sort();

  const previewCount = items.filter((it) => {
    const matchM = !filterMake || it.make === filterMake;
    const matchC = !filterCat  || it.category === filterCat;
    return matchM && matchC;
  }).length;

  const handleApply = async () => {
    setError("");
    const d = parseFloat(discount);
    if (isNaN(d) || d < 0 || d > 100) {
      setError("Discount must be between 0 and 100.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/catalog/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        make: filterMake || undefined,
        category: filterCat || undefined,
        discountPercent: d,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json();
      setError(j.error || "Bulk update failed.");
      return;
    }
    onDone();
  };

  return (
    <div
      className="modal-overlay"
      id="bulk-discount-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onDone(); }}
    >
      <div className="modal" id="bulk-discount-modal">
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <div style={{padding:"6px",background:"rgba(124,58,237,0.15)",borderRadius:"8px"}}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 9h12M9 3v12" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="5.5" cy="5.5" r="2" stroke="#a78bfa" strokeWidth="1.5"/>
              <circle cx="12.5" cy="12.5" r="2" stroke="#a78bfa" strokeWidth="1.5"/>
            </svg>
          </div>
          <h3 className="modal-title">Bulk Discount Update</h3>
        </div>
        <p className="modal-desc">
          Select a Make and/or Category to scope the discount, then set the new discount percentage.
          Leave both blank to update all components.
        </p>

        <div className="bulk-form">
          <div className="form-field">
            <label className="field-label">Filter by Make</label>
            <select id="bulk-filter-make" className="select" value={filterMake} onChange={(e) => setFilterMake(e.target.value)}>
              <option value="">All Makes</option>
              {makes.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="field-label">Filter by Category</label>
            <select id="bulk-filter-cat" className="select" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="field-label">New Discount %</label>
            <input
              id="bulk-discount-value"
              className="input"
              type="number"
              min={0}
              max={100}
              step={0.5}
              placeholder="e.g. 32.5"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="bulk-preview">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="var(--cyan)" strokeWidth="1.5"/>
            <path d="M7 6v4M7 4.5h.01" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>
            This will update{" "}
            <strong style={{color:"var(--cyan)"}}>{previewCount}</strong>{" "}
            {previewCount === 1 ? "component" : "components"}.
            Net prices will be recalculated automatically.
          </span>
        </div>

        {error && <p style={{color:"var(--error)",fontSize:12,marginBottom:8}}>{error}</p>}

        <div className="modal-actions">
          <button id="btn-bulk-cancel" className="btn btn-ghost" onClick={onDone} disabled={saving}>
            Cancel
          </button>
          <button
            id="btn-bulk-apply"
            className="btn btn-violet"
            onClick={handleApply}
            disabled={saving || !discount}
          >
            {saving ? (
              <>
                <span className="animate-spin">⟳</span> Applying…
              </>
            ) : (
              <>
                Apply to {previewCount} row{previewCount !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>

        <style>{`
          .bulk-form { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
          .bulk-preview {
            display: flex; align-items: center; gap: 8px;
            background: rgba(0,212,255,0.05); border: 1px solid rgba(0,212,255,0.15);
            border-radius: var(--radius); padding: 10px 14px;
            font-size: 13px; color: var(--text-dim); margin-bottom: 14px;
          }
        `}</style>
      </div>
    </div>
  );
}
