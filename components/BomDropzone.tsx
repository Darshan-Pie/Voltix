"use client";

import { useState, useCallback, useRef } from "react";

interface Props {
  onFile: (file: File) => void;
  loading: boolean;
  fileName?: string;
}

export function BomDropzone({ onFile, loading, fileName }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = ".xlsx,.xls,.csv";

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      id="bom-dropzone"
      className={`dropzone ${dragging ? "dropzone-active" : ""} ${loading ? "dropzone-loading" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !loading && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={handleChange}
        id="bom-file-input"
      />

      {loading ? (
        <div className="dz-state">
          <div className="dz-spinner">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="animate-spin">
              <circle cx="20" cy="20" r="16" stroke="var(--border-2)" strokeWidth="3"/>
              <path d="M20 4a16 16 0 0116 16" stroke="var(--cyan)" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="dz-title">Processing BOM…</p>
          <p className="dz-sub">Matching against master catalog</p>
        </div>
      ) : fileName ? (
        <div className="dz-state">
          <div className="dz-file-icon">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect x="4" y="2" width="22" height="32" rx="3" fill="var(--surface-3)" stroke="var(--border-2)" strokeWidth="1.5"/>
              <path d="M18 2v9h8" stroke="var(--border-2)" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M10 18h16M10 22h12M10 26h8" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="dz-title" style={{color:"var(--success)"}}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{display:"inline",verticalAlign:"middle",marginRight:4}}>
              <circle cx="7" cy="7" r="6" fill="var(--success)" fillOpacity="0.2" stroke="var(--success)" strokeWidth="1.5"/>
              <path d="M4.5 7l2 2 3-3" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {fileName}
          </p>
          <p className="dz-sub">Drop a new file to reprocess</p>
        </div>
      ) : (
        <div className="dz-state">
          <div className="dz-icon">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <rect x="2" y="2" width="40" height="40" rx="10" stroke="var(--border-2)" strokeWidth="1.5" strokeDasharray="4 3"/>
              <path d="M22 28V16" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M16 22l6-6 6 6" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 33h16" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="dz-title">Drop your BOM file here</p>
          <p className="dz-sub">or <span className="dz-browse">browse to upload</span></p>
          <div className="dz-hints">
            <span className="badge badge-muted">.xlsx</span>
            <span className="badge badge-muted">.xls</span>
            <span className="badge badge-muted">.csv</span>
          </div>
          <p className="dz-tip">
            Required columns: <code>Description</code>, <code>Make</code>
            <br />
            Optional: <code>Qty</code>, <code>Unit</code>, <code>Catalogue No.</code>
          </p>
        </div>
      )}

      <style>{`
        .dropzone {
          border: 2px dashed var(--border-2);
          border-radius: var(--radius-xl);
          background: var(--surface);
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 240px;
          display: flex; align-items: center; justify-content: center;
        }
        .dropzone:hover { border-color: var(--cyan); background: rgba(0,212,255,0.02); }
        .dropzone-active { border-color: var(--cyan); background: rgba(0,212,255,0.04); box-shadow: var(--glow-cyan); }
        .dropzone-loading { cursor: default; opacity: 0.85; }
        .dz-state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 32px; text-align: center; }
        .dz-icon, .dz-file-icon { margin-bottom: 4px; }
        .dz-spinner { margin-bottom: 4px; }
        .dz-title { font-size: 15px; font-weight: 600; color: var(--text); }
        .dz-sub { font-size: 13px; color: var(--text-muted); }
        .dz-browse { color: var(--cyan); font-weight: 600; cursor: pointer; }
        .dz-hints { display: flex; gap: 6px; margin-top: 4px; }
        .dz-tip { font-size: 11px; color: var(--text-muted); line-height: 1.7; }
        .dz-tip code { font-family: var(--font-mono); color: var(--cyan); font-size: 11px; }
      `}</style>
    </div>
  );
}
