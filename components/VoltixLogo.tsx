"use client";

import { motion } from "framer-motion";

/**
 * VoltixLogo — Advanced SVG wordmark: V O(circuit) L T I(bolt) X
 *
 * Intrinsic canvas: 292 × 72  (aspect ≈ 4.06 : 1)
 * Rendered height is controlled by the `size` prop; width scales proportionally.
 *
 * ── Letter strategy ────────────────────────────────────────────────────────
 * V, O, L, T, X  →  individual <text> elements, each with a forced `textLength`
 *   attribute. This makes their widths deterministic regardless of whether
 *   BankGothic, Orbitron, or system-ui is the font that actually loads,
 *   so the circuit-O overlay and bolt-I position are always pixel-perfect.
 *   All use fill="currentColor" → white in dark mode, black in light mode.
 *
 * Circuit 'O'  →  standard text "O" plus a cyan overlay group (diagonal arm
 *   with end-nodes and a centre dot) drawn on top. Glow filter applied only
 *   to the cyan elements so the O letterform stays sharp.
 *
 * Lightning 'I'  →  custom <path> zigzag bolt between T and X.
 *   Filled with a top→bottom cyan-to-violet linearGradient. Never currentColor.
 *   A wider horizontal slash parallelogram (also gradient-filled) cuts across
 *   the bolt, pointing leftward toward T.
 *
 * Props
 *   size      — rendered height in px (width auto-scales, default 34)
 *   glow      — enable Framer Motion drop-shadow keyframe pulse
 *   className — forwarded to the root <span>
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

// ── Intrinsic canvas dimensions ───────────────────────────────────────────────
const VW = 292;  // viewBox width
const VH = 72;   // viewBox height

// ── Typography ────────────────────────────────────────────────────────────────
// BankGothic is commercial; Orbitron is the loaded web-font fallback (imported
// in globals.css). system-ui catches everything else.
const FONT = "BankGothic, 'Bank Gothic', 'Orbitron', system-ui, sans-serif";
const FS   = 62;   // font-size (viewBox units)
const FW   = 900;  // font-weight
const BY   = 57;   // baseline y

// ── Letter positions (x) and forced widths (textLength) ───────────────────────
// Using textLength makes glyph advance deterministic across all font fallbacks.
//   Letter  x    textLength   ends-at
//   V       4    44           48
//   O      51    48           99   ← circuit overlay centred here
//   L     103    40          143
//   T     145    44          189
//   [I bolt spans ≈ 193–211, centre 202]
//   X     215    44          259
//   (right margin 292-259 = 33px to balance left margin + bolt gap)

const LETTERS = [
  { ch: "V", x:   4, tl: 44 },
  { ch: "O", x:  51, tl: 48 },  // ← O centre-x = 51 + 48/2 = 75
  { ch: "L", x: 103, tl: 40 },
  { ch: "T", x: 145, tl: 44 },
  { ch: "X", x: 215, tl: 44 },
] as const;

// ── Circuit O overlay (all coordinates in viewBox space) ──────────────────────
const OCX = 75;   // centre-x of the O letter  (51 + 48/2)
const OCY = 35;   // centre-y of the O letter  (visual centre of cap)
const OIR = 4.5;  // inner / centre node radius
const OOR = 3.5;  // outer node radius
const OAR = 22;   // arm reach from centre (stays inside the O's counter)

//  45° unit vector:  cos(45°) = sin(45°) = √½ ≈ 0.7071
const D    = Math.SQRT1_2;
//  Top-right end-node
const ETX  = Math.round(OCX + OAR * D);   // 91
const ETY  = Math.round(OCY - OAR * D);   // 19
//  Bottom-left end-node
const EBX  = Math.round(OCX - OAR * D);   // 59
const EBY  = Math.round(OCY + OAR * D);   // 51
//  Arm starts at inner-node edge (not dead-centre, avoids drawing over the dot)
const ASR  = OIR + 1;   // arm-start radius = inner-node edge + 1 px gap
const AS1X = Math.round(OCX + ASR * D);   // 79
const AS1Y = Math.round(OCY - ASR * D);   // 31
const AS2X = Math.round(OCX - ASR * D);   // 71
const AS2Y = Math.round(OCY + ASR * D);   // 39

// ── Lightning bolt 'I' (userSpaceOnUse, matched to FS=62 cap height) ─────────
// Bolt occupies x 193–212, y 7–65. Width ≈ 19 px, height ≈ 58 px.
// Classic 2-kink zigzag: upper arm tilts left, lower arm tilts left.
const BOLT = [
  "M 208  7",  // top-right
  "L 196 36",  // mid-left (upper half ends)
  "L 203 36",  // right kink
  "L 192 65",  // bottom-left
  "L 204 43",  // lower-right
  "L 211 43",  // outer-right kink
  "Z",
].join(" ");

// Horizontal slash — narrow parallelogram pointing leftward toward T.
// Tip sits at x≈191 (2 px clear of T's right edge at 189).
// The gradient fades from opaque cyan on the right to transparent on the left,
// so it "fades into" the T without hard clipping.
const SLASH = "M 212 20  L 192 12  L 189 24  L 209 32  Z";

// ── Brand colours ─────────────────────────────────────────────────────────────
const CYAN   = "#00E5FF";
const BLUE   = "#3B82F6";
const VIOLET = "#7C3AED";

// ── Component ─────────────────────────────────────────────────────────────────
export function VoltixLogo({
  size      = 34,
  className = "",
  glow      = false,
}: VoltixLogoProps) {
  const renderedWidth = Math.round((size / VH) * VW);

  const glowAnimate = glow
    ? {
        filter: [
          "drop-shadow(0 0 2px rgba(0,229,255,0.25)) drop-shadow(0 0 1px rgba(124,58,237,0.15))",
          "drop-shadow(0 0 9px rgba(0,229,255,0.65)) drop-shadow(0 0 3px rgba(124,58,237,0.20))",
          "drop-shadow(0 0 6px rgba(124,58,237,0.55)) drop-shadow(0 0 2px rgba(0,229,255,0.20))",
          "drop-shadow(0 0 2px rgba(0,229,255,0.25)) drop-shadow(0 0 1px rgba(124,58,237,0.15))",
        ],
      }
    : {};

  return (
    <motion.span
      className={`voltix-logo-root ${className}`}
      aria-label="VOLTIX"
      style={{ display: "inline-flex", alignItems: "center" }}
      animate={glowAnimate}
      transition={glow ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : {}}
      whileHover={{
        filter: glow
          ? "drop-shadow(0 0 14px rgba(0,229,255,0.80)) drop-shadow(0 0 5px rgba(124,58,237,0.40))"
          : "drop-shadow(0 0 5px rgba(0,229,255,0.40))",
        transition: { type: "spring", stiffness: 380, damping: 20 },
      }}
    >
      <svg
        width={renderedWidth}
        height={size}
        viewBox={`0 0 ${VW} ${VH}`}
        fill="none"
        aria-hidden="true"
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          {/*
           * Neon glow applied only to the cyan circuit-O elements.
           * Keeping it off the letterforms preserves their crisp edges.
           */}
          <filter id="vx-circuit-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.0" result="blurred" />
            <feMerge>
              <feMergeNode in="blurred" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/*
           * Stronger glow for the I-bolt. Larger stdDeviation gives the
           * bolt a more electric, high-voltage feel.
           */}
          <filter id="vx-bolt-glow" x="-80%" y="-50%" width="260%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.0" result="blurred" />
            <feMerge>
              <feMergeNode in="blurred" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/*
           * Bolt fill — top-to-bottom in userSpaceOnUse so the gradient
           * tracks the actual bolt geometry (y 7 → y 65).
           */}
          <linearGradient id="vx-bolt-grad" x1="202" y1="7" x2="200" y2="65"
            gradientUnits="userSpaceOnUse">
            <stop offset="0"    stopColor={CYAN}   />
            <stop offset="0.55" stopColor={BLUE}   />
            <stop offset="1"    stopColor={VIOLET} />
          </linearGradient>

          {/*
           * Slash fill — left-to-right, fading from opaque at the right tip
           * to transparent at the left, so it dissolves toward T gracefully.
           */}
          <linearGradient id="vx-slash-grad" x1="212" y1="22" x2="189" y2="22"
            gradientUnits="userSpaceOnUse">
            <stop offset="0"   stopColor={CYAN}              />
            <stop offset="0.6" stopColor={CYAN} stopOpacity="0.50" />
            <stop offset="1"   stopColor={CYAN} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* ═══════════════════════════════════════════════════════════════
            Standard letters: V  O  L  T  X
            Each uses fill="currentColor" — resolved by the #nav-logo CSS
            rule to var(--text) so it is always white/black per theme,
            never the browser's default link purple.
            textLength forces consistent advance widths across all fonts.
            ═══════════════════════════════════════════════════════════════ */}
        {LETTERS.map(({ ch, x, tl }) => (
          <text
            key={ch}
            x={x}
            y={BY}
            fontFamily={FONT}
            fontWeight={FW}
            fontSize={FS}
            textLength={tl}
            lengthAdjust="spacingAndGlyphs"
            fill="currentColor"
          >
            {ch}
          </text>
        ))}

        {/* ═══════════════════════════════════════════════════════════════
            Circuit O overlay
            Sits directly on top of the "O" text element.
            Only the cyan elements carry the glow filter — the text O
            itself stays sharp underneath.
            ═══════════════════════════════════════════════════════════════ */}
        <g filter="url(#vx-circuit-glow)">
          {/* Diagonal arm — bottom-left to top-right */}
          <line
            x1={EBX} y1={EBY}
            x2={ETX} y2={ETY}
            stroke={CYAN}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Centre node */}
          <circle cx={OCX} cy={OCY} r={OIR} fill={CYAN} />
          {/* Top-right outer node */}
          <circle cx={ETX} cy={ETY} r={OOR} fill={CYAN} />
          {/* Bottom-left outer node */}
          <circle cx={EBX} cy={EBY} r={OOR} fill={CYAN} />
        </g>

        {/* ═══════════════════════════════════════════════════════════════
            Lightning bolt I
            Custom path — never uses currentColor, always gradient-filled.
            The slash parallelogram sits on top with its own gradient.
            ═══════════════════════════════════════════════════════════════ */}
        <g filter="url(#vx-bolt-glow)">
          {/* Vertical zigzag bolt */}
          <path d={BOLT} fill="url(#vx-bolt-grad)" />
          {/* Horizontal slash pointing left toward T */}
          <path d={SLASH} fill="url(#vx-slash-grad)" />
        </g>
      </svg>
    </motion.span>
  );
}
