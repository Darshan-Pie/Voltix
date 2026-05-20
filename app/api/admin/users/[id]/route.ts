import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ── Admin guard ───────────────────────────────────────────────────────────────
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (session.user.role !== "ADMIN") return null;
  return session;
}

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/admin/users/[id] — update role and/or canAccessAdminCatalog
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // Only allow controlled fields — never let this endpoint touch passwords
    const allowed: Record<string, unknown> = {};
    if (body.role !== undefined) allowed.role = body.role;
    if (body.canAccessAdminCatalog !== undefined)
      allowed.canAccessAdminCatalog = body.canAccessAdminCatalog;
    if (body.name !== undefined) allowed.name = body.name;

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: allowed,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        canAccessAdminCatalog: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/admin/users/[id]]", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] — remove a user (cascade deletes their catalog items)
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/admin/users/[id]]", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
