"use client";

/**
 * VoltixLogo — SVG-based scalable brand mark.
 * Props:
 *   size   — controls the icon box size (default 36)
 *   textSize — font-size for the wordmark (default 20)
 *   showText — whether to render "VoltIX" wordmark (default true)
 *   className — extra class on the root wrapper
 */

interface VoltixLogoProps {
  size?: number;
  textSize?: number;
  showText?: boolean;
  className?: string;
  /** If true, the icon glows on hover (nav version) */
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
      className={`voltix-logo-root ${glow ? "voltix-logo-glow" : ""} ${className}`}
      aria-label="VoltIX"
    >
      {/* ── Icon mark ── */}
      <span className="voltix-icon" style={{ width: size, height: size, borderRadius: r }}>
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
      </span>

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
          box-shadow: 0 2px 14px rgba(124, 58, 237, 0.5), 0 0 0 1px rgba(0,212,255,0.15);
          flex-shrink: 0;
          transition: box-shadow 0.25s, transform 0.25s;
          position: relative;
          overflow: hidden;
        }

        /* Inner shimmer layer */
        .voltix-icon::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%);
          pointer-events: none;
        }

        .voltix-logo-glow:hover .voltix-icon {
          box-shadow: 0 4px 24px rgba(124, 58, 237, 0.75), 0 0 0 1px rgba(0,212,255,0.3);
          transform: scale(1.06);
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
