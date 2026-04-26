import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeNetPrice } from "@/lib/pricingEngine";

// GET /api/catalog — fetch all components sorted by make, category, description
export async function GET() {
  try {
    const items = await prisma.componentPrice.findMany({
      orderBy: [{ make: "asc" }, { category: "asc" }, { description: "asc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("[GET /api/catalog]", error);
    return NextResponse.json({ error: "Failed to fetch catalog" }, { status: 500 });
  }
}

// POST /api/catalog — create a new component entry
export async function POST(req: NextRequest) {
  try {
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
        { error: "A component with this description+make or catalogNumber already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to create component" }, { status: 500 });
  }
}
