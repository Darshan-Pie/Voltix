import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeNetPrice } from "@/lib/pricingEngine";

// ── Auth helper ───────────────────────────────────────────────────────────────
async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session;
}

// POST /api/catalog/bulk — bulk update discountPercent for the current user's items only
// Body: { make?: string, category?: string, discountPercent: number }
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { make, category, discountPercent } = body;

    if (discountPercent == null || (discountPercent < 0 || discountPercent > 100)) {
      return NextResponse.json(
        { error: "discountPercent must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Scope to the current user's items only
    const where: Record<string, unknown> = { userId: session.user.id };
    if (make) where.make = make;
    if (category) where.category = category;

    const matching = await prisma.componentPrice.findMany({ where });

    if (matching.length === 0) {
      return NextResponse.json({ updatedCount: 0, message: "No matching components found in your catalog" });
    }

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

// GET /api/catalog/bulk — return distinct makes and categories for the current user's items
export async function GET() {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const makes = await prisma.componentPrice.findMany({
      where: { userId: session.user.id },
      distinct: ["make"],
      select: { make: true },
      orderBy: { make: "asc" },
    });
    const categories = await prisma.componentPrice.findMany({
      where: { userId: session.user.id },
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
