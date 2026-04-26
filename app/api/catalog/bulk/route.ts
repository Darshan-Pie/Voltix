import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeNetPrice } from "@/lib/pricingEngine";

// POST /api/catalog/bulk — bulk update discountPercent (and recompute netPrice)
// Body: { make?: string, category?: string, discountPercent: number }
// At least one of make or category must be provided.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { make, category, discountPercent } = body;

    if (discountPercent == null || (discountPercent < 0 || discountPercent > 100)) {
      return NextResponse.json(
        { error: "discountPercent must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Build the where clause dynamically
    const where: Record<string, unknown> = {};
    if (make) where.make = make;
    if (category) where.category = category;

    // Fetch all matching rows to recalculate netPrice individually
    const matching = await prisma.componentPrice.findMany({ where });

    if (matching.length === 0) {
      return NextResponse.json({ updatedCount: 0, message: "No matching components found" });
    }

    // Batch update using a transaction
    await prisma.$transaction(
      matching.map((item) => {
        const netPrice = computeNetPrice(item.listPrice, Number(discountPercent));
        return prisma.componentPrice.update({
          where: { id: item.id },
          data: { discountPercent: Number(discountPercent), netPrice },
        });
      })
    );

    return NextResponse.json({
      updatedCount: matching.length,
      message: `Updated ${matching.length} component(s) with ${discountPercent}% discount`,
    });
  } catch (error) {
    console.error("[POST /api/catalog/bulk]", error);
    return NextResponse.json({ error: "Bulk update failed" }, { status: 500 });
  }
}

// GET /api/catalog/bulk — return distinct makes and categories for filter dropdowns
export async function GET() {
  try {
    const makes = await prisma.componentPrice.findMany({
      distinct: ["make"],
      select: { make: true },
      orderBy: { make: "asc" },
    });
    const categories = await prisma.componentPrice.findMany({
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    });

    return NextResponse.json({
      makes: makes.map((m) => m.make),
      categories: categories.map((c) => c.category),
    });
  } catch (error) {
    console.error("[GET /api/catalog/bulk]", error);
    return NextResponse.json({ error: "Failed to fetch filter options" }, { status: 500 });
  }
}
