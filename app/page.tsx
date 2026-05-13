"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { StaggerReveal, RevealItem } from "@/components/PageTransition";

const FEATURE_CARDS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="2" width="18" height="18" rx="3" stroke="#00d4ff" strokeWidth="1.5"/>
        <path d="M6 7h10M6 11h10M6 15h6" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Master Catalog",
    desc: "Maintain a live database of component prices with inline editing, bulk discount updates by make/category, and full CRUD operations.",
    href: "/catalog",
    color: "var(--cyan)",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 3v10M8 10l3 3 3-3" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 14v3a1 1 0 001 1h12a1 1 0 001-1v-3" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Excel BOM Upload",
    desc: "Drop any .xlsx BOM file. The engine auto-detects column headers and maps rows — no rigid template required.",
    href: "/bom",
    color: "var(--violet)",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke="#22c55e" strokeWidth="1.5"/>
        <path d="M7.5 11l2.5 2.5 4.5-4.5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Smart Pricing Match",
    desc: "Dual-priority lookup: exact catalogue number first, then description + make. Auto-injects missing catalogue numbers from DB.",
    href: "/bom",
    color: "var(--success)",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 17l4-4 3 3 6-9" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Export & Analytics",
    desc: "Export fully enriched BOM to Excel with list price, discount, discounted rate, net amount, and match status columns.",
    href: "/bom",
    color: "var(--warning)",
  },
];

export default function HomePage() {
  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
        <div className="container hero-content">
          <StaggerReveal>
            <RevealItem>
              <div className="hero-badge">
                <span className="dot dot-success animate-pulse" style={{width:6,height:6}} />
                Electrical Panel BOM Pricing Engine
              </div>
            </RevealItem>

            <RevealItem>
              <h1>
                Intelligent BOM Pricing
                <br />
                <span className="gradient-text">at Engineering Speed</span>
              </h1>
            </RevealItem>

            <RevealItem>
              <p className="hero-desc">
                Upload your BOM Excel sheet, automatically match components to your master catalog,
                compute discounted net prices, and export enriched reports — all in seconds.
              </p>
            </RevealItem>

            <RevealItem>
              <div className="hero-actions">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link href="/catalog" className="btn btn-primary" id="cta-catalog" style={{fontSize:'14px',padding:'10px 24px'}}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M5 6h6M5 8.5h6M5 11h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Open Master Catalog
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link href="/bom" className="btn btn-violet" id="cta-bom" style={{fontSize:'14px',padding:'10px 24px'}}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M13 10V14H3V2h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 2l4 4-2 2-4-4 2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                    Process a BOM
                  </Link>
                </motion.div>
              </div>
            </RevealItem>
          </StaggerReveal>
        </div>
      </section>

      {/* Feature cards */}
      <section className="features">
        <div className="container">
          <div className="features-grid">
            {FEATURE_CARDS.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
                whileHover={{ y: -5, boxShadow: "0 20px 48px rgba(0,0,0,0.45)" }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href={f.href}
                  className="feature-card"
                  id={`feature-${f.title.toLowerCase().replace(/\s+/g,'-')}`}
                >
                  <div className="feature-icon" style={{color: f.color}}>{f.icon}</div>
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-desc">{f.desc}</p>
                  <div className="feature-arrow" style={{color: f.color}}>→</div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .home-page { overflow: hidden; }

        /* Hero */
        .hero {
          position: relative; padding: 100px 0 80px;
          text-align: center; overflow: hidden;
        }
        .hero-glow {
          position: absolute; border-radius: 50%;
          filter: blur(80px); pointer-events: none;
        }
        .hero-glow-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%);
          top: -100px; left: 50%; transform: translateX(-60%);
        }
        .hero-glow-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%);
          top: 0; right: -100px;
        }
        .hero-content { position: relative; z-index: 1; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--surface-2); border: 1px solid var(--border-2);
          border-radius: 999px; padding: 5px 14px;
          font-size: 12px; font-weight: 600; color: var(--text-dim);
          margin-bottom: 24px; letter-spacing: 0.04em;
        }
        .hero h1 { margin-bottom: 20px; }
        .hero-desc {
          color: var(--text-dim); font-size: 16px; line-height: 1.7;
          max-width: 560px; margin: 0 auto 36px;
        }
        .hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

        /* Features */
        .features { padding: 20px 0 80px; }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }
        .feature-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 24px;
          text-decoration: none; color: inherit;
          transition: border-color 0.2s ease;
          position: relative; overflow: hidden;
          display: flex; flex-direction: column; gap: 10px;
          height: 100%;
        }
        .feature-card::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%);
          pointer-events: none;
        }
        .feature-card:hover { border-color: var(--border-2); }
        .feature-icon { flex-shrink: 0; }
        .feature-title { font-size: 15px; font-weight: 700; }
        .feature-desc { font-size: 13px; color: var(--text-dim); line-height: 1.6; flex-grow: 1; }
        .feature-arrow { font-size: 18px; font-weight: 700; align-self: flex-end; }
      `}</style>
    </div>
  );
}
