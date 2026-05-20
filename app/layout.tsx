import type { Metadata } from "next";
import { Providers } from "./providers";
import { MeshNetwork } from "@/components/MeshNetwork";
import { ConditionalNav } from "@/components/ConditionalNav";
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
          {/* ── Network Mesh background — z:0, pointer-events:none ── */}
          <MeshNetwork />

          {/* ── Glassmorphic floating header — hidden on auth pages ── */}
          <ConditionalNav />

          <main className="main-content">
            {children}
          </main>
        </Providers>

        <style>{`
          /* ── Glassmorphic floating nav bar ── */
          .nav-bar {
            position: fixed;
            top: 14px;
            left: 14px;
            right: 14px;
            z-index: 50;
            height: 54px;
            border-radius: 18px;

            /* Glassmorphism */
            background: rgba(8, 8, 20, 0.60);
            backdrop-filter: blur(28px) saturate(1.8);
            -webkit-backdrop-filter: blur(28px) saturate(1.8);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow:
              0 8px 40px rgba(0, 0, 0, 0.45),
              0 1px 0 rgba(255,255,255,0.06) inset,
              0 0 0 0.5px rgba(124,58,237,0.15);
          }

          [data-theme="light"] .nav-bar {
            background: rgba(240, 242, 248, 0.75);
            border-color: rgba(124,58,237,0.12);
            box-shadow:
              0 8px 40px rgba(0, 0, 0, 0.12),
              0 1px 0 rgba(255,255,255,0.8) inset;
          }

          .nav-inner {
            display: flex;
            align-items: center;
            gap: 8px;
            height: 54px;
            padding: 0 18px;
          }

          .nav-links {
            display: flex;
            gap: 2px;
            margin-left: 20px;
            flex-grow: 1;
          }

          .nav-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 13px;
            border-radius: 10px;
            color: var(--text-dim);
            text-decoration: none;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.18s cubic-bezier(0.22,1,0.36,1);
            position: relative;
          }
          .nav-link:hover {
            background: rgba(255,255,255,0.07);
            color: var(--text);
            transform: translateY(-1px);
          }
          [data-theme="light"] .nav-link:hover {
            background: rgba(0,0,0,0.05);
          }

          .nav-right {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
          }

          .nav-status {
            display: flex;
            align-items: center;
            gap: 6px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 999px;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 500;
            color: var(--success);
            white-space: nowrap;
          }
          [data-theme="light"] .nav-status {
            background: rgba(0,0,0,0.04);
            border-color: rgba(0,0,0,0.08);
          }

          /* Sign out + fullscreen buttons */
          .nav-signout-btn {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 11px;
            border-radius: 9px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.08);
            color: var(--text-dim);
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.18s;
            white-space: nowrap;
            font-family: var(--font-sans);
          }
          .nav-signout-btn:hover {
            background: rgba(239,68,68,0.10);
            border-color: rgba(239,68,68,0.30);
            color: #f87171;
            transform: translateY(-1px);
          }
          #btn-fullscreen:hover {
            background: rgba(0,212,255,0.08);
            border-color: rgba(0,212,255,0.25);
            color: var(--cyan);
          }
          [data-theme="light"] .nav-signout-btn {
            background: rgba(0,0,0,0.04);
            border-color: rgba(0,0,0,0.10);
          }

          /* ── Main content pushed below floating header, above aurora orbs ── */
          .main-content {
            min-height: 100vh;
            position: relative;
            z-index: 1;          /* sits above aurora (z:0), below header (z:50) */
            padding-top: 86px;   /* 54px header + 14px gap + 18px breathing room */
          }
        `}</style>
      </body>
    </html>
  );
}
