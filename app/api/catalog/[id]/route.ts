import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeNetPrice } from "@/lib/pricingEngine";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/catalog/[id] — partial update; re-derives netPrice if price/discount changes
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Fetch current values to fill in any missing fields for netPrice recalculation
    const current = await prisma.componentPrice.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
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
        { error: "Conflict: description+make or catalogNumber already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to update component" }, { status: 500 });
  }
}

// DELETE /api/catalog/[id] — remove a component
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.componentPrice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/catalog/[id]]", error);
    return NextResponse.json({ error: "Failed to delete component" }, { status: 500 });
  }
}
