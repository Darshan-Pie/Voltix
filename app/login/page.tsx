"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { VoltixLogo } from "@/components/VoltixLogo";

// ── Feature list ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 5h14M2 9h10M2 13h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="14" cy="13" r="3" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M14 11.5v1.5l1 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    title: "Automated BOM Parsing",
    desc: "Ingest raw Excel files and map component headers instantly — no strict formatting templates required.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 2v14M2 9h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="9" cy="9" r="4" stroke="currentColor" strokeWidth="1.4"/>
        <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
      </svg>
    ),
    title: "Global Price Synchronisation",
    desc: "Update one master component price and propagate the calculation across thousands of BOM rows instantly.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 9l2.5 2.5L12 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Smart Cost Isolation",
    desc: "Protect unique panel design, busbar fabrication, and wiring costs from global overwrites automatically.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 14V8l7-6 7 6v6a1 1 0 01-1 1H3a1 1 0 01-1-1z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 15v-5h4v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
    title: "Master Procurement",
    desc: "Consolidate multi-panel switchgear BOMs into a single, unified purchasing list with one click.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 2l2.5 4.5H16l-3.5 3 1.5 5L9 12l-5 2.5 1.5-5L2 6.5h4.5L9 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Secure Multi-Tenancy",
    desc: "Maintain isolated, permission-based master catalogs for individual engineering teams.",
  },
];

