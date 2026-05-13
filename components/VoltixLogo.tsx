"use client";

import { motion } from "framer-motion";

/**
 * VoltixLogo — SVG-based scalable brand mark with Framer Motion glow pulse.
 * Props:
 *   size     — controls the icon box size (default 36)
 *   textSize — font-size for the wordmark (default 20)
 *   showText — whether to render "VoltIX" wordmark (default true)
 *   className — extra class on the root wrapper
 *   glow     — if true, adds a continuous Framer Motion glow pulse on the icon
 */

interface VoltixLogoProps {
  size?: number;
  textSize?: number;
  showText?: boolean;
  className?: string;
  glow?: boolean;
}

export function VoltixLogo({
  size = 36,
  textSize = 20,
  showText = true,
  className = "",
  glow = false,
}: VoltixLogoProps) {
  const pad = size * 0.22;
  const r = size * 0.25;

  return (
    <span
      className={`voltix-logo-root ${className}`}
      aria-label="VoltIX"
    >
      {/* ── Icon mark with Framer Motion glow pulse ── */}
      <motion.span
        className="voltix-icon"
        style={{ width: size, height: size, borderRadius: r }}
        animate={
          glow
            ? {
                boxShadow: [
                  "0 2px 14px rgba(124,58,237,0.55), 0 0 0 1px rgba(0,212,255,0.15)",
                  "0 4px 28px rgba(0,212,255,0.65), 0 0 0 1px rgba(0,212,255,0.35)",
                  "0 2px 20px rgba(124,58,237,0.60), 0 0 0 1px rgba(124,58,237,0.25)",
                  "0 2px 14px rgba(124,58,237,0.55), 0 0 0 1px rgba(0,212,255,0.15)",
                ],
              }
            : {}
        }
        transition={
          glow
            ? { duration: 4, repeat: Infinity, ease: "easeInOut" }
            : {}
        }
        whileHover={
          glow
            ? {
                scale: 1.08,
                boxShadow: "0 6px 32px rgba(0,212,255,0.75), 0 0 0 1.5px rgba(0,212,255,0.5)",
                transition: { type: "spring", stiffness: 400, damping: 20 },
              }
            : { scale: 1.05, transition: { type: "spring", stiffness: 400, damping: 20 } }
        }
      >
        <svg
          width={size - pad * 2}
          height={size - pad * 2}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          {/* Lightning bolt — clean sharp "V" geometry */}
          <path
            d="M14 2L5.5 14H11.5L10 22L20.5 10H14.5L14 2Z"
            fill="url(#vx-grad)"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Small electrical node dot */}
          <circle cx="18.5" cy="7.5" r="1.5" fill="url(#vx-dot)" opacity="0.7" />
          <defs>
            <linearGradient id="vx-grad" x1="5" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00eeff" />
              <stop offset="0.55" stopColor="#4f8ef7" />
              <stop offset="1" stopColor="#7c3aed" />
            </linearGradient>
            <radialGradient id="vx-dot" cx="50%" cy="50%" r="50%">
              <stop stopColor="#00eeff" />
              <stop offset="1" stopColor="#7c3aed" />
            </radialGradient>
          </defs>
        </svg>
      </motion.span>

      {/* ── Wordmark ── */}
      {showText && (
        <span
          className="voltix-wordmark"
          style={{ fontSize: textSize, letterSpacing: "-0.04em", lineHeight: 1 }}
        >
          <span className="voltix-volt">Volt</span>
          <span className="voltix-ix">IX</span>
        </span>
      )}

      <style>{`
        .voltix-logo-root {
          display: inline-flex;
          align-items: center;
          gap: ${size * 0.28}px;
          text-decoration: none;
          user-select: none;
        }

        .voltix-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #7c3aed 0%, #1a6fff 55%, #00d4ff 100%);
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }

        /* Inner shimmer layer */
        .voltix-icon::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.20) 0%, transparent 55%);
          pointer-events: none;
        }

        .voltix-wordmark {
          font-family: 'Inter', system-ui, sans-serif;
          font-weight: 800;
          display: inline-flex;
          align-items: baseline;
          gap: 0;
        }
        .voltix-volt { color: #00d4ff; }
        .voltix-ix   { color: var(--text, #eeeef8); }

        [data-theme="light"] .voltix-volt { color: #0077aa; }
        [data-theme="light"] .voltix-ix   { color: var(--text, #111120); }
      `}</style>
    </span>
  );
}
