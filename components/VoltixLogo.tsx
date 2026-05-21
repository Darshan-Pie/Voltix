"use client";

import { useState } from "react";
import { motion } from "framer-motion";

/**
 * VoltixLogo — Interactive expanding wordmark
 *
 * ── Two visual states ──────────────────────────────────────────────────────
 *
 *  Collapsed (idle)
 *    Shows only the "V-Spark" icon: the letter V with the inner face of its
 *    right arm replaced by an integrated cyan lightning-bolt accent path.
 *    This is the anchor — always visible, always at x=0.
 *
 *  Expanded (hover)
 *    The rest of the wordmark — O (circuit overlay) L T I(bolt) X — slides
 *    smoothly out to the right from behind the V, expanding the logo into
 *    the full "VOLTIX" wordmark.
 *
 * ── Animation mechanism ────────────────────────────────────────────────────
 *    A `motion.div` wrapper animates its CSS `width` between the collapsed
 *    pixel width and the full wordmark pixel width with `overflow: hidden`.
 *    Simultaneously the OLTIX `<motion.g>` group animates opacity (0→1) and
 *    a small translateX (-18 → 0) for the "slide out" feel.
 *    Both transitions use the same duration so they feel unified.
 *
 * ── Intrinsic canvas ───────────────────────────────────────────────────────
 *    Full viewBox: 292 × 72   (same proportions as previous versions)
 *    V-Spark icon width in viewBox units: 54  (rendered as ICON_VW)
 *
 * Props
 *   size      — rendered height in px (width auto-scales)   default 34
 *   glow      — idle drop-shadow pulse via Framer Motion     default false
 *   className — forwarded to the outermost wrapper
 *   showText, textSize — legacy no-ops for call-site compat
 */

interface VoltixLogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
  /** @deprecated no-op */
  showText?: boolean;
  /** @deprecated no-op */
  textSize?: number;
}

// ── Canvas constants ───────────────────────────────────────────────────────────
const VH       = 72;    // viewBox height (fixed)
const FULL_VW  = 292;   // viewBox width for full wordmark
const ICON_VW  = 54;    // viewBox width for the V-Spark icon alone

// ── Typography ────────────────────────────────────────────────────────────────
const FONT = "BankGothic, 'Bank Gothic', 'Orbitron', system-ui, sans-serif";
const FS   = 62;
const FW   = 600;  // semi-bold — matches optical weight of the diagonal V strokes
const BY   = 57;  // baseline y

// ── Brand colours ─────────────────────────────────────────────────────────────
const CYAN = "#00E5FF";  // only colour used for accent elements

// ── V-Spark bolt geometry ─────────────────────────────────────────────────────
// A small, discrete lightning bolt overlaid on the LOWER portion of the V's
// right arm — matching the reference icon where the bolt is a compact accent
// at the inner-lower-right of the V, not a full-arm overlay.
//
// Uses the standard 4-point self-intersecting bolt technique:
//   M top-right → L mid-left → L mid-kink-right → L bottom-left → Z
// The closing segment from bottom-left back to top-right crosses the
// horizontal kink-segment, creating the bolt silhouette under SVG's default
// non-zero fill rule.
//
//  Bolt bounding box:  x = 36–47,  y = 33–65
//  At size=34 (scale ≈ 0.472):    x ≈ 17–22px,  y ≈ 15.6–30.7px
//  (lower-right quadrant of the collapsed icon)
//
const V_BOLT_PATH = "M 47 33 L 37 51 L 44 51 L 36 65 Z";

// ── Circuit O overlay geometry ────────────────────────────────────────────────
// O text sits at x=51, textLength=48 → centre-x = 51+24 = 75, centre-y = 35
const OCX = 75;
const OCY = 35;
const OAR = 22;   // arm reach (inside O's counter)
const OIR = 4.5;  // inner node radius
const OOR = 3.5;  // outer node radius
const D   = Math.SQRT1_2;  // cos/sin 45°

const ETX = Math.round(OCX + OAR * D);  // 91  top-right outer node
const ETY = Math.round(OCY - OAR * D);  // 19
const EBX = Math.round(OCX - OAR * D);  // 59  bottom-left outer node
const EBY = Math.round(OCY + OAR * D);  // 51

// ── 'I' slash geometry ──────────────────────────────────────────────────────────────
// A forward-leaning parallelogram — same lean angle as V_BOLT_PATH.
// V bolt lean rate: 11 left / 32 down = 0.344 per unit.
// Scaled to full cap height (52 units): 52 × 0.344 ≈ 18 units total lean.
// Width: 8 units (matches V bolt mid-step width of 7–8 units).
// Sits cleanly between T (ends x≈189) and X (starts x=215).
// Solid #00E5FF fill. Zero filters. Zero gradients.
const I_SLASH = "M 210 5 L 202 5 L 192 57 L 200 57 Z";

// ── Easing / timing ───────────────────────────────────────────────────────────
const EXPAND_TRANSITION = { duration: 0.28, ease: [0.23, 1, 0.32, 1] as const };
const FADE_TRANSITION   = { duration: 0.22, ease: "easeOut" as const, delay: 0.04 };