// ── Framer Motion variants ────────────────────────────────────────────────────
const leftColVariants: Variants = {
  hidden:   {},
  visible:  { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden:   { opacity: 0, y: 22 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const cardVariants: Variants = {
  hidden:   { opacity: 0, y: 28, scale: 0.97 },
  visible:  { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: "easeOut", delay: 0.15 } },
};

// ── Page ─────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        /* ── Full-screen split layout ── */
        .sp-root {
          min-height: 100vh;
          margin-top: -86px;          /* cancel main-content padding — fills full screen */
          padding-top: 86px;          /* push content below floating nav */
          display: grid;
          grid-template-columns: 1fr;
          font-family: 'Inter', sans-serif;
          position: relative;
        }
        @media (min-width: 1024px) {
          .sp-root { grid-template-columns: 1fr 1fr; }
        }

        /* ── Left: Showcase column ── */
        .sp-left {
          display: none;
          position: relative;
          flex-direction: column;
          justify-content: center;
          padding: 64px 56px;
          overflow: hidden;
        }
        @media (min-width: 1024px) {
          .sp-left { display: flex; }
        }

        /* Vertical divider */
        .sp-left::after {
          content: '';
          position: absolute;
          right: 0; top: 10%; bottom: 10%;
          width: 1px;
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(124,58,237,0.25) 30%,
            rgba(0,212,255,0.20) 70%,
            transparent
          );
        }

        /* Glassmorphic panel behind text */
        .sp-left-glass {
          position: absolute;
          inset: 32px;
          border-radius: 28px;
          background: rgba(8, 8, 18, 0.55);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.05);
          pointer-events: none;
        }

        .sp-left-inner {
          position: relative;
          z-index: 1;
        }

        /* Logo row */
        .sp-logo { margin-bottom: 52px; }

        /* Headline */
        .sp-headline {
          font-size: clamp(2rem, 3.2vw, 2.75rem);
          font-weight: 900;
          line-height: 1.08;
          letter-spacing: -0.04em;
          color: #f0f0fa;
          margin: 0 0 12px;
        }
        .sp-headline-accent {
          display: block;
          background: linear-gradient(90deg, #00d4ff 0%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .sp-tagline {
          font-size: 14px;
          color: rgba(160,160,190,0.85);
          margin: 0 0 48px;
          line-height: 1.6;
          max-width: 360px;
        }

        /* Feature list */
        .sp-features {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .sp-feature {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .sp-feature-icon {
          flex-shrink: 0;
          width: 36px; height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(124,58,237,0.22) 0%, rgba(0,212,255,0.12) 100%);
          border: 1px solid rgba(124,58,237,0.25);
          display: flex; align-items: center; justify-content: center;
          color: #00d4ff;
        }

        .sp-feature-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #e8e8f5;
          margin: 0 0 3px;
          letter-spacing: -0.01em;
        }

        .sp-feature-desc {
          font-size: 12.5px;
          color: rgba(148,148,175,0.90);
          line-height: 1.55;
          margin: 0;
        }

        /* Bottom badge */
        .sp-badge {
          margin-top: 52px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(0,212,255,0.06);
          border: 1px solid rgba(0,212,255,0.15);
          border-radius: 999px;
          padding: 5px 14px;
          font-size: 11.5px;
          font-weight: 600;
          color: rgba(0,212,255,0.85);
          letter-spacing: 0.03em;
        }
        .sp-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #00d4ff;
          box-shadow: 0 0 8px rgba(0,212,255,0.8);
          animation: spPulse 2s ease-in-out infinite;
        }
        @keyframes spPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.8); }
        }

        /* ── Right: Auth column ── */
        .sp-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          position: relative;
        }

        /* ── Login card ── */
        .login-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          background: rgba(15, 15, 26, 0.90);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 22px;
          padding: 44px 40px 40px;
          box-shadow:
            0 0 0 1px rgba(124,58,237,0.10),
            0 24px 64px rgba(0,0,0,0.45),
            0 4px 16px rgba(0,0,0,0.25);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }

        .login-logo   { margin-bottom: 28px; }

        .login-heading {
          font-size: 22px; font-weight: 700;
          color: var(--text); margin: 0 0 6px; letter-spacing: -0.3px;
        }
        .login-sub {
          font-size: 13px; color: var(--text-dim); margin: 0 0 32px;
        }

        .login-form   { display: flex; flex-direction: column; gap: 16px; }
        .login-field  { display: flex; flex-direction: column; gap: 6px; }

        .login-label {
          font-size: 12px; font-weight: 600;
          color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.6px;
        }

        .login-input {
          width: 100%; padding: 11px 14px; border-radius: 10px;
          border: 1px solid var(--border);
          background: rgba(22, 22, 37, 0.80);
          color: var(--text); font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }
        .login-input::placeholder { color: var(--text-dim); opacity: 0.6; }
        .login-input:focus {
          border-color: var(--violet);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.18);
        }

        .login-error {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px; border-radius: 8px;
          background: rgba(239,68,68,0.10);
          border: 1px solid rgba(239,68,68,0.30);
          color: #f87171; font-size: 13px; font-weight: 500;
          animation: shake 0.35s ease;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-5px); }
          40%       { transform: translateX(5px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }

        .login-btn {
          margin-top: 4px; width: 100%; padding: 13px;
          border-radius: 10px; border: none; cursor: pointer;
          font-size: 14px; font-weight: 700;
          font-family: 'Inter', sans-serif; letter-spacing: 0.2px;
          color: #fff;
          background: linear-gradient(135deg, #7c3aed 0%, #4f8ef7 60%, #00d4ff 100%);
          background-size: 200% 200%; background-position: 0% 50%;
          transition: background-position 0.4s, transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          box-shadow: 0 4px 20px rgba(124,58,237,0.4);
          position: relative; overflow: hidden;
        }
        .login-btn:hover:not(:disabled) {
          background-position: 100% 50%;
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(124,58,237,0.55);
        }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
        .login-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .login-btn-inner {
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .login-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .login-footer {
          margin-top: 28px; text-align: center;
          font-size: 12px; color: var(--text-dim);
          padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.06);
        }
        .login-footer strong { color: var(--cyan); font-weight: 600; }

        /* Light theme */
        [data-theme="light"] .login-card {
          background: rgba(255,255,255,0.88);
          border-color: rgba(0,0,0,0.08);
        }
        [data-theme="light"] .login-input {
          background: rgba(240,242,248,0.90);
        }
        [data-theme="light"] .sp-left-glass {
          background: rgba(240,242,248,0.60);
          border-color: rgba(0,0,0,0.05);
        }
        [data-theme="light"] .sp-feature-title { color: #111120; }
        [data-theme="light"] .sp-feature-desc  { color: #555770; }
        [data-theme="light"] .sp-headline       { color: #111120; }
        [data-theme="light"] .sp-tagline        { color: #555770; }
        [data-theme="light"] .login-footer      { border-top-color: var(--border); }
      `}</style>

      <div className="sp-root" id="login-page">

        {/* ═══════════ LEFT — Showcase column ═══════════ */}
        <div className="sp-left">
          {/* Glassmorphic readability panel */}
          <div className="sp-left-glass" aria-hidden="true" />

          <motion.div
            className="sp-left-inner"
            variants={leftColVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Logo */}
            <motion.div className="sp-logo" variants={itemVariants}>
              <VoltixLogo size={38} glow />
            </motion.div>

            {/* Headline */}
            <motion.h2 className="sp-headline" variants={itemVariants}>
              Engineering Precision.
              <span className="sp-headline-accent">Automated.</span>
            </motion.h2>

            <motion.p className="sp-tagline" variants={itemVariants}>
              The intelligent BOM pricing engine built for electrical panel engineers
              who demand speed, accuracy, and control.
            </motion.p>

            {/* Features */}
            <motion.ul className="sp-features" role="list" variants={itemVariants}>
              {FEATURES.map((f, i) => (
                <motion.li
                  key={i}
                  className="sp-feature"
                  variants={itemVariants}
                  custom={i}
                >
                  <div className="sp-feature-icon" aria-hidden="true">
                    {f.icon}
                  </div>
                  <div>
                    <p className="sp-feature-title">{f.title}</p>
                    <p className="sp-feature-desc">{f.desc}</p>
                  </div>
                </motion.li>
              ))}
            </motion.ul>

            {/* Live badge */}
            <motion.div variants={itemVariants}>
              <span className="sp-badge">
                <span className="sp-badge-dot" />
                Live — SQLite database connected
              </span>
            </motion.div>
          </motion.div>
        </div>

        {/* ═══════════ RIGHT — Auth form ═══════════ */}
        <div className="sp-right">
          <motion.div
            className="login-card"
            role="main"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden:   {},
                visible:  { transition: { staggerChildren: 0.07, delayChildren: 0.28 } },
              }}
            >
              {/* Logo (visible on mobile only — hidden on desktop via left col) */}
              <motion.div
                className="login-logo"
                style={{ display: "block" }}
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
              >
                <VoltixLogo size={44} />
              </motion.div>

              {/* Heading */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
              >
                <h1 className="login-heading">Welcome back</h1>
                <p className="login-sub">Sign in to your VoltIX workspace</p>
              </motion.div>

              {/* Form */}
              <motion.form
                className="login-form"
                onSubmit={handleSubmit}
                id="login-form"
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
              >
                {error && (
                  <motion.div
                    className="login-error"
                    role="alert"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <circle cx="7" cy="7" r="6" stroke="#f87171" strokeWidth="1.5" />
                      <path d="M7 4v3.5M7 9.5v.5" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {error}
                  </motion.div>
                )}

                <div className="login-field">
                  <label htmlFor="login-email" className="login-label">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    className="login-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <div className="login-field">
                  <label htmlFor="login-password" className="login-label">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    className="login-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                <motion.button
                  id="login-submit"
                  type="submit"
                  className="login-btn"
                  disabled={loading}
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 32px rgba(124,58,237,0.6)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="login-btn-inner">
                    {loading && <span className="login-spinner" aria-hidden="true" />}
                    {loading ? "Signing in…" : "Sign in to VoltIX"}
                  </span>
                </motion.button>
              </motion.form>

              <motion.div
                className="login-footer"
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5 } } }}
              >
                <p>
                  Need an account? Ask your admin to create one via{" "}
                  <strong>Prisma Studio</strong> or the seed script.
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
