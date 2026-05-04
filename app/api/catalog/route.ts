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

// GET /api/catalog — fetch only the current user's catalog items
export async function GET() {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.componentPrice.findMany({
      where: { userId: session.user.id },
      orderBy: [{ make: "asc" }, { category: "asc" }, { description: "asc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("[GET /api/catalog]", error);
    return NextResponse.json({ error: "Failed to fetch catalog" }, { status: 500 });
  }
}

// POST /api/catalog — create a new component entry owned by the current user
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      catalogNumber,
      description,
      make,
      category,
      listPrice,
      discountPercent = 0,
      entryType,
    } = body;

    if (!description || !make || !category || listPrice == null || !entryType) {
      return NextResponse.json(
        { error: "Missing required fields: description, make, category, listPrice, entryType" },
        { status: 400 }
      );
    }

    const netPrice = computeNetPrice(Number(listPrice), Number(discountPercent));

    const item = await prisma.componentPrice.create({
      data: {
        userId: session.user.id,
        catalogNumber: catalogNumber || null,
        description,
        make,
        category,
        listPrice: Number(listPrice),
        discountPercent: Number(discountPercent),
        netPrice,
        entryType,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: unknown) {
    console.error("[POST /api/catalog]", error);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A component with this description+make or catalogNumber already exists in your catalog." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to create component" }, { status: 500 });
  }
}