// ── Component ─────────────────────────────────────────────────────────────────
export function VoltixLogo({
  size      = 34,
  className = "",
  glow      = false,
}: VoltixLogoProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Scale factor: converts viewBox units → rendered px
  const scale        = size / VH;
  const fullPx       = Math.round(FULL_VW * scale);
  const iconPx       = Math.round(ICON_VW * scale);

  // Drop-shadow pulse (idle glow)
  const idleGlow = glow && !isHovered
    ? {
        filter: [
          "drop-shadow(0 0 2px rgba(0,229,255,0.20))",
          "drop-shadow(0 0 8px rgba(0,229,255,0.60)) drop-shadow(0 0 3px rgba(124,58,237,0.20))",
          "drop-shadow(0 0 5px rgba(124,58,237,0.50))",
          "drop-shadow(0 0 2px rgba(0,229,255,0.20))",
        ],
      }
    : {};

  const hoverGlow = isHovered
    ? { filter: "drop-shadow(0 0 12px rgba(0,229,255,0.70)) drop-shadow(0 0 4px rgba(124,58,237,0.35))" }
    : {};

  // Shared text props
  const tp = {
    fontFamily:    FONT,
    fontWeight:    FW as number,
    fontSize:      FS as number,
    fill:          "currentColor" as const,
    lengthAdjust:  "spacingAndGlyphs" as const,
  };

  return (
    <motion.span
      className={`voltix-logo-root ${className}`}
      aria-label="VOLTIX"
      style={{ display: "inline-flex", alignItems: "center" }}
      animate={{ ...idleGlow }}
      transition={glow ? { duration: 3.8, repeat: Infinity, ease: "easeInOut" } : {}}
    >
      {/*
       * Clipping wrapper — its width animates between iconPx (collapsed)
       * and fullPx (expanded). overflow:hidden does the clipping.
       * We need position:relative + display:block so the overflow clip works.
       */}
      <motion.div
        style={{
          overflow:    "hidden",
          display:     "block",
          height:      size,
          flexShrink:  0,
        }}
        animate={{ width: isHovered ? fullPx : iconPx }}
        transition={EXPAND_TRANSITION}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={()   => setIsHovered(false)}
      >
        {/* The SVG is always full-width inside; the wrapper clips it */}
        <svg
          width={fullPx}
          height={size}
          viewBox={`0 0 ${FULL_VW} ${VH}`}
          fill="none"
          aria-hidden="true"
          style={{ display: "block" }}
        >
          <defs>
            {/* Glow for circuit O cyan elements only.
                 The V bolt and I slash are flat solid cyan with zero filters. */}
            <filter id="vx-circuit-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.0" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ════════════════════════════════════════════════════════════════
              V-SPARK ANCHOR — always visible
              The letter "V" is rendered as a <text> element (currentColor).
              The cyan spark accent overlays the inner-right arm channel.
              ════════════════════════════════════════════════════════════════ */}

          {/* V letter — standard text, currentColor */}
          <text x="4" y={BY} {...tp} textLength={44}>V</text>

          {/* Cyan lightning bolt — solid flat #00E5FF, zero filters, zero gradients.
               Rendered on top of (after) the V text so it is always visible.
               The bolt sits in the lower-right inner area of the V arm,
               matching the reference icon geometry. */}
          <path d={V_BOLT_PATH} fill={CYAN} />

          {/* ════════════════════════════════════════════════════════════════
              OLTIX EXPANSION GROUP
              Starts collapsed (opacity 0, shifted left -18px in viewBox).
              Expands to full opacity at natural position on hover.
              ════════════════════════════════════════════════════════════════ */}
          <motion.g
            aria-hidden={!isHovered}
            animate={{
              opacity: isHovered ? 1 : 0,
              x:       isHovered ? 0 : -18,
            }}
            transition={FADE_TRANSITION}
            style={{ originX: 0 }}
          >
            {/* ── O (circuit) ─────────────────────────────────── */}
            <text x="51" y={BY} {...tp} textLength={48}>O</text>

            {/* Circuit overlay — cyan elements only get the glow */}
            <g filter="url(#vx-circuit-glow)">
              {/* Diagonal arm: bottom-left → top-right */}
              <line
                x1={EBX} y1={EBY} x2={ETX} y2={ETY}
                stroke={CYAN} strokeWidth="1.8" strokeLinecap="round"
              />
              {/* Centre node */}
              <circle cx={OCX} cy={OCY} r={OIR} fill={CYAN} />
              {/* Outer nodes */}
              <circle cx={ETX} cy={ETY} r={OOR} fill={CYAN} />
              <circle cx={EBX} cy={EBY} r={OOR} fill={CYAN} />
            </g>

            {/* ── L ───────────────────────────────────────────── */}
            <text x="103" y={BY} {...tp} textLength={40}>L</text>

            {/* ── T ───────────────────────────────────────────── */}
            <text x="145" y={BY} {...tp} textLength={44}>T</text>

            {/* ── I (forward-leaning slash) ────────────────────
                 Same lean angle as V_BOLT_PATH. Solid flat cyan.
                 Zero filters. Zero gradients. */}
            <path d={I_SLASH} fill={CYAN} />

            {/* ── X ───────────────────────────────────────────── */}
            <text x="215" y={BY} {...tp} textLength={44}>X</text>
          </motion.g>
        </svg>
      </motion.div>
    </motion.span>
  );
}
