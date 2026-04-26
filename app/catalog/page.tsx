"use client";

import { useState, useEffect, useCallback } from "react";
import { CatalogTable } from "@/components/CatalogTable";
import { BulkDiscountModal } from "@/components/BulkDiscountModal";

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

export default function CatalogPage() {
  const [items, setItems] = useState<ComponentPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/catalog");
      if (!res.ok) throw new Error("Failed to fetch catalog");
      const data = await res.json();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCatalog(); }, [fetchCatalog]);

  return (
    <div className="page-catalog">
      {/* Page header */}
      <div className="container page-header">
        <div>
          <div className="page-breadcrumb">Master Catalog</div>
          <h1 className="page-title">Component Price Database</h1>
          <p className="page-sub">
            {loading ? "Loading…" : `${items.length} components · click any cell to edit inline`}
          </p>
        </div>
        <div className="page-actions">
          <button
            id="btn-bulk-discount"
            className="btn btn-violet"
            onClick={() => setShowBulk(true)}
            disabled={items.length === 0}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M7 2v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="4" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="10" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
            Bulk Discount
          </button>
          <button id="btn-refresh-catalog" className="btn btn-ghost" onClick={fetchCatalog} disabled={loading}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={loading ? "animate-spin" : ""}>
              <path d="M2 7a5 5 0 105-5H4M4 2L2 4l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{paddingBottom: 40}}>
        {error ? (
          <div className="error-banner">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{flexShrink:0}}>
              <circle cx="8" cy="8" r="6.5" stroke="var(--error)" strokeWidth="1.5"/>
              <path d="M8 5v4M8 10.5h.01" stroke="var(--error)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {error}
            <button className="btn btn-ghost btn-sm" onClick={fetchCatalog} style={{marginLeft:"auto"}}>Retry</button>
          </div>
        ) : (
          <CatalogTable items={items} onRefresh={fetchCatalog} />
        )}
      </div>

      {/* Bulk Modal */}
      {showBulk && (
        <BulkDiscountModal
          items={items}
          onDone={() => { setShowBulk(false); fetchCatalog(); }}
        />
      )}

      <style>{`
        .page-catalog { padding-top: 8px; }
        .page-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          padding-top: 28px; padding-bottom: 24px; flex-wrap: wrap; gap: 16px;
        }
        .page-breadcrumb {
          font-size: 11px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--cyan); margin-bottom: 4px;
        }
        .page-title { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 4px; }
        .page-sub { font-size: 13px; color: var(--text-muted); }
        .page-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .error-banner {
          display: flex; align-items: center; gap: 10px;
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
          border-radius: var(--radius-lg); padding: 14px 18px;
          color: var(--error); font-size: 13px;
        }

        /* inline edit hint */
        .editable-cell { position: relative; padding-right: 20px; }
        .edit-hint {
          position: absolute; right: 2px; top: 50%; transform: translateY(-50%);
          opacity: 0; font-size: 10px; color: var(--cyan);
          transition: opacity 0.15s;
        }
        .editable-cell:hover .edit-hint { opacity: 0.6; }
      `}</style>
    </div>
  );
}
