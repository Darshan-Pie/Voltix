"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseX: number;
  baseY: number;
  pulse: number;      // phase offset for opacity pulse
  pulseSpeed: number;
}

const MAX_NODES  = 75;
const EDGE_DIST  = 160;   // px — max distance to draw an edge
const MOUSE_DIST = 220;   // px — mouse influence radius
const NODE_SPEED = 0.35;  // max pixels per frame

/**
 * MeshNetwork — interactive canvas-based network background.
 *
 * • canvas sits at z-index:0, pointer-events:none  (UI never blocked)
 * • mouse tracked on window → cursor becomes a temporary node
 * • nodes drift slowly; near-mouse nodes are attracted subtly
 * • edges drawn with gradient (cyan → violet) at low opacity
 * • node dots glow with a soft radial gradient
 */
export function MeshNetwork() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const nodesRef   = useRef<Node[]>([]);
  const mouseRef   = useRef({ x: -9999, y: -9999, active: false });
  const rafRef     = useRef<number>(0);
  const frameRef   = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* ── Init nodes ─────────────────────────────────────────────── */
    const initNodes = () => {
      const w = canvas.width;
      const h = canvas.height;
      const count = Math.min(
        Math.floor((w * h) / 16000),
        MAX_NODES
      );
      nodesRef.current = Array.from({ length: count }, () => {
        const x = Math.random() * w;
        const y = Math.random() * h;
        return {
          x, y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * NODE_SPEED,
          vy: (Math.random() - 0.5) * NODE_SPEED,
          radius: Math.random() * 1.2 + 0.5,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.008 + Math.random() * 0.006,
        };
      });
    };

    /* ── Resize ─────────────────────────────────────────────────── */
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      initNodes();
    };

    /* ── Mouse tracking on window (canvas stays pointer-events:none) ── */
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const onMouseLeave = () => {
      mouseRef.current.active = false;
    };

    /* ── Main animation loop ────────────────────────────────────── */
    const draw = () => {
      const nodes = nodesRef.current;
      const w     = canvas.width;
      const h     = canvas.height;
      const mouse = mouseRef.current;
      const t     = (frameRef.current += 1);

      ctx.clearRect(0, 0, w, h);

      /* Update positions */
      nodes.forEach((n) => {
        // Gentle pulse around base (Lissajous-like drift)
        n.x += n.vx;
        n.y += n.vy;

        // Wrap around edges
        if (n.x < -20)   n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20)   n.y = h + 20;
        if (n.y > h + 20) n.y = -20;

        n.pulse += n.pulseSpeed;

        // Subtle mouse attraction
        if (mouse.active) {
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < MOUSE_DIST && d > 1) {
            const force = (1 - d / MOUSE_DIST) * 0.45;
            n.x += (dx / d) * force;
            n.y += (dy / d) * force;
          }
        }
      });

      /* ── Draw inter-node edges ─────────────────────────────────── */
      ctx.lineWidth = 0.7;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a  = nodes[i];
          const b  = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d  = Math.sqrt(dx * dx + dy * dy);

          if (d < EDGE_DIST) {
            const alpha = (1 - d / EDGE_DIST) * 0.18;
            // Gradient cyan → violet along each edge
            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            grad.addColorStop(0, `rgba(0,212,255,${alpha})`);
            grad.addColorStop(1, `rgba(124,58,237,${alpha})`);
            ctx.strokeStyle = grad;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      /* ── Mouse cursor edges (brighter, wider radius) ───────────── */
      if (mouse.active) {
        nodes.forEach((n) => {
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < MOUSE_DIST) {
            const alpha = (1 - d / MOUSE_DIST) * 0.55;
            ctx.strokeStyle = `rgba(0,212,255,${alpha})`;
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(n.x, n.y);
            ctx.stroke();
            ctx.lineWidth = 0.7;
          }
        });

        // Cursor node glow
        const mg = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, 10
        );
        mg.addColorStop(0, "rgba(0,212,255,0.75)");
        mg.addColorStop(0.4, "rgba(0,212,255,0.20)");
        mg.addColorStop(1, "rgba(0,212,255,0)");
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 10, 0, Math.PI * 2);
        ctx.fill();

        // Cursor dot core
        ctx.fillStyle = "rgba(0,212,255,0.95)";
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      /* ── Draw nodes ─────────────────────────────────────────────── */
      nodes.forEach((n) => {
        const opacity = 0.55 + Math.sin(n.pulse) * 0.25; // 0.30 – 0.80

        // Outer glow halo
        const glow = ctx.createRadialGradient(
          n.x, n.y, 0,
          n.x, n.y, n.radius * 6
        );
        glow.addColorStop(0, `rgba(124,58,237,${opacity * 0.45})`);
        glow.addColorStop(1, "rgba(124,58,237,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * 6, 0, Math.PI * 2);
        ctx.fill();

        // Bright core dot
        ctx.fillStyle = `rgba(200,180,255,${opacity})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    /* ── Wire up ────────────────────────────────────────────────── */
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    resize();
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",   // UI is never blocked
        display: "block",
      }}
    />
  );
}
