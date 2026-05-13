import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Providers } from "./providers";
import { NavSignOut } from "@/components/NavSignOut";
import { VoltixLogo } from "@/components/VoltixLogo";
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
          {/* ── Ambient background glows ──────────────────────────────── */}
          <div className="global-bg" aria-hidden="true">
            <div className="global-glow global-glow-1" />
            <div className="global-glow global-glow-2" />
            <div className="global-grid" />
          </div>

          <header className="nav-bar">
            <div className="container">
              <div className="nav-inner">
                {/* VoltIX Logo */}
                <Link href="/" id="nav-logo" style={{ textDecoration: "none" }}>
                  <VoltixLogo size={34} textSize={19} glow />
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

          <main style={{minHeight: "calc(100vh - 60px)", position: "relative", zIndex: 1}}>
            {children}
          </main>
        </Providers>

        <style>{`
          /* ── Fixed ambient background ── */
          .global-bg {
            position: fixed; inset: 0; z-index: 0;
            pointer-events: none; overflow: hidden;
          }
          .global-glow {
            position: absolute; border-radius: 50%;
            filter: blur(100px); opacity: 0.55;
            animation: bgDrift 18s ease-in-out infinite alternate;
          }
          .global-glow-1 {
            width: 700px; height: 700px;
            background: radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%);
            top: -200px; left: -150px;
            animation-delay: 0s;
          }
          .global-glow-2 {
            width: 500px; height: 500px;
            background: radial-gradient(circle, rgba(0,212,255,0.14) 0%, transparent 70%);
            bottom: -100px; right: -100px;
            animation-delay: -9s;
          }
          @keyframes bgDrift {
            0%   { transform: translate(0px, 0px) scale(1); }
            33%  { transform: translate(30px, -20px) scale(1.05); }
            66%  { transform: translate(-15px, 25px) scale(0.97); }
            100% { transform: translate(10px, -10px) scale(1.02); }
          }

          /* Subtle grid overlay */
          .global-grid {
            position: absolute; inset: 0;
            background-image:
              linear-gradient(rgba(124,58,237,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(124,58,237,0.03) 1px, transparent 1px);
            background-size: 56px 56px;
          }
          [data-theme="light"] .global-glow-1 {
            background: radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%);
          }
          [data-theme="light"] .global-glow-2 {
            background: radial-gradient(circle, rgba(0,150,200,0.08) 0%, transparent 70%);
          }
          [data-theme="light"] .global-grid {
            background-image:
              linear-gradient(rgba(124,58,237,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(124,58,237,0.025) 1px, transparent 1px);
          }

          /* ── Nav bar ── */
          .nav-bar {
            position: sticky; top: 0; z-index: 50;
            background: var(--nav-bg, rgba(8,8,16,0.85));
            backdrop-filter: blur(20px) saturate(1.6);
            border-bottom: 1px solid var(--border);
            height: 60px;
          }
          .nav-inner {
            display: flex; align-items: center; gap: 8px;
            height: 60px;
          }
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
