import { ImageResponse } from "next/og";

/**
 * Next.js App Router dynamic favicon.
 * Renders only the lightning-bolt "I" spark from the VoltIX wordmark,
 * centered on a deep dark background — clean and instantly recognisable
 * as a browser tab icon.
 *
 * Output: 32×32 px PNG (Next.js default for icon.tsx).
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          background: "linear-gradient(135deg, #0a0a1a 0%, #0d0d22 100%)",
        }}
      >
        <svg
          width={18}
          height={24}
          viewBox="0 0 18 24"
          fill="none"
        >
          <defs>
            <linearGradient
              id="fav-grad"
              x1="0" y1="0"
              x2="18" y2="24"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00eeff" />
              <stop offset="0.45" stopColor="#3b82f6" />
              <stop offset="1"    stopColor="#7c3aed" />
            </linearGradient>
          </defs>
          {/*
            Lightning bolt drawn in a 18×24 viewport:
            Upper arm  → top-right to mid-left
            Lower arm  → mid-left to bottom-right
          */}
          <path
            d="M 11 0  L 2 14  L 9 14  L 7 24  L 18 10  L 11 10  Z"
            fill="url(#fav-grad)"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
