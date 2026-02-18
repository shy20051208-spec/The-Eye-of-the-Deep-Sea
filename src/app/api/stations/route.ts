import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const stations = await prisma.station.findMany({
        include: {
            _count: { select: { measurements: true } },
        },
        orderBy: { name: "asc" },
    });
    return NextResponse.json(stations);
}
