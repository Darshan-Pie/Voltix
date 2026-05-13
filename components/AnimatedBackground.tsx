"use client";

/**
 * AnimatedBackground — Three slowly drifting aurora orbs that give the app
 * a living, breathing feel without distracting from data tables.
 *
 * • z-index: -10  →  always behind everything
 * • pointer-events: none  →  never blocks clicks
 * • Three independent keyframe paths at different speeds so they never sync
 */
export function AnimatedBackground() {
  return (
    <>
      <div className="aurora-root" aria-hidden="true">
        {/* Orb 1 — Deep violet (top-left) */}
        <div className="aurora-orb aurora-orb-1" />
        {/* Orb 2 — Electric cyan (bottom-right) */}
        <div className="aurora-orb aurora-orb-2" />
        {/* Orb 3 — Rose-violet (center-right) */}
        <div className="aurora-orb aurora-orb-3" />
        {/* Subtle dot-grid overlay */}
        <div className="aurora-grid" />
      </div>

      <style>{`
        .aurora-root {
          position: fixed;
          inset: 0;
          z-index: -10;
          pointer-events: none;
          overflow: hidden;
        }

        /* ── Base orb ── */
        .aurora-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          will-change: transform;
        }

        /* ── Orb 1: violet — top-left, large & slow ── */
        .aurora-orb-1 {
          width: 900px;
          height: 900px;
          top: -320px;
          left: -250px;
          background: radial-gradient(
            circle at 40% 40%,
            rgba(124, 58, 237, 0.20) 0%,
            rgba(79, 70, 229, 0.10) 45%,
            transparent 70%
          );
          animation: aurora1 28s ease-in-out infinite alternate;
        }

        /* ── Orb 2: cyan — bottom-right, medium & faster ── */
        .aurora-orb-2 {
          width: 700px;
          height: 700px;
          bottom: -200px;
          right: -180px;
          background: radial-gradient(
            circle at 60% 60%,
            rgba(0, 212, 255, 0.16) 0%,
            rgba(0, 150, 220, 0.08) 45%,
            transparent 70%
          );
          animation: aurora2 22s ease-in-out infinite alternate;
        }

        /* ── Orb 3: rose-violet — center-right, smallest & slowest drift ── */
        .aurora-orb-3 {
          width: 600px;
          height: 600px;
          top: 30%;
          right: -100px;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(168, 85, 247, 0.12) 0%,
            rgba(236, 72, 153, 0.06) 45%,
            transparent 70%
          );
          animation: aurora3 20s ease-in-out infinite alternate;
        }

        /* ── Three independent drift paths ── */
        @keyframes aurora1 {
          0%   { transform: translate(0px, 0px)   scale(1.00); }
          25%  { transform: translate(60px, -40px) scale(1.06); }
          50%  { transform: translate(30px, 50px)  scale(0.96); }
          75%  { transform: translate(-40px, 20px) scale(1.04); }
          100% { transform: translate(20px, -30px) scale(1.02); }
        }

        @keyframes aurora2 {
          0%   { transform: translate(0px, 0px)    scale(1.00); }
          30%  { transform: translate(-50px, 30px)  scale(1.08); }
          60%  { transform: translate(25px, -45px)  scale(0.94); }
          100% { transform: translate(-20px, 15px)  scale(1.03); }
        }

        @keyframes aurora3 {
          0%   { transform: translate(0px, 0px)    scale(1.00); }
          35%  { transform: translate(-30px, -50px) scale(1.10); }
          70%  { transform: translate(40px, 30px)   scale(0.92); }
          100% { transform: translate(-15px, -20px) scale(1.05); }
        }

        /* ── Subtle dot-grid overlay ── */
        .aurora-grid {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle, rgba(124,58,237,0.07) 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.6;
        }

        /* Light theme: much more subdued */
        [data-theme="light"] .aurora-orb-1 {
          background: radial-gradient(
            circle at 40% 40%,
            rgba(124, 58, 237, 0.07) 0%,
            transparent 70%
          );
        }
        [data-theme="light"] .aurora-orb-2 {
          background: radial-gradient(
            circle at 60% 60%,
            rgba(0, 150, 220, 0.06) 0%,
            transparent 70%
          );
        }
        [data-theme="light"] .aurora-orb-3 {
          background: radial-gradient(
            circle at 50% 50%,
            rgba(168, 85, 247, 0.05) 0%,
            transparent 70%
          );
        }
        [data-theme="light"] .aurora-grid {
          background-image:
            radial-gradient(circle, rgba(124,58,237,0.04) 1px, transparent 1px);
        }
      `}</style>
    </>
  );
}
