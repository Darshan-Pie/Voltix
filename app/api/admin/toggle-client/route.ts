import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "admin@voltix.com";

// POST /api/admin/toggle-client — suspend or restore a user's access
export async function POST(req: NextRequest) {
  // ── Strict admin-only guard ─────────────────────────────────────────────────
  const session = await getServerSession(authOptions);

  if (!session || session.user?.email !== ADMIN_EMAIL) {
    return new NextResponse(
      JSON.stringify({ error: "Forbidden: Admin access required." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let userId: string;
  let isActive: boolean;

  try {
    const body = await req.json();
    userId = body.userId;
    isActive = body.isActive;

    if (typeof userId !== "string" || !userId) {
      return NextResponse.json(
        { error: "Invalid request: 'userId' must be a non-empty string." },
        { status: 400 }
      );
    }

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request: 'isActive' must be a boolean." },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  // ── Prevent admin from suspending their own account ─────────────────────────
  const adminUser = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true },
  });

  if (adminUser && adminUser.id === userId) {
    return NextResponse.json(
      { error: "Forbidden: Cannot suspend the administrator account." },
      { status: 403 }
    );
  }

  // ── Update database ─────────────────────────────────────────────────────────
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, email: true, isActive: true },
    });

    return NextResponse.json(
      {
        message: `User ${updated.email} has been ${isActive ? "restored" : "suspended"} successfully.`,
        user: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/admin/toggle-client]", error);
    return NextResponse.json(
      { error: "Internal server error: Failed to update user status." },
      { status: 500 }
    );
  }
}
