"use client";

import { useEffect, useState } from "react";

/**
 * FullscreenToggle — Uses the native browser Fullscreen API to let the user
 * expand VoltIX to cover their entire monitor, hiding browser chrome and
 * the OS taskbar for deep-focus engineering work.
 */
export function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <button
      id="btn-fullscreen"
      className="nav-signout-btn"
      onClick={toggle}
      title={isFullscreen ? "Exit fullscreen (F11)" : "Enter fullscreen for deep focus"}
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    >
      {isFullscreen ? (
        /* Compress / exit icon */
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M5 1v3.5H1.5M13 5h-3.5V1.5M9 13v-3.5h3.5M1 9h3.5v3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        /* Expand / enter icon */
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M1 5V1.5h3.5M13 5V1.5H9.5M1 9v3.5h3.5M13 9v3.5H9.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span>{isFullscreen ? "Exit" : "Focus"}</span>
    </button>
  );
}
