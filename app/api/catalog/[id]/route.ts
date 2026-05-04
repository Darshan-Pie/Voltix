import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeNetPrice } from "@/lib/pricingEngine";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ── Auth helper ───────────────────────────────────────────────────────────────
async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session;
}

// PATCH /api/catalog/[id] — partial update; verifies ownership first
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Fetch current row and verify ownership
    const current = await prisma.componentPrice.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }
    if (current.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: you do not own this item" }, { status: 403 });
    }

    const listPrice =
      body.listPrice !== undefined ? Number(body.listPrice) : current.listPrice;
    const discountPercent =
      body.discountPercent !== undefined
        ? Number(body.discountPercent)
        : current.discountPercent;

    const netPrice = computeNetPrice(listPrice, discountPercent);

    // Build update payload — only update explicitly provided fields
    const updateData: Record<string, unknown> = { listPrice, discountPercent, netPrice };
    const stringFields = ["catalogNumber", "description", "make", "category", "entryType"];
    for (const field of stringFields) {
      if (body[field] !== undefined) {
        updateData[field] = field === "catalogNumber" && !body[field] ? null : body[field];
      }
    }

    const updated = await prisma.componentPrice.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("[PATCH /api/catalog/[id]]", error);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Conflict: description+make or catalogNumber already exists in your catalog." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to update component" }, { status: 500 });
  }
}

// DELETE /api/catalog/[id] — remove a component; verifies ownership first
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership before deleting
    const item = await prisma.componentPrice.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }
    if (item.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: you do not own this item" }, { status: 403 });
    }

    await prisma.componentPrice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/catalog/[id]]", error);
    return NextResponse.json({ error: "Failed to delete component" }, { status: 500 });
  }
}
