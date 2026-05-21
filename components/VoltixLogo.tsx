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
const FW   = 900;
const BY   = 57;  // baseline y

// ── Brand colours ─────────────────────────────────────────────────────────────
const CYAN   = "#00E5FF";
const BLUE   = "#3B82F6";
const VIOLET = "#7C3AED";

// ── V-Spark geometry ──────────────────────────────────────────────────────────
// The V letter sits at x=4, textLength=44, so it occupies x 4–48 in viewBox.
// The cyan spark accent traces the inner right-arm channel of the V:
//   upper tip  → first kink right → second kink left → lower tip near centre
// These coordinates were measured against the Orbitron "V" glyph at FS=62.
//
//  Spark path (fills the inner-right wedge of the V):
//    Start: top of right inner arm  ≈ (36, 6)
//    Kink right (bolt elbow):        (44, 30)
//    Kink back left:                 (38, 30)
//    End: near bottom point:         (25, 57)
//    (left edge of spark)            (22, 57) → (34, 6) close
//
const V_SPARK_PATH = [
  "M 36  6",   // top-right of inner arm
  "L 45 31",   // jag out right (elbow of bolt)
  "L 39 31",   // kink back left
  "L 26 57",   // bottom-left (near V tip)
  "L 22 57",   // very bottom of V centre
  "L 34  6",   // back up to inner-arm top-left
  "Z",
].join(" ");

// Tiny highlight at the top of the bolt — a small triangle "spark head"
const V_SPARK_HEAD = [
  "M 38  4",
  "L 46 16",
  "L 41 12",
  "Z",
].join(" ");

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

// ── Lightning bolt 'I' ────────────────────────────────────────────────────────
// Sits between T (ends ≈ 189) and X (starts 215). Spans x 193–212, y 7–65.
const BOLT  = "M 208 7 L 196 36 L 203 36 L 192 65 L 204 43 L 211 43 Z";
const SLASH = "M 212 20 L 192 12 L 189 24 L 209 32 Z";

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
          style={{
            display: "block",
            // Slight drop-shadow on hover — applied here since motion.span
            // glow and hover glow are separate concerns
            filter: isHovered
              ? "drop-shadow(0 0 12px rgba(0,229,255,0.65))"
              : undefined,
            transition: "filter 0.2s ease",
          }}
        >
          <defs>
            {/* Glow for circuit O cyan elements */}
            <filter id="vx-circuit-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.0" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Glow for the I-bolt */}
            <filter id="vx-bolt-glow" x="-80%" y="-50%" width="260%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.0" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Glow for the V-Spark accent */}
            <filter id="vx-spark-glow" x="-80%" y="-60%" width="260%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.8" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Cyan→Blue→Violet gradient for the I-bolt */}
            <linearGradient id="vx-bolt-grad"
              x1="202" y1="7" x2="200" y2="65"
              gradientUnits="userSpaceOnUse">
              <stop offset="0"    stopColor={CYAN}   />
              <stop offset="0.55" stopColor={BLUE}   />
              <stop offset="1"    stopColor={VIOLET} />
            </linearGradient>

            {/* Slash gradient — fades leftward toward T */}
            <linearGradient id="vx-slash-grad"
              x1="212" y1="22" x2="189" y2="22"
              gradientUnits="userSpaceOnUse">
              <stop offset="0"   stopColor={CYAN}                   />
              <stop offset="0.6" stopColor={CYAN} stopOpacity="0.5" />
              <stop offset="1"   stopColor={CYAN} stopOpacity="0.0" />
            </linearGradient>

            {/* V-Spark accent gradient — top (bright cyan) to bottom (blue) */}
            <linearGradient id="vx-vspark-grad"
              x1="36" y1="4" x2="26" y2="57"
              gradientUnits="userSpaceOnUse">
              <stop offset="0"   stopColor={CYAN} />
              <stop offset="0.7" stopColor={BLUE} />
              <stop offset="1"   stopColor={VIOLET} />
            </linearGradient>
          </defs>

          {/* ════════════════════════════════════════════════════════════════
              V-SPARK ANCHOR — always visible
              The letter "V" is rendered as a <text> element (currentColor).
              The cyan spark accent overlays the inner-right arm channel.
              ════════════════════════════════════════════════════════════════ */}

          {/* V letter — standard text, currentColor */}
          <text x="4" y={BY} {...tp} textLength={44}>V</text>

          {/* Cyan spark accent — overlaid on right-arm inner face */}
          <g filter="url(#vx-spark-glow)">
            <path d={V_SPARK_PATH} fill="url(#vx-vspark-grad)" />
            <path d={V_SPARK_HEAD} fill={CYAN} opacity="0.90" />
          </g>

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

            {/* ── I (lightning bolt + slash) ───────────────────── */}
            <g filter="url(#vx-bolt-glow)">
              <path d={BOLT}  fill="url(#vx-bolt-grad)"  />
              <path d={SLASH} fill="url(#vx-slash-grad)" />
            </g>

            {/* ── X ───────────────────────────────────────────── */}
            <text x="215" y={BY} {...tp} textLength={44}>X</text>
          </motion.g>
        </svg>
      </motion.div>
    </motion.span>
  );
}
