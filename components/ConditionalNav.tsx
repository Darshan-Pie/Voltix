"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavSignOut } from "@/components/NavSignOut";
import { VoltixLogo } from "@/components/VoltixLogo";
import { FullscreenToggle } from "@/components/FullscreenToggle";

/** Routes where the top navigation bar should be simplified. */
const AUTH_ROUTES = ["/login", "/register"];

export function ConditionalNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (isAuthRoute) {
    return (
      <div id="auth-utility-bar">
        <ThemeToggle />
        <FullscreenToggle />
      </div>
    );
  }

  return (
    <>
      <header className="nav-bar">
        <div className="nav-inner">
          {/* VoltIX Logo */}
          <Link href="/" id="nav-logo" style={{ textDecoration: "none" }}>
            <VoltixLogo size={34} glow />
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

            {/* Admin-only link — only rendered for ADMIN role */}
            {isAdmin && (
              <Link href="/admin" className="nav-link nav-link-admin" id="nav-admin">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 1L9 4H12.5L10 6.5L11 10L7 8L3 10L4 6.5L1.5 4H5L7 1Z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
                Admin
              </Link>
            )}
          </nav>

          {/* Right side controls */}
          <div className="nav-right">
            <div className="nav-status">
              <span className="dot dot-success" style={{width:6, height:6}} />
              <span>SQLite Ready</span>
            </div>
            <ThemeToggle />
            <FullscreenToggle />
            <NavSignOut />
          </div>
        </div>
      </header>

      {/* Admin nav-link accent styles — scoped to avoid touching other links */}
      <style>{`
        .nav-link-admin {
          color: var(--violet) !important;
          background: rgba(124, 58, 237, 0.08) !important;
          border: 1px solid rgba(124, 58, 237, 0.18) !important;
        }
        .nav-link-admin:hover {
          background: rgba(124, 58, 237, 0.16) !important;
          color: #a78bfa !important;
          border-color: rgba(124, 58, 237, 0.35) !important;
          box-shadow: 0 0 12px rgba(124, 58, 237, 0.20);
        }
        [data-theme="light"] .nav-link-admin {
          color: var(--violet) !important;
          background: rgba(109, 40, 217, 0.06) !important;
          border-color: rgba(109, 40, 217, 0.15) !important;
        }
        [data-theme="light"] .nav-link-admin:hover {
          background: rgba(109, 40, 217, 0.12) !important;
          border-color: rgba(109, 40, 217, 0.28) !important;
        }
      `}</style>
    </>
  );
}
