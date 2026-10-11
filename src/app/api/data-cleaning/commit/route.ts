import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { buildCleanedMeasurements, buildVersionSnapshot, hasMeaningfulMeasurementValues, toFiniteNumber } from "@/lib/data-cleaning";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stationId, operation, selectedIds, cleanedRows } = body as {
      stationId?: string;
      operation?: string;
      selectedIds?: string[];
      cleanedRows?: Array<{ id?: string; date?: string; depth?: number; temperature?: number; salinity?: number; density?: number }>;
    };

    if (!stationId || !operation) {
      return NextResponse.json({ error: "stationId and operation are required" }, { status: 400 });
    }

    const userCookie = req.cookies.get("user")?.value;
    let userId: string | null = null;
    try {
      if (userCookie) {
        const parsed = JSON.parse(userCookie);
        userId = typeof parsed?.id === "string" ? parsed.id : null;
      }
    } catch (e) {
      // ignore malformed cookie
    }

    const stationRecord = await prisma.station.findUnique({
      where: { id: stationId },
      select: { id: true },
    });

    if (!stationRecord) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: user not found" }, { status: 401 });
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userRecord) {
      return NextResponse.json({ error: "Unauthorized: stale user session" }, { status: 401 });
    }

    if (operation === "autoClean") {
    const measurements = await prisma.cTDMeasurement.findMany({
      where: { stationId },
      orderBy: { date: "asc" },
    });

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

    const updatedRows: Array<{ id: string; temperature: number; salinity: number; depth: number }> = [];

    for (let i = 0; i < cleaned.length; i++) {
      const row = cleaned[i];
      if (row.errors.length === 0) continue;

      const original = measurements[i];
      const originalTemperature = toFiniteNumber(original?.temperature, 0);
      const originalSalinity = toFiniteNumber(original?.salinity, 0);
      const originalDepth = toFiniteNumber(original?.depth, 0);

      const correctedTemperature = row.errors.includes("Temperature out of bounds")
        ? Math.max(-2, Math.min(35, originalTemperature))
        : originalTemperature;
      const correctedSalinity = row.errors.includes("Salinity out of bounds")
        ? Math.max(0, Math.min(42, originalSalinity))
        : originalSalinity;
      const correctedDepth = row.errors.includes("Depth negative")
        ? Math.max(0, originalDepth)
        : originalDepth;

      await prisma.cTDMeasurement.update({
        where: { id: row.id },
        data: {
          temperature: correctedTemperature,
          salinity: correctedSalinity,
          depth: correctedDepth,
          status: "Cleaned",
        },
      });

      updatedRows.push({
        id: row.id,
        temperature: correctedTemperature,
        salinity: correctedSalinity,
        depth: correctedDepth,
      });
    }

    if (updatedRows.length === 0) {
      return NextResponse.json({
        success: true,
        summary: "当前站点无需要校正的异常记录",
        updated: [],
      });
    }

    let logSummary = `自动校正 ${updatedRows.length} 条异常记录`;
    try {
      const logEntry = await prisma.cleaningLog.create({
        data: {
          stationId,
          userId,
          action: "autoClean",
          summary: logSummary,
          details: JSON.stringify({ updatedCount: updatedRows.length, updatedRows }),
        },
      });
      logSummary = logEntry.summary;
    } catch (logError) {
      console.warn("autoClean log creation skipped:", logError instanceof Error ? logError.message : logError);
    }

    return NextResponse.json({
      success: true,
      summary: logSummary,
      updated: updatedRows,
    });
  }

  if (operation === "removeSelected") {
    if (!selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0) {
      return NextResponse.json({ error: "selectedIds are required for removeSelected" }, { status: 400 });
    }

    const deleteResult = await prisma.cTDMeasurement.deleteMany({
      where: {
        id: { in: selectedIds },
        stationId,
      },
    });

    if (deleteResult.count === 0) {
      return NextResponse.json({
        success: true,
        summary: "未选中有效记录，无需剔除",
        removedIds: [],
        deletedCount: 0,
      });
    }

    let logSummary = `人工剔除 ${deleteResult.count} 条脏数据`;
    try {
      const logEntry = await prisma.cleaningLog.create({
        data: {
          stationId,
          userId,
          action: "removeSelected",
          summary: logSummary,
          details: JSON.stringify({ deletedCount: deleteResult.count, deletedIds: selectedIds }),
        },
      });
      logSummary = logEntry.summary;
    } catch (logError) {
      console.warn("removeSelected log creation skipped:", logError instanceof Error ? logError.message : logError);
    }

    return NextResponse.json({
      success: true,
      summary: logSummary,
      removedIds: selectedIds,
      deletedCount: deleteResult.count,
    });
  }

  if (operation === "saveCurrent") {
    if (!cleanedRows || !Array.isArray(cleanedRows) || cleanedRows.length === 0) {
      return NextResponse.json({ error: "cleanedRows are required for saveCurrent" }, { status: 400 });
    }

    const previousRows = await prisma.cTDMeasurement.findMany({
      where: { stationId },
      orderBy: { date: "asc" },
    });

    await prisma.cTDMeasurement.deleteMany({
      where: { stationId },
    });

    const sanitizedRows = cleanedRows
      .map((row) => {
        const date = row.date ? new Date(row.date) : new Date();
        const depth = toFiniteNumber(row.depth, Number.NaN);
        const temperature = toFiniteNumber(row.temperature, Number.NaN);
        const salinity = toFiniteNumber(row.salinity, Number.NaN);
        const density = toFiniteNumber(row.density, Number.NaN);

        if (!hasMeaningfulMeasurementValues({ depth, temperature, salinity, density })) {
          return null;
        }

        return {
          id: row.id ?? undefined,
          stationId,
          date,
          depth,
          temperature,
          salinity,
          density,
          status: "Cleaned" as const,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (sanitizedRows.length === 0) {
      return NextResponse.json({
        success: true,
        summary: "当前清洗结果中无有效记录，未写入数据库",
        savedCount: 0,
        savedRows: [],
      });
    }

    const savedRows = await Promise.all(
      sanitizedRows.map((row) => prisma.cTDMeasurement.create({ data: row }))
    );

    let logSummary = `保存 ${savedRows.length} 条清洗结果到测站`;
    try {
      const logEntry = await prisma.cleaningLog.create({
        data: {
          stationId,
          userId,
          action: "saveCurrent",
          summary: logSummary,
          details: JSON.stringify({
            savedCount: savedRows.length,
            previousSnapshot: buildVersionSnapshot(previousRows.filter((row) => hasMeaningfulMeasurementValues({
              depth: row.depth,
              temperature: row.temperature,
              salinity: row.salinity,
              density: row.density,
            })).map((row) => ({
              id: row.id,
              date: row.date,
              depth: row.depth,
              temperature: row.temperature,
              salinity: row.salinity,
              density: row.density,
            }))),
            currentSnapshot: buildVersionSnapshot(savedRows.map((row) => ({
              id: row.id,
              date: row.date,
              depth: row.depth,
              temperature: row.temperature,
              salinity: row.salinity,
              density: row.density,
            }))),
          }),
        },
      });
      logSummary = logEntry.summary;
    } catch (logError) {
      console.warn("saveCurrent log creation skipped:", logError instanceof Error ? logError.message : logError);
    }

    return NextResponse.json({
      success: true,
      summary: logSummary,
      savedCount: savedRows.length,
      savedRows: savedRows.map((row) => ({
        id: row.id,
        depth: row.depth,
        temperature: row.temperature,
        salinity: row.salinity,
        density: row.density,
      })),
    });
  }

  if (operation === "rollbackToPrevious") {
    const previousLogs = await prisma.cleaningLog.findMany({
      where: { stationId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const targetLog = previousLogs.find((log) => log.action === "saveCurrent" || log.action === "autoClean" || log.action === "removeSelected");

    const currentRows = await prisma.cTDMeasurement.findMany({
      where: { stationId },
      orderBy: { date: "asc" },
    });

    let restoredRows: Array<{ id: string; date: Date; depth: number; temperature: number; salinity: number; density: number }> = [];

    if (targetLog && targetLog.details) {
      try {
        const parsed = JSON.parse(targetLog.details) as { previousSnapshot?: any[]; currentSnapshot?: any[] };
        restoredRows = buildVersionSnapshot(parsed.previousSnapshot ?? currentRows.map((row) => ({
          id: row.id,
          date: row.date,
          depth: row.depth,
          temperature: row.temperature,
          salinity: row.salinity,
          density: row.density,
        })));
      } catch {
        restoredRows = buildVersionSnapshot(currentRows.map((row) => ({
          id: row.id,
          date: row.date,
          depth: row.depth,
          temperature: row.temperature,
          salinity: row.salinity,
          density: row.density,
        })));
      }
    } else {
      restoredRows = buildVersionSnapshot(currentRows.map((row) => ({
        id: row.id,
        date: row.date,
        depth: row.depth,
        temperature: row.temperature,
        salinity: row.salinity,
        density: row.density,
      })));
    }

    await prisma.cTDMeasurement.deleteMany({ where: { stationId } });

    await Promise.all(
      restoredRows.map((row) =>
        prisma.cTDMeasurement.create({
          data: {
            id: row.id,
            stationId,
            date: row.date,
            depth: toFiniteNumber(row.depth, 0),
            temperature: toFiniteNumber(row.temperature, 0),
            salinity: toFiniteNumber(row.salinity, 0),
            density: toFiniteNumber(row.density, 0),
            status: "Cleaned",
          },
        })
      )
    );

    let logSummary = `已回滚到上一版本，共 ${restoredRows.length} 条记录`;
    try {
      const logEntry = await prisma.cleaningLog.create({
        data: {
          stationId,
          userId,
          action: "rollbackToPrevious",
          summary: logSummary,
          details: JSON.stringify({ restoredCount: restoredRows.length, snapshot: restoredRows }),
        },
      });
      logSummary = logEntry.summary;
    } catch (logError) {
      console.warn("rollbackToPrevious log creation skipped:", logError instanceof Error ? logError.message : logError);
    }

    return NextResponse.json({
      success: true,
      summary: logSummary,
      restoredCount: restoredRows.length,
      rows: restoredRows,
    });
  }

    return NextResponse.json({ error: "Unsupported operation" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("/api/data-cleaning/commit error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
