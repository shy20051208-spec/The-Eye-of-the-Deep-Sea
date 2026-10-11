import { prisma } from "@/lib/prisma";
import { createAuditLog, getUserIdFromRequest } from "@/lib/audit";
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

    const actorId = getUserIdFromRequest(req);
    await createAuditLog(actorId, "measurement_updated", `Updated CTD measurement at ${measurement.station.name}: temperature=${measurement.temperature}, salinity=${measurement.salinity}, status=${measurement.status}`);

    return NextResponse.json(measurement);
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const measurement = await prisma.cTDMeasurement.findUnique({
        where: { id },
        include: { station: true },
    });

    await prisma.cTDMeasurement.delete({ where: { id } });

    const actorId = getUserIdFromRequest(_req);
    await createAuditLog(actorId, "measurement_deleted", `Deleted CTD measurement from ${measurement?.station?.name ?? "station"} at depth ${measurement?.depth ?? "-"}m`);

    return NextResponse.json({ success: true });
}
