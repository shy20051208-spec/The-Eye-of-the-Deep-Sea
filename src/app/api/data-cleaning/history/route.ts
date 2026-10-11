import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function isMeaningfulCleaningLog(log: { summary?: string | null; action?: string | null }) {
  const summary = (log.summary ?? "").trim();
  if (!summary) return false;
  if (/0\s*条异常记录|未选中有效记录|0\s*条脏数据|共\s*0\s*条记录/.test(summary)) return false;
  return true;
}

export async function GET(req: NextRequest) {
  const stationId = req.nextUrl.searchParams.get("stationId");

  if (!stationId) {
    return NextResponse.json({ error: "stationId is required" }, { status: 400 });
  }

  const logs = await prisma.cleaningLog.findMany({
    where: { stationId },
    include: {
      user: {
        select: {
          name: true,
          initials: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const meaningfulLogs = logs.filter(isMeaningfulCleaningLog);

  return NextResponse.json({
    data: meaningfulLogs.map((log) => ({
      id: log.id,
      action: log.action,
      summary: log.summary,
      details: log.details,
      createdAt: log.createdAt,
      user: log.user,
    })),
  });
}
