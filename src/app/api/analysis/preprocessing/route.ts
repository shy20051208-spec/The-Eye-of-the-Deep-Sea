import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { buildCleanedMeasurements, evaluatePreprocessing } from "@/lib/data-cleaning";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { stationId } = body;

  if (!stationId) {
    return NextResponse.json({ error: "stationId is required" }, { status: 400 });
  }

  const measurements = await prisma.cTDMeasurement.findMany({
    where: { stationId },
    orderBy: { date: "asc" },
    select: { id: true, date: true, depth: true, temperature: true, salinity: true, density: true },
  });

  if (measurements.length === 0) {
    return NextResponse.json({ error: "No data available for preprocessing" }, { status: 404 });
  }

  const cleaned = buildCleanedMeasurements(
    measurements.map((m) => ({
      id: m.id,
      date: m.date,
      depth: m.depth,
      temperature: m.temperature,
      salinity: m.salinity,
      density: m.density,
    }))
  );

  const report = evaluatePreprocessing(
    measurements.map((m) => ({
      id: m.id,
      date: m.date,
      depth: m.depth,
      temperature: m.temperature,
      salinity: m.salinity,
      density: m.density,
    })),
    cleaned
  );

  return NextResponse.json({ report, cleaned });
}
