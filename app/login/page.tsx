"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { VoltixLogo } from "@/components/VoltixLogo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
          background: var(--bg);
        }

        /* Animated background glow */
        .login-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 10%, rgba(124, 58, 237, 0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 90%, rgba(0, 212, 255, 0.12) 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        .login-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 44px 40px 40px;
          box-shadow:
            0 0 0 1px rgba(124, 58, 237, 0.12),
            0 24px 64px rgba(0, 0, 0, 0.35),
            0 4px 16px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(20px);
        }

        .login-logo { margin-bottom: 28px; }

        /* ── Heading ── */
        .login-heading {
          font-size: 22px;
          font-weight: 700;
          color: var(--text);
          margin: 0 0 6px;
          letter-spacing: -0.3px;
        }

        .login-sub {
          font-size: 13px;
          color: var(--text-dim);
          margin: 0 0 32px;
        }

        /* ── Form ── */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .login-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .login-input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text);
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }

        .login-input::placeholder { color: var(--text-dim); opacity: 0.6; }

        .login-input:focus {
          border-color: var(--purple);
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.18);
        }

        /* ── Error ── */
        .login-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
          font-size: 13px;
          font-weight: 500;
          animation: shake 0.35s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-5px); }
          40%       { transform: translateX(5px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }

        /* ── Submit Button ── */
        .login-btn {
          margin-top: 4px;
          width: 100%;
          padding: 13px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.2px;
          color: #fff;
          background: linear-gradient(135deg, #7c3aed 0%, #4f8ef7 60%, #00d4ff 100%);
          background-size: 200% 200%;
          background-position: 0% 50%;
          transition: background-position 0.4s, transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);
          position: relative;
          overflow: hidden;
        }

        .login-btn:hover:not(:disabled) {
          background-position: 100% 50%;
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(124, 58, 237, 0.55);
        }

        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .login-btn-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        /* Spinner */
        .login-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Footer ── */
        .login-footer {
          margin-top: 28px;
          text-align: center;
          font-size: 12px;
          color: var(--text-dim);
          padding-top: 20px;
          border-top: 1px solid var(--border);
        }

        .login-footer strong {
          color: var(--cyan);
          font-weight: 600;
        }

        /* Grid lines decoration */
        .login-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(124, 58, 237, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124, 58, 237, 0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }
      `}</style>

      <div className="login-root" id="login-page">
        <div className="login-grid" aria-hidden="true" />

        <motion.div
          className="login-card"
          role="main"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Staggered interior */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.18 } } }}
          >
            {/* Logo */}
            <motion.div
              className="login-logo"
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
            >
              <VoltixLogo size={44} textSize={26} />
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
    </>
  );
}
