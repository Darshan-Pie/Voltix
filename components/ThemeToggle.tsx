"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // On first mount, read persisted preference (or system preference)
  useEffect(() => {
    const stored = localStorage.getItem("voltix-theme") as "dark" | "light" | null;
    const preferred =
      stored ??
      (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    setTheme(preferred);
    document.documentElement.setAttribute("data-theme", preferred);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("voltix-theme", next);
  };

  const isDark = theme === "dark";

  return (
    <button
      id="theme-toggle"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "5px 12px",
        borderRadius: "999px",
        border: "1px solid var(--border-2)",
        background: "var(--surface-2)",
        color: "var(--text-dim)",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 500,
        fontFamily: "var(--font-sans)",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {/* Animated icon track */}
      <span
        style={{
          display: "inline-flex",
          width: "32px",
          height: "18px",
          borderRadius: "999px",
          background: isDark
            ? "linear-gradient(135deg,#1e1e30,#252538)"
            : "linear-gradient(135deg,#bae6fd,#fef9c3)",
          border: "1px solid var(--border-2)",
          position: "relative",
          flexShrink: 0,
          transition: "background 0.3s ease",
        }}
      >
        {/* Sliding thumb */}
        <span
          style={{
            position: "absolute",
            top: "2px",
            left: isDark ? "2px" : "14px",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: isDark ? "#7c3aed" : "#f59e0b",
            boxShadow: isDark
              ? "0 0 6px rgba(124,58,237,0.6)"
              : "0 0 6px rgba(245,158,11,0.7)",
            transition: "left 0.25s ease, background 0.25s ease, box-shadow 0.25s ease",
          }}
        />
      </span>

      {/* Label */}
      <span style={{ color: "var(--text-dim)", letterSpacing: "0.01em" }}>
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
}
