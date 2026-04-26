import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "BOM Pricing Engine | Electrical Panel Tool",
  description:
    "High-performance Electrical Panel BOM pricing engine with master catalog management, Excel ingestion, and real-time cost computation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="nav-bar">
          <div className="container">
            <div className="nav-inner">
              {/* Logo */}
              <Link href="/" className="nav-logo" id="nav-logo">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect width="28" height="28" rx="7" fill="url(#grad)"/>
                  <path d="M7 9h14M7 14h9M7 19h12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="22" cy="14" r="3" fill="#00d4ff"/>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#7c3aed"/>
                      <stop offset="1" stopColor="#00d4ff"/>
                    </linearGradient>
                  </defs>
                </svg>
                <span>
                  <span className="nav-logo-primary">BOM</span>
                  <span className="nav-logo-secondary"> Pricer</span>
                </span>
              </Link>

              {/* Nav links */}
              <nav className="nav-links">
                <Link href="/catalog" className="nav-link" id="nav-catalog">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M4 5h6M4 7.5h6M4 10h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Catalog
                </Link>
                <Link href="/bom" className="nav-link" id="nav-bom">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2h10v10H2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 5l4 4M9 5l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  BOM Processor
                </Link>
              </nav>

              {/* Right pill */}
              <div className="nav-status">
                <span className="dot dot-success" style={{width:6, height:6}} />
                <span>SQLite Ready</span>
              </div>
            </div>
          </div>
        </header>

        <main style={{minHeight: "calc(100vh - 60px)"}}>
          {children}
        </main>

        <style>{`
          .nav-bar {
            position: sticky; top: 0; z-index: 50;
            background: rgba(8, 8, 16, 0.85);
            backdrop-filter: blur(16px) saturate(1.5);
            border-bottom: 1px solid var(--border);
            height: 60px;
          }
          .nav-inner {
            display: flex; align-items: center; gap: 8px;
            height: 60px;
          }
          .nav-logo {
            display: flex; align-items: center; gap: 10px;
            text-decoration: none; font-weight: 700; font-size: 15px;
            color: var(--text); flex-shrink: 0;
          }
          .nav-logo-primary { color: var(--cyan); }
          .nav-logo-secondary { color: var(--text-dim); }
          .nav-links { display: flex; gap: 4px; margin-left: 24px; flex-grow: 1; }
          .nav-link {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 6px 12px; border-radius: 6px;
            color: var(--text-dim); text-decoration: none;
            font-size: 13px; font-weight: 500;
            transition: all 0.15s;
          }
          .nav-link:hover { background: var(--surface-2); color: var(--text); }
          .nav-status {
            display: flex; align-items: center; gap: 6px;
            background: var(--surface-2); border: 1px solid var(--border);
            border-radius: 999px; padding: 4px 10px;
            font-size: 11px; font-weight: 500; color: var(--success);
            white-space: nowrap;
          }
        `}</style>
      </body>
    </html>
  );
}
