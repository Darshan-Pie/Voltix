export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Match all routes EXCEPT:
     * - /login
     * - /api/auth (NextAuth internal endpoints)
     * - /_next (static assets)
     * - /favicon.ico
     */
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
