import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
    const search = url.searchParams.get("search") || "";
    const station = url.searchParams.get("station") || "";
    const seaArea = url.searchParams.get("seaArea") || "";
    const status = url.searchParams.get("status") || "";
    const sortBy = url.searchParams.get("sortBy") || "date";
    const sortOrder = (url.searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (search) {
        where.OR = [
            { station: { name: { contains: search } } },
            { station: { seaArea: { contains: search } } },
        ];
    }
    if (station) where.station = { ...where.station, name: station };
    if (seaArea) where.station = { ...where.station, seaArea };
    if (status) where.status = status;

    const [measurements, total] = await Promise.all([
        prisma.cTDMeasurement.findMany({
            where,
            include: { station: true },
            orderBy: { [sortBy]: sortOrder },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.cTDMeasurement.count({ where }),
    ]);

    return NextResponse.json({
        data: measurements,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    });
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const measurement = await prisma.cTDMeasurement.create({
        data: {
            stationId: body.stationId,
            date: new Date(body.date),
            depth: body.depth,
            temperature: body.temperature,
            salinity: body.salinity,
            density: body.density,
            status: body.status || "Pending",
        },
        include: { station: true },
    });
    return NextResponse.json(measurement, { status: 201 });
}
