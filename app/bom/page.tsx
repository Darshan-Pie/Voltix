"use client";

import { useState, useCallback } from "react";
import { BomDropzone } from "@/components/BomDropzone";
import { BomResultTable, PricedBomRow } from "@/components/BomResultTable";
import { PageTransition } from "@/components/PageTransition";

interface ProcessResponse {
  rows: PricedBomRow[];
  summary: { total: number; matched: number; unmatched: number };
}

export default function BomPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessResponse | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const handleFile = useCallback(async (file: File) => {
    setError("");
    setResult(null);
    setFileName(file.name);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/bom/process", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Processing failed.");
        setLoading(false);
        return;
      }
      setResult(json);
    } catch {
      setError("Network error. Is the dev server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReset = () => {
    setResult(null);
    setFileName("");
    setError("");
  };

  return (
    <PageTransition>
    <div className="page-bom">
      <div className="container page-header">
        <div>
          <div className="page-breadcrumb">BOM Processor</div>
          <h1 className="page-title">Excel BOM Upload &amp; Pricing</h1>
          <p className="page-sub">
            Upload any electrical panel BOM — components are auto-priced against the master catalog.
          </p>
        </div>
      </div>

      <div className="container" style={{paddingBottom:48}}>
        {/* Pipeline steps — always visible, active step follows state */}
        <div className="pipeline">
          {[
            { n:"1", label:"Upload BOM",  sub:"Drop your .xlsx file"          },
            { n:"2", label:"Auto-match",  sub:"Catalog + description lookup"  },
            { n:"3", label:"Review",      sub:"Edit & verify prices"          },
            { n:"4", label:"Export",      sub:"Download enriched Excel"       },
          ].map((s, i) => {
            const activeStep = result ? 3 : loading ? 2 : 1;
            const isActive   = i + 1 === activeStep;
            const isDone     = i + 1 < activeStep;
            return (
              <div key={i} className={`pipeline-step ${isActive ? "pipeline-active" : ""} ${isDone ? "pipeline-done" : ""}`}>
                <div className="pipeline-num">
                  {isDone ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : s.n}
                </div>
                <div>
                  <div className="pipeline-label">{s.label}</div>
                  <div className="pipeline-sub">{s.sub}</div>
                </div>
                {i < 3 && <div className="pipeline-arrow">›</div>}
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="bom-error">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{flexShrink:0}}>
              <circle cx="8" cy="8" r="6.5" stroke="var(--error)" strokeWidth="1.5"/>
              <path d="M8 5v4M8 10.5h.01" stroke="var(--error)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {error}
            <button className="btn btn-ghost btn-sm" onClick={handleReset} style={{marginLeft:"auto"}}>Try Again</button>
          </div>
        )}

        {/* Dropzone or results */}
        {!result ? (
          <BomDropzone onFile={handleFile} loading={loading} fileName={loading ? fileName : undefined} />
        ) : (
          <BomResultTable
            rows={result.rows}
            summary={result.summary}
            fileName={fileName}
            onReset={handleReset}
          />
        )}

        {/* Hint after load */}
        {!result && !loading && !error && (
          <div className="bom-hint">
            <div className="bom-hint-inner">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="var(--cyan)" strokeWidth="1.3"/>
                <path d="M7 6v4M7 4.5h.01" stroke="var(--cyan)" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <span>
                <strong>Tip:</strong> Your BOM file must have at least <code>Description</code> and <code>Make</code> columns.
                Optionally include <code>Catalogue No.</code> for faster exact matching.
                Column names are detected automatically.
              </span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .page-bom { padding-top: 8px; }
        .page-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          padding-top: 28px; padding-bottom: 24px; flex-wrap: wrap; gap: 16px;
        }
        .page-breadcrumb {
          font-size: 11px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--violet); margin-bottom: 4px;
        }
        .page-title { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 4px; }
        .page-sub { font-size: 13px; color: var(--text-muted); }

        .pipeline {
          display: flex; align-items: center; gap: 0;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 16px 20px;
          margin-bottom: 20px; overflow-x: auto;
        }
        .pipeline-step {
          display: flex; align-items: center; gap: 10px;
          flex-shrink: 0; padding: 0 8px; opacity: 0.4;
        }
        .pipeline-active { opacity: 1; }
        .pipeline-done { opacity: 0.75; }
        .pipeline-done .pipeline-num {
          background: var(--success); border-color: var(--success); color: #fff;
        }
        .pipeline-num {
          width: 28px; height: 28px; border-radius: 50%;
          background: var(--surface-3); border: 1px solid var(--border-2);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; font-family: var(--font-mono);
          flex-shrink: 0;
        }
        .pipeline-active .pipeline-num {
          background: linear-gradient(135deg, var(--violet), var(--cyan));
          border: none; color: #fff;
        }
        .pipeline-label { font-size: 13px; font-weight: 600; }
        .pipeline-sub { font-size: 11px; color: var(--text-muted); }
        .pipeline-arrow { font-size: 20px; color: var(--border-2); margin-left: 8px; }

        .bom-error {
          display: flex; align-items: center; gap: 10px;
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
          border-radius: var(--radius-lg); padding: 14px 18px;
          color: var(--error); font-size: 13px; margin-bottom: 16px;
        }
        .bom-hint { margin-top: 16px; }
        .bom-hint-inner {
          display: flex; align-items: flex-start; gap: 8px;
          background: rgba(0,212,255,0.04); border: 1px solid rgba(0,212,255,0.12);
          border-radius: var(--radius); padding: 12px 16px;
          font-size: 12px; color: var(--text-dim); line-height: 1.6;
        }
        .bom-hint-inner code { font-family: var(--font-mono); color: var(--cyan); }
        .bom-hint-inner svg { flex-shrink: 0; margin-top: 2px; }
      `}</style>
    </div>
    </PageTransition>
  );
}
