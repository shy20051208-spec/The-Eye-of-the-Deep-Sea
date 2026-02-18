import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const [totalRecords, verifiedCount, pendingCount, flaggedCount, avgTemp, avgSalinity, avgDensity, stationCount] =
        await Promise.all([
            prisma.cTDMeasurement.count(),
            prisma.cTDMeasurement.count({ where: { status: "Verified" } }),
            prisma.cTDMeasurement.count({ where: { status: "Pending" } }),
            prisma.cTDMeasurement.count({ where: { status: "Flagged" } }),
            prisma.cTDMeasurement.aggregate({ _avg: { temperature: true } }),
            prisma.cTDMeasurement.aggregate({ _avg: { salinity: true } }),
            prisma.cTDMeasurement.aggregate({ _avg: { density: true } }),
            prisma.station.count(),
        ]);

    return NextResponse.json({
        totalRecords,
        verifiedCount,
        pendingCount,
        flaggedCount,
        avgTemperature: Math.round((avgTemp._avg.temperature || 0) * 100) / 100,
        avgSalinity: Math.round((avgSalinity._avg.salinity || 0) * 1000) / 1000,
        avgDensity: Math.round((avgDensity._avg.density || 0) * 100) / 100,
        stationCount,
        verifiedPercentage: totalRecords > 0 ? Math.round((verifiedCount / totalRecords) * 100) : 0,
    });
}
