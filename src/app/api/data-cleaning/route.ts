import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { buildCleanedMeasurements, hasMeaningfulMeasurementValues } from "@/lib/data-cleaning";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { stationId } = body;
  if (!stationId) {
    return NextResponse.json({ error: "stationId is required" }, { status: 400 });
  }

  const measurements = await prisma.cTDMeasurement.findMany({
    where: { stationId },
    orderBy: { date: "asc" },
  });

  const validMeasurements = measurements.filter((m) => hasMeaningfulMeasurementValues({
    depth: m.depth,
    temperature: m.temperature,
    salinity: m.salinity,
    density: m.density,
  }));

  const cleaned = buildCleanedMeasurements(
    validMeasurements.map((m) => ({
      id: m.id,
      date: m.date,
      depth: m.depth,
      temperature: m.temperature,
      salinity: m.salinity,
      density: m.density,
    }))
  );

  return NextResponse.json({ data: cleaned });
}
