import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await req.json();
    const measurement = await prisma.cTDMeasurement.update({
        where: { id },
        data: {
            ...(body.depth !== undefined && { depth: body.depth }),
            ...(body.temperature !== undefined && { temperature: body.temperature }),
            ...(body.salinity !== undefined && { salinity: body.salinity }),
            ...(body.density !== undefined && { density: body.density }),
            ...(body.status !== undefined && { status: body.status }),
            ...(body.date !== undefined && { date: new Date(body.date) }),
        },
        include: { station: true },
    });
    return NextResponse.json(measurement);
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await prisma.cTDMeasurement.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
