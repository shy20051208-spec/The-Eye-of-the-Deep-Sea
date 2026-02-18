import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { detectThermocline } from "@/lib/thermocline";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { stationId } = body;

    if (!stationId) {
        return NextResponse.json({ error: "stationId is required" }, { status: 400 });
    }

    // Get all measurements for this station, sorted by depth
    const measurements = await prisma.cTDMeasurement.findMany({
        where: { stationId },
        orderBy: { depth: "asc" },
        select: { depth: true, temperature: true, salinity: true, density: true },
    });

    if (measurements.length < 3) {
        return NextResponse.json(
            { error: "Not enough data points for analysis (minimum 3)" },
            { status: 400 }
        );
    }

    // Thermocline detection
    const thermocline = detectThermocline(
        measurements.map((m) => ({ depth: m.depth, temperature: m.temperature }))
    );

    // Statistical summary
    const temps = measurements.map((m) => m.temperature);
    const salinities = measurements.map((m) => m.salinity);
    const densities = measurements.map((m) => m.density);

    const statSummary = {
        temperature: {
            min: Math.min(...temps),
            max: Math.max(...temps),
            mean: Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 100) / 100,
            std: Math.round(Math.sqrt(temps.reduce((sum, t) => sum + Math.pow(t - temps.reduce((a, b) => a + b, 0) / temps.length, 2), 0) / temps.length) * 100) / 100,
        },
        salinity: {
            min: Math.min(...salinities),
            max: Math.max(...salinities),
            mean: Math.round((salinities.reduce((a, b) => a + b, 0) / salinities.length) * 1000) / 1000,
        },
        density: {
            min: Math.min(...densities),
            max: Math.max(...densities),
            mean: Math.round((densities.reduce((a, b) => a + b, 0) / densities.length) * 100) / 100,
        },
    };

    // Profile data for charts
    const profile = measurements.map((m) => ({
        depth: m.depth,
        temperature: m.temperature,
        salinity: m.salinity,
        density: m.density,
    }));

    return NextResponse.json({
        thermocline,
        statistics: statSummary,
        profile,
        pointCount: measurements.length,
    });
}
