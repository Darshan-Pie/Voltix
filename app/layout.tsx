import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Providers } from "./providers";
import { NavSignOut } from "@/components/NavSignOut";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoltIX | Electrical Panel BOM Pricing",
  description:
    "VoltIX — High-performance Electrical Panel BOM pricing engine with master catalog management, Excel ingestion, and real-time cost computation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <header className="nav-bar">
            <div className="container">
              <div className="nav-inner">
                {/* VoltIX Logo */}
                <Link href="/" className="nav-logo" id="nav-logo">
                  <div className="nav-logo-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"
                        fill="white"
                      />
                    </svg>
                  </div>
                  <span className="nav-logo-text">
                    <span className="nav-logo-volt">Volt</span>
                    <span className="nav-logo-ix">IX</span>
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
                    BOM Pricing
                  </Link>
                  <Link href="/aggregation" className="nav-link" id="nav-aggregation">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 4h4M2 7h4M2 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M8 4h4M8 7h4M8 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M6 7h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    BOM Aggregation
                  </Link>
                </nav>

                {/* Right side */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                  <div className="nav-status">
                    <span className="dot dot-success" style={{width:6, height:6}} />
                    <span>SQLite Ready</span>
                  </div>
                  <ThemeToggle />
                  <NavSignOut />
                </div>
              </div>
            </div>
          </header>

          <main style={{minHeight: "calc(100vh - 60px)"}}>
            {children}
          </main>
        </Providers>

        <style>{`
          .nav-bar {
            position: sticky; top: 0; z-index: 50;
            background: var(--nav-bg, rgba(8,8,16,0.88));
            backdrop-filter: blur(16px) saturate(1.5);
            border-bottom: 1px solid var(--border);
            height: 60px;
          }
          .nav-inner {
            display: flex; align-items: center; gap: 8px;
            height: 60px;
          }

          /* VoltIX Logo */
          .nav-logo {
            display: flex; align-items: center; gap: 10px;
            text-decoration: none; flex-shrink: 0;
          }
          .nav-logo-icon {
            width: 34px; height: 34px; border-radius: 9px;
            background: linear-gradient(135deg, #7c3aed, #00d4ff);
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 12px rgba(124,58,237,0.45);
            transition: box-shadow 0.2s, transform 0.2s;
            flex-shrink: 0;
          }
          .nav-logo:hover .nav-logo-icon {
            box-shadow: 0 4px 20px rgba(124,58,237,0.7);
            transform: scale(1.05);
          }
          .nav-logo-text {
            font-size: 18px;
            font-weight: 800;
            letter-spacing: -0.5px;
            line-height: 1;
          }
          .nav-logo-volt { color: var(--cyan); }
          .nav-logo-ix   { color: var(--text); }

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

          /* Sign out button */
          .nav-signout-btn {
            display: inline-flex; align-items: center; gap: 5px;
            padding: 5px 11px; border-radius: 7px;
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-dim);
            font-size: 12px; font-weight: 500;
            cursor: pointer;
            transition: all 0.15s;
            white-space: nowrap;
          }
          .nav-signout-btn:hover {
            background: rgba(239,68,68,0.08);
            border-color: rgba(239,68,68,0.35);
            color: #f87171;
          }
        `}</style>
      </body>
    </html>
  );
}
