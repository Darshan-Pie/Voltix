"use client";

import { useSession, signOut } from "next-auth/react";

export function NavSignOut() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <button
      id="nav-signout"
      className="nav-signout-btn"
      onClick={() => signOut({ callbackUrl: "/login" })}
      title={`Signed in as ${session.user?.email ?? "user"}`}
    >
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path
          d="M5 2H3a1 1 0 00-1 1v8a1 1 0 001 1h2M9.5 9.5L12 7m0 0L9.5 4.5M12 7H5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Sign out
    </button>
  );
}
